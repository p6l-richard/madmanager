import { NextApiRequest, NextApiResponse } from "next"
import { DocumentProcessorServiceClient } from "@google-cloud/documentai"
import { Storage } from "@google-cloud/storage"

import { prisma } from "../../lib/server/db"
import { convertCurrencyString } from "../../lib/server/parsers"

// a handler to parse send an image to the google cloud document ai api and persist it in the google cloud storage, then return the parsed data
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: Remove the Storage client here, not necessary as I only need:
  // - file name,
  // - contentType
  // both of which I can possible get in a different way?
  const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  })

  console.log("process-image.ts: req.body", req.body)
  const { imageId } = JSON.parse(req.body)
  console.log("process-image.ts: req.body.imageId", req.body.imageId)
  console.log("process-image.ts: req.body.imageId", imageId)

  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: { documentProcess: { include: { result: true } } },
  })
  // return 404 if not found
  if (!image) {
    return res.status(404).json({ error: "Image not found" })
  }
  // return the result if it already exists
  if (image.documentProcess?.result) {
    return res.status(200).json(image.documentProcess.result)
  }
  const bucket = storage.bucket(image.bucketName)

  // TODO: Store them as env vars
  const projectId = "852342095963"
  const location = "us"
  const processorId = "6e78d7e6be7beb2a"

  // Instantiate the client
  const client = new DocumentProcessorServiceClient({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  })

  // The full resource name of the processor
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`

  // Configure the batch process request.
  // note (richard): The uri field cannot currently be used for processing a document.
  // If you want to process documents stored in Google Cloud Storage, you will need to use Batch Processing following the examples provided on this page.
  // @link: https://stackoverflow.com/a/74265697/5608461
  const file = bucket.file(image.id)
  const fileMetadata = (await file.getMetadata())[0]
  const gcsOutputUri = `gs://${process.env.BUCKET_NAME}/${process.env.GCS_OUTPUT_PREFIX}`
  const request = {
    name,
    inputDocuments: {
      gcsDocuments: {
        documents: [
          {
            gcsUri: `gs://${fileMetadata.bucket}/${fileMetadata.name}`, // get the google cloud storage bucket uri from the request body
            mimeType: fileMetadata.contentType, // get the metadata from the google cloud storage bucket
          },
        ],
      },
    },
    documentOutputConfig: {
      gcsOutputConfig: {
        gcsUri: gcsOutputUri,
      },
    },
  }

  const processor = await client.getProcessor({ name })

  // Process the document
  try {
    console.log("Batch processing...")
    // Batch process document using a long-running operation.
    // You can wait for now, or get results later.
    // Note: first request to the service takes longer than subsequent
    // requests.
    const [operation] = await client.batchProcessDocuments(request)
    if (!operation || !operation.name) {
      return res.status(500).json({ error: "Operation not found" })
    }

    // Wait for operation to complete.
    const batchPromiseResponse = await operation.promise()
    // return the operation name
    console.log("Batch processing complete for operation:", operation.name)

    const file = bucket.file(
      // subfolder(s) + /0/ + filename
      `${process.env.GCS_OUTPUT_PREFIX! + operation.name.split("/").pop()}/0/${
        image.id
      }-0.json` // -0.json is added automatically?
    )
    const fileDownload = await file.download()
    const json = JSON.parse(fileDownload[0].toString("utf8"))
    const salaryData = parseSalaryDataFromText(json.text).map((row) =>
      row.map(convertCurrencyString)
    )
    // now persist everyting to the database
    Promise.all([
      await prisma.documentProcess.create({
        data: {
          result: {
            create: {
              bucketName: image.bucketName,
              fileContent: json,
              publicUrl: file.publicUrl(),
              textResponse: json.text,
              filename: file.name,
            },
          },
          operationName: operation.name,
          processorResourceName: name,
          outputGcsUri: gcsOutputUri,
          image: {
            connect: {
              id: image.id,
            },
          },
        },
      }),
      await prisma.salary.create({
        data: {
          data: salaryData,
          image: {
            connect: {
              id: image.id,
            },
          },
        },
      }),
    ])

    // now return the public url of the text response
    return res.status(200).json(salaryData)
  } catch (error) {
    console.log("ERROR FETCHING FROM GOOOOOGLE")
    console.dir(error, { depth: 5 })
    res.status(500).send(error)
  }
}

// UTIL
export const parseSalaryDataFromText = (responseText: string) => {
  console.dir(responseText) // this looks something like this: 'Team Salaries\n2046 CAP\nRAINERS\nA.JUDGE\nC\nOVERALL 84\n2046 CAP PEN.\n
  // trim unnecessary data
  const [trimmed, _trailingGarbage] = responseText.split("\nVIEW PLAYER CARD") // the last value is followed by: '$0\nVIEW PLAYER CARD\nSORT\nO BACK\nSAMSUNG\n'
  console.log("TRIMMED: ", trimmed)
  // separate the two detected tables
  const [teamInfo, salaryData] = trimmed.split("\nAll\nR2\n") // this seprates the salary table from the team info stuff (salary cap etc.)

  // we'll not split up the header and body data
  // note (richard): the delimiter between header & body is the second occurrence of \nNAME
  const secondNameIndex = salaryData.lastIndexOf("\nNAME\n")

  // now, split headerData
  const headerRow = salaryData
    // everything _until_ the second occurrence of \nNAME
    .substring(0, secondNameIndex)
    // split it into an array of header cells
    .split(/\n|\s/)

  // now, split the bodyData
  const bodyDataString = salaryData
    // everything _after_ the second occurrence of \nNAME
    .substring(secondNameIndex + "\nNAME\n".length, salaryData.length)

  const bodyData = bodyDataString
    // split it into an array of body cells
    .split(/\n|\s/)
  // the body data now looks something like this:
  // [
  // 'A.Ramsay', 'DT',     '29',     '85',       '6',      '1',
  // '$58.2M',   '$19.3M', '$12.6M', '$0',       '$0',     '$0',
  // '$0',       '1180',   'H.Pyne', 'QB',       '29',     '85',
  // '8',        '4',      '$164M',  '$35.5M', ...
  // ]
  // Let's obtain the bodyRows in a proper tuple [][] with as many columns as the headerRow

  const bodyRows = []
  // the below code splits the array into rows, and then cleans up the data in each row
  // note: a player's name denominates a new row
  const playerNames = bodyDataString.match(/([A-Z]\.[A-Z]\w+)/g)
  if (!playerNames) throw new Error("No player names found in body data")

  playerNames.forEach((playerName, index) => {
    // slice the player's row from the bodyData
    const row = bodyData.slice(
      // the index of the player's name determines the _start_ of the row
      bodyData.indexOf(playerName),
      // the _end_ of the row is determined by the *next* player's name OR the end of the array
      Boolean(playerNames[index + 1])
        ? bodyData.indexOf(playerNames[index + 1])
        : bodyData.length
    )

    // now, clean up the row by running the row values through a regex for every column
    console.log("This row will be cleaned up now:", row)
    const cleanedRow = []
    row.forEach((rowValue) => {
      if (cleanedRow.length === headerRow.length) {
        // early return when we already have enough cells extracted
        return
      }
      const colIndex = cleanedRow.length // we always check the current columns' regex. E.g. without any extraction, we'll check the first regex, after the first extraction we'll use the second regex, and so on.
      console.assert(
        rowRegexes[colIndex].test(rowValue),
        `rowValue (${rowValue}) does not match the regex (${rowRegexes[colIndex]}) for the column ${colIndex}`
      )
      // extract only if the value matches the regex
      if (rowRegexes[colIndex].test(rowValue)) {
        cleanedRow.push(rowValue)
      }
    })

    // we now have the cleanedRow and push that to the bodyRows
    console.log("cleanedRow: ", cleanedRow)
    bodyRows.push(cleanedRow)
  })
  // return the data table
  return [headerRow, ...bodyRows]
}

const rowRegexes = [
  // regex to match the player name, e.g. R. Wilson
  /[A-Z]\.[A-Z]\w+/,
  // regex to match the position abbreviation (MLB, LE, QB, C, etc.)
  /[A-Z]{1,3}/,
  // regex to match the age number (haven't seen any player with <20 years old or >40 years old)
  /[2-3][0-9]/,
  // regex to match the OVR rating (Haven't seen any player with <40 OVR)
  /[5-9][0-9]/,
  // regex to match the contract length (maximum contract length is 7 years + current)
  /^[1-8]$/,
  // regex to match the remaining years (maximum contract length is 7 years + current)
  /^[1-8]$/,
  // regex to match the total salary amount, $11.5M, $11.5K, $7M, etc.
  /\$[0-9.]+(M|K)/,
  // regex to match the total bonus amount as above but also $0
  /^\$[0-9]+([,\.]{0,1}[0-9]{0,2})(M|K)?$/,
  // regex to match the salary for the first year, as above
  /^\$[0-9]+([,\.]{0,1}[0-9]{0,2})(M|K)?$/,
  // regex to match the salary for the second year, as above
  /^\$[0-9]+([,\.]{0,1}[0-9]{0,2})(M|K)?$/,
  // regex to match the salary for the third year as above
  /^\$[0-9]+([,\.]{0,1}[0-9]{0,2})(M|K)?$/,
  // regex to match the salary for the fourth year as above
  /^\$[0-9]+([,\.]{0,1}[0-9]{0,2})(M|K)?$/,
  // regex to match the salary for the fifth year as above
  /^\$[0-9]+([,\.]{0,1}[0-9]{0,2})(M|K)?$/,
]

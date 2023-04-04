import { NextApiRequest, NextApiResponse } from "next"
import { Storage } from "@google-cloud/storage"

import { env } from "../../../lib/env/server.mjs"
import { prisma } from "../../../lib/server/db"
import { convertCurrencyString } from "../../../lib/server/parsers"
import { gcsOutputUri } from "../process-image.js"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { operationId } = req.query
  const operation = await prisma.longRunningOperation.findUnique({
    include: { images: true },
    where: {
      id: operationId as string,
    },
  })
  if (!operation) {
    return res.status(404).json({ error: "Operation not found" })
  }
  if (!operation?.images.length) {
    return res
      .status(404)
      .json({ error: `No images associated with operation id ${operationId}` })
  }
  let imgIndex = 0

  // parse the salary data & persist to DB for each image
  for (const image of operation.images) {
    // Get the results of the batch process using the operation name to parse the salaryData
    const bucket = new Storage({
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: env.GOOGLE_CLOUD_PRIVATE_KEY,
      },
    }).bucket(image.bucketName)

    const file = bucket.file(
      // subfolder(s) + /0/ + filename
      `${
        env.GOOGLE_CLOUD_STORAGE_OUTPUT_PREFIX +
        operation.lroName.split("/").pop()
      }/${imgIndex}/${image.id}-0.json` // -0.json is added automatically?
    )
    imgIndex++

    const fileDownload = await file.download()
    const json = JSON.parse(fileDownload[0].toString("utf8"))
    const salaryData = parseSalaryDataFromText(json.text).map((row) =>
      row.map(convertCurrencyString)
    )
    // Now that we have obtained our parsed result, persist everyting to the database
    Promise.all([
      // store the document ai result
      await prisma.documentProcessResult.create({
        data: {
          bucketName: image.bucketName,
          fileContent: json,
          publicUrl: file.publicUrl(),
          textResponse: json.text,
          filename: file.name,
          longRunningOperation: {
            connect: {
              id: operation.id,
            },
          },
        },
      }),
      // store our parsed data (from the result)
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
  }
  const salaryData = await prisma.salary.findMany({
    include: { image: true },
    where: {
      image: {
        longRunningOperationId: operation.id,
      },
    },
  })
  // now return the data
  return res.status(200).json(salaryData)
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

  // @ts-expect-error this would need to be types as a tuple but would need to fill the remaining array with $0's
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
    // @ts-expect-error this would need to be types as a tuple but would need to fill the remaining array with $0's
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
    // @ts-expect-error this would need to be types as a tuple but would need to fill the remaining array with $0's
    console.log("cleanedRow: ", cleanedRow)
    // @ts-expect-error this would need to be types as a tuple but would need to fill the remaining array with $0's
    bodyRows.push(cleanedRow)
  })
  // return the data table
  // @ts-expect-error this would need to be types as a tuple but would need to fill the remaining array with $0's
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

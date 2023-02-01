import { NextApiRequest, NextApiResponse } from "next"
import { DocumentProcessorServiceClient } from "@google-cloud/documentai"
import { Storage } from "@google-cloud/storage"

import { prisma } from "../../lib/server/db"
import { convertCurrencyString } from "../../lib/server/parsers"
import { parseSalaryDataFromText } from "./parse-salary"

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

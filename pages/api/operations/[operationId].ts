import { NextApiRequest, NextApiResponse } from "next"
import {
  DocumentProcessorServiceClient,
  protos,
} from "@google-cloud/documentai"

// a handler to parse send an image to the google cloud document ai api and persist it in the google cloud storage, then return the parsed data
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = new DocumentProcessorServiceClient()
  const name = `projects/852342095963/locations/us/operations/${req.query.operationId}`

  const request = new protos.google.longrunning.GetOperationRequest({ name })
  const [operation] = await client.operationsClient.getOperation(request)

  return res.status(200).json(operation)
}

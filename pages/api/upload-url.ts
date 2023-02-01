import { NextApiRequest, NextApiResponse } from "next"
import { Storage } from "@google-cloud/storage"

import { prisma } from "../../lib/server/db"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // create the image in the database to generate a unique id
  const imageDb = await prisma.image.create({
    data: {
      filename: req.query.filename as string,
      bucketName: process.env.BUCKET_NAME!,
    },
  })

  const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  })

  const bucket = storage.bucket(imageDb.bucketName)

  console.log("--- setting cors ---")
  console.log("origin: ", process.env.VERCEL_URL)
  await bucket.setCorsConfiguration([
    {
      maxAgeSeconds: 60, //  1 minute
      method: ["POST"],
      origin: [
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://madmanager.vercel.app", // VERCEL_URL contains the hash as well
      ],
      responseHeader: ["Access-Control-Allow-Origin"], // necessary for the preflight to pass
    },
  ])
  console.log("--- cors set ---")

  // create the file in GCS and get a pre-signed URL for the upload
  const file = bucket.file(imageDb.id)

  // update the image in our db with the GCS URI and the public URL
  await prisma.image.update({
    where: { id: imageDb.id },
    data: {
      gcsUri: `gs://${imageDb.bucketName}/${imageDb.id}`,
      publicUrl: file.publicUrl(),
    },
  })

  console.log("signing the URL...")
  const [response] = await file.generateSignedPostPolicyV4({
    expires: Date.now() + 1 * 60 * 1000, //  1 minute,
    fields: { "x-goog-meta-test": "data" },
    conditions: [
      ["content-length-range", 0, 1024 * 1024], // 1MB
      // ["starts-with", "$Content-Type", "image/"],
    ],
  })

  res.status(200).json(response)
}

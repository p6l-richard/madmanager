import { NextApiRequest, NextApiResponse } from "next"
import { Storage } from "@google-cloud/storage"
import { z } from "zod"

import { GOOGLE_CLOUD_STORAGE_BUCKET_NAME } from "../../lib/constants"
import { env } from "../../lib/env/server.mjs"
import { prisma } from "../../lib/server/db"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const inputValidation = z
    .object({
      filename: z.string(),
    })
    .safeParse(req.query)
  if (!inputValidation.success) {
    return res.status(400).json({ error: "Filename is required" })
  }
  // create the image in the database to generate a unique id
  const imageDb = await prisma.image.create({
    data: {
      filename: inputValidation.data.filename,
      bucketName: GOOGLE_CLOUD_STORAGE_BUCKET_NAME,
    },
  })

  const storage = new Storage({
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      client_email: env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: env.GOOGLE_CLOUD_PRIVATE_KEY,
    },
  })

  const bucket = storage.bucket(imageDb.bucketName)

  console.log("--- setting cors ---")
  await bucket.setCorsConfiguration([
    {
      maxAgeSeconds: 60, //  1 minute
      method: ["POST"],
      origin: [
        env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://madmanager.vercel.app", // VERCEL_URL contains the hash as well
      ],
      responseHeader: ["Access-Control-Allow-Origin"], // necessary for the preflight to pass
    },
  ])
  console.log("--- cors set ---")

  // create the file in GCS
  const file = bucket.file(imageDb.id)

  // update the image in our db with the GCS URI and the public URL
  await prisma.image.update({
    where: { id: imageDb.id },
    data: {
      gcsUri: `gs://${imageDb.bucketName}/${imageDb.id}`,
      publicUrl: file.publicUrl(),
    },
  })

  console.log("create the signed URL for our upload")
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

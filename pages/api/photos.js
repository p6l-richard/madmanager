import { Storage } from "@google-cloud/storage"

// a handler to fetch all photos from the GCP bucket
export default async function handler(req, res) {
  const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  })

  const bucket = storage.bucket(process.env.BUCKET_NAME)

  const [files] = await bucket.getFiles()

  const photos = files.flatMap((file) => {
    // if file is stores in output folder, ignore it
    if (file.name.includes(process.env.GCS_OUTPUT_PREFIX)) return []
    // else return the public url of the file
    return { url: file.publicUrl() }
  })

  res.status(200).json(photos)
}

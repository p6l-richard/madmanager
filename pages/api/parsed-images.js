import { Storage } from "@google-cloud/storage";

// a handler to fetch all photos from the GCP bucket
export default async function handler(req, res) {
  const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  });

  const bucket = storage.bucket(process.env.BUCKET_NAME);

  const [files] = await bucket.getFiles({
    prefix: "SALARY-FORM-PARSE-RESPONSE",
  });

  const photos = files.flatMap((file) => {
    console.log("NAME: ", file.name);
    // if file is stores in output folder, ignore it
    if (!file.name.includes("SALARY-FORM-PARSE-RESPONSE/")) return [];
    // else return the public url of the file
    return {
      url: decodeURIComponent(file.publicUrl()),
      filename: file.name,
      timestamp: file.timestamp,
    };
  });

  return res.status(200).json(photos);
}

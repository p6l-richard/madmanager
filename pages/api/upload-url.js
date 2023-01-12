import { Storage } from "@google-cloud/storage";

export default async function handler(req, res) {
  console.log("creating a presigned url for GCP");
  const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    // keyFile: "~.config/gcloud/application_default_credentials.json",
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  });

  const bucket = storage.bucket(process.env.BUCKET_NAME);

  console.log("--- setting cors ---");
  console.log("origin: ", process.env.VERCEL_URL);
  await bucket.setCorsConfiguration([
    {
      maxAgeSeconds: 60, //  1 minute
      method: ["POST"],
      origin: [
        process.env.VERCEL ? process.env.VERCEL_URL : "http://localhost:3000",
      ], // allow localhost
      responseHeader: ["Access-Control-Allow-Origin"], // necessary for the preflight to pass
    },
  ]);
  console.log("--- cors set ---");
  const [metadata] = await bucket.getMetadata();
  console.log("cors data:");
  console.log(JSON.stringify(metadata, null, 2));
  // is this the file name?
  const file = bucket.file(req.query.file);
  const options = {
    expires: Date.now() + 1 * 60 * 1000, //  1 minute,
    fields: { "x-goog-meta-test": "data" },
    conditions: [
      ["content-length-range", 0, 1024 * 1024], // 1MB
      // ["starts-with", "$Content-Type", "image/"],
    ],
  };
  console.log("signing...");
  const [response] = await file.generateSignedPostPolicyV4(options);
  // console.dir(response, { depth: 5 });
  res.status(200).json(response);
}

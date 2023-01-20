import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { Storage } from "@google-cloud/storage";

// a handler to parse send an image to the google cloud document ai api and persist it in the google cloud storage, then return the parsed data
export default async function handler(req, res) {
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
  });

  const bucket = storage.bucket(process.env.BUCKET_NAME);

  // TODO: Store them as env vars
  const projectId = "852342095963";
  const location = "us";
  const processorId = "6e78d7e6be7beb2a";

  // Instantiate the client
  const client = new DocumentProcessorServiceClient({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  });

  // The full resource name of the processor
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  // Configure the batch process request.
  // note (richard): The uri field cannot currently be used for processing a document.
  // If you want to process documents stored in Google Cloud Storage, you will need to use Batch Processing following the examples provided on this page.
  // @link: https://stackoverflow.com/a/74265697/5608461
  const fileName = req.body.imageUrl.split(/\/|:|_/).pop();
  const file = bucket.file(fileName);
  const fileMetadata = (await file.getMetadata())[0];
  console.log("FILE NAME: ", fileName);
  console.log("METADATA: ");
  console.dir(fileMetadata);
  const gcsOutputUri = `gs://${process.env.BUCKET_NAME}/${process.env.GCS_OUTPUT_PREFIX}`;
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
  };

  const processor = await client.getProcessor({ name });
  console.log("PROCESSOR: ", processor);

  // Process the document
  try {
    console.log("Batch processing...");
    // Batch process document using a long-running operation.
    // You can wait for now, or get results later.
    // Note: first request to the service takes longer than subsequent
    // requests.
    const [operation] = await client.batchProcessDocuments(request);

    // Wait for operation to complete.
    const batchPromiseResponse = await operation.promise();
    // return the operation name
    console.log("Batch processing complete for operation:", operation.name);
    const file = bucket.file(
      // subfolder(s) + /0/ + filename
      `${
        process.env.GCS_OUTPUT_PREFIX + operation.name.split("/").pop()
      }/0/${fileName.replace(
        /(\.jpeg)/,
        "-0.json" // '-0' is added automatically?
      )}`
    );

    // now return the public url of the text response
    return res.status(200).json({
      url: file.publicUrl(),
    });
  } catch (error) {
    console.log("ERROR FETCHING FROM GOOOOOGLE");
    console.dir(error, { depth: 5 });
    res.status(500).send(error);
  }
}

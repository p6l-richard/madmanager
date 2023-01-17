import { Storage } from "@google-cloud/storage";

// a nextjs request handler that downloads the json response from the google document ai api from google cloud storage and extracts the data
export default async function handler(req, res) {
  const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  });
  const bucket = storage.bucket(process.env.BUCKET_NAME);
  const file = bucket.file(req.body.fileUrl);
  // download a the file as a buffer
  const fileDownload = await file.download();
  // convert into json
  const json = JSON.parse(fileDownload[0].toString("utf8"));
  console.log("JSON: ", json);
  // parse the text response from the document ai api
  const salaryData = parseSalaryDataFromText(json.text);
  console.dir({ salaryData });
  // return the parsed salary data
  res.status(200).json(salaryData);
}
// UTIL
const parseSalaryDataFromText = (responseText) => {
  // trim unnecessary data
  const [trimmed, _] = responseText.split("\nVIEW PLAYER CARD");
  // separate the two detected tables
  const [teamInfo, salaryData] = trimmed.split("\nAll\nR2\n");

  // now, split headerData from bodyData
  // note (richard): \nNAME is occurring twice: as a header cell and also as the delimiter between header & body.
  const secondNameIndex = salaryData.lastIndexOf("\nNAME\n"); // the delimiter between header & body
  const headerData = salaryData.substring(0, secondNameIndex);
  const bodyData = salaryData.substring(
    secondNameIndex + "\nNAME\n".length,
    salaryData.length
  );

  // Now, split the data into lines to obtain clean rows
  // note (richard): this is either a new line (\n), OR a space
  const headerRow = headerData.split(/\n|\s/);
  const bodyDataTrimmed = bodyData.split(/\n|\s/);
  // console.log(bodyDataTrimmed)

  // now, split the bodyRows properly.
  // the below code iterates over the elements in the array, and extracts the number of values from the headerRow.length
  // each player is detected by matching the regex \w\.\w+, e.g. "D.Leonard".
  const bodyRows = [];
  for (let i = 0; i < bodyDataTrimmed.length; i++) {
    if (bodyDataTrimmed[i].match(/\w\.\w+/)) {
      // player name detected
      bodyRows.push(bodyDataTrimmed.slice(i, i + headerRow.length)); // store the player values
      i += headerRow.length - 1; // advance to next player
    }
  }

  console.log([headerRow, ...bodyRows]);
  return [headerRow, ...bodyRows];
};
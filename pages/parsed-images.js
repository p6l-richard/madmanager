import { useState } from "react";
import { useQuery, useMutation } from "react-query";

const getParsedImages = async () => {
  // fetches all photos from the Google Cloud Storage bucket
  const res = await fetch("/api/parsed-images");
  if (!res.ok) {
    console.error(res);
    throw Error("Failed to fetch photos.");
  }
  const images = await res.json();
  console.log(images);
  return images;
};

// parseSalary mutation that parses the response from the Google Cloud Document API from the Next.js server
const parseSalary = async (filename) => {
  const res = await fetch(
    `/api/parse-salary?filename=${encodeURIComponent(filename)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) {
    console.error(res);
    throw Error("Failed to parse salary.");
  }
  const parsedSalary = await res.json();
  return parsedSalary;
};

export default function ParsedImages() {
  const [parsedImages, setParsedImages] = useState(null);
  const parsedImagesQuery = useQuery("parsedImages", getParsedImages);
  const parseSalaryMutation = useMutation("parseSalary", parseSalary, {
    // onSuccess, persist the data to react useState:
    onSuccess: (data) => {
      setParsedImages(data);
    },
  });

  console.log(parsedImages);

  return (
    <div className="p-4 bg-gray-100">
      {parsedImagesQuery.status === "loading" && <div>Loading...</div>}
      {parsedImagesQuery.status === "error" && <div>Error: {data.message}</div>}
      {parsedImagesQuery.status === "success" && (
        <>
          <table className="w-full text-left table-collapse">
            <thead>
              <tr>
                <th className="p-2 text-sm font-medium text-white bg-gray-800">
                  Filename
                </th>
                <th className="p-2 text-sm font-medium text-white bg-gray-800">
                  Timestamp
                </th>
                <th className="p-2 text-sm font-medium text-white bg-gray-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {parsedImagesQuery.data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-200">
                  <td className="p-2">{item.filename}</td>
                  <td className="p-2">{item.timestamp}</td>
                  <td className="p-2">
                    <button
                      className="w-full px-4 py-2 font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-700"
                      onClick={() => parseSalaryMutation.mutate(item.filename)}
                    >
                      Parse salary data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-1 bg-gray-800" />
          {parseSalaryMutation.status === "loading" && (
            <div>Parsing salary data...</div>
          )}
          {parseSalaryMutation.status === "error" && (
            <div>Error parsing the data ❌</div>
          )}
          {parseSalaryMutation.status === "success" && (
            <div>
              Successfully parsed data! ✅
              <Table data={parsedImages} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React from "react";

const Table = ({ data }) => {
  return (
    <table className="table-auto">
      <thead>
        <tr>
          {data[0].map((header) => (
            <th className="px-4 py-2">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.slice(1).map((row) => (
          <tr>
            {row.map((cell) => (
              <td className="px-4 py-2">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

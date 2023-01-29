import React, { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import { Button } from "../components/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/hover-card"
import { Input } from "../components/input"
import { Label } from "../components/label"
import { cn } from "../lib/utils"

const getParsedImages = async () => {
  // fetches all photos from the Google Cloud Storage bucket
  const res = await fetch("/api/parsed-images")
  if (!res.ok) {
    console.error(res)
    throw Error("Failed to fetch photos.")
  }
  const images = await res.json()
  console.log(images)
  return images
}

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
  )
  if (!res.ok) {
    console.error(res)
    throw Error("Failed to parse salary.")
  }
  const parsedSalary = await res.json()
  return parsedSalary
}

export default function ParsedImages() {
  const [parsedImages, setParsedImages] = useState(null)
  const parsedImagesQuery = useQuery("parsedImages", getParsedImages)
  const parseSalaryMutation = useMutation("parseSalary", parseSalary, {
    // onSuccess, persist the data to react useState:
    onSuccess: (data) => {
      setParsedImages(data)
    },
  })

  console.log(parsedImages)

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
  )
}

export const Table = ({ data }) => {
  console.log({ data })
  const [dataCopy, setDataCopy] = useState(data)
  const [value, setValue] = useState(null)
  return (
    <div className="w-full my-6 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="p-0 m-0 border-t border-slate-300 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
            {dataCopy[0].map((header) => (
              <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataCopy.slice(1).map((row, rowIdx) => (
            <tr className="p-0 m-0 border-t border-slate-200 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
              {row.map((cell, colIdx) => (
                <td
                  className={cn(
                    "border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right",
                    "group cursor-help"
                  )}
                >
                  <HoverCard openDelay={500}>
                    <HoverCardTrigger>{cell}</HoverCardTrigger>
                    <HoverCardContent asChild>
                      <div className="flex justify-between space-x-4">
                        <div className="space-y-1">
                          <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="email">
                              The value is not correct?
                            </Label>
                            <div className="flex items-center w-full max-w-sm space-x-2">
                              <Input
                                id="value"
                                placeholder={cell}
                                onChange={(e) => {
                                  console.log(e)
                                  setValue(e.target.value)
                                }}
                              />
                              <Button
                                onClick={(e) => {
                                  setDataCopy((current) => {
                                    // update the single cell
                                    const copy = [...current]
                                    copy[rowIdx + 1][colIdx] = value
                                    return copy
                                  })
                                }}
                              >
                                Save
                              </Button>
                            </div>

                            <p className="text-sm text-slate-500">
                              Enter the correct one here.
                            </p>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

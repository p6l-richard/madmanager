"use client"

import { useState } from "react"
import Image from "next/image"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BookOpenCheck, Clipboard, Loader2 } from "lucide-react"

import { Button } from "../../components/button"
import {
  TypographyH3,
  TypographyLarge,
  TypographyP,
} from "../../components/typography"
import { Table, fetchSalary } from "./table"
import { UploadImage } from "./upload"

// a type representing a tuple of 13 columns and and unknown number of rows
export type SalaryData = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
][]

const IMAGE_URL = `https://storage.googleapis.com/madden-regression-bucket/salary-pic-number-zwo.jpeg`
const steps = [
  {
    id: 1,
  },
  {
    id: 2,
    title: "Salary extraction",
    description: "Let AI extract the imageId for you.",
    LeftColumn: (filename: string) => (
      <Image
        alt="screenshot uploaded by user"
        className="object-cover rounded-t-md"
        src={IMAGE_URL}
        width={400}
        height={400}
      />
    ),
  },
  {
    id: 3,
    title: "Parse salary data",
    description: "Parse the salary data in a spreadsheet format.",
  },
  {
    id: 4,
    title: "Review",
    description: "Check if the data looks good.",
  },
]
const processImage = async ({ imageId }: { imageId: string }) => {
  const res = await fetch(`/api/process-image`, {
    method: "POST",
    body: JSON.stringify({ imageId }),
  })
  if (!res.ok) {
    console.error(res)
    throw Error("Failed to process image.")
  }
  const parsedSalary = (await res.json()) as SalaryData
  return parsedSalary
}
const RightColumn = ({ imageId }: { imageId: string | undefined }) => {
  const queryClient = useQueryClient()
  const imageData = useMutation(
    ({ imageId }: { imageId: string }) => {
      return processImage({ imageId })
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["salary", imageId], data)
      },
    }
  )
  const salary = useQuery(
    ["salary", imageId],
    () =>
      // @ts-expect-error imageId can be undefined but the query won't run thanks to the enabled option
      fetchSalary({ imageId }),
    {
      // we have to wait for the other two mutations to have happened before we can run this query
      enabled: Boolean(imageId) && imageData.isSuccess,
    }
  )
  const confirmSalaryResult = useMutation(
    ({ imageId }: { imageId: string }) => {
      return fetch(`/api/confirm-salary`, {
        method: "POST",
        body: JSON.stringify({ imageId }),
      })
    }
  )

  // if the left column hasn't got an imageId set, we don't want to render anything
  if (!imageId) return <></>

  return imageData.status === "idle" ? (
    <Button
      onClick={() => {
        console.log("AI magic Button: ", { imageId })
        return imageData.mutateAsync({ imageId })
      }}
    >
      AI magic 🪄
    </Button>
  ) : imageData.status === "loading" ? (
    <Button disabled>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Hang on, this might take a while...
    </Button>
  ) : imageData.status === "success" && salary.data ? (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-row items-center justify-center gap-4 mt-5">
        <BookOpenCheck />
        <TypographyLarge>Data successfully extracted</TypographyLarge>
      </div>
      <Table imageId={imageId} data={salary.data} />
      <div className="flex flex-col gap-2">
        <TypographyLarge className="text-center">Looking good?</TypographyLarge>
        <TypographyP className="text-center [&:not(:first-child)]:mt-1">
          Copy the table to seamlessly insert it into a spreadsheet.
        </TypographyP>
        <Button
          className="mt-4"
          // we're in a button and on click we want to copy the table data to the clipboard so that we can copy paste it to a spreadsheet
          onClick={() => {
            navigator.clipboard.writeText(
              salary.data // convert into tab separated values for seamless spreadsheet insertion
                .map((row) => row.join("\t"))
                .join("\n")
            )
            confirmSalaryResult.mutateAsync({ imageId })
          }}
        >
          <Clipboard className="w-4 h-4 mr-2" />
          Copy to clipboard
        </Button>
      </div>
    </div>
  ) : (
    <></>
  )
}
// {/* <h3 className="mt-8 text-2xl font-semibold tracking-tight scroll-m-20">
//   ✅ Data extracted
// </h3>
// <Table data={tableData} /> */}
export default function SalaryPage() {
  // the imageId from our store
  const [imageId, setImageId] = useState<string>()

  return (
    <div className="md:grid md:grid-cols-2 md:gap-6">
      {/* left column */}
      <div className="flex flex-col">
        <div className="px-4 py-3 text-center xsm:px-6">
          <TypographyH3>File Upload</TypographyH3>
          <TypographyP className="mt-1 text-sm text-gray-600">
            Take a screenshot of the salary display and upload it here.
          </TypographyP>
        </div>
        {Boolean(imageId) ? (
          <div className="mt-5 grow md:col-span-1 md:mt-0 sm:overflow-hidden">
            <div className="flex flex-col px-4 py-5 space-y-6 bg-white sm:p-6 h-96">
              <div className="relative flex flex-col items-center justify-center flex-1 max-h-full px-6 pt-5 pb-6 mt-1 border-2 border-dashed rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 sm:text-sm">
                <Image
                  alt="screenshot uploaded by the user"
                  className="object-contain rounded-t-md h-96 w-96 rounded-2xl "
                  src={`https://storage.googleapis.com/madden-regression-bucket/${imageId}`}
                  width={500}
                  height={500}
                />
              </div>
            </div>
          </div>
        ) : (
          <UploadImage onUpload={setImageId} />
        )}
      </div>
      {/* right col */}
      <div className="flex flex-col ">
        <div className="px-4 py-3 text-center xsm:px-6">
          <TypographyH3>Extract salary data</TypographyH3>
          <TypographyP className="mt-1 text-sm text-gray-600">
            Click the button below and the extracted data will appear here.
          </TypographyP>
        </div>
        <div className="flex items-center justify-center overflow-x-auto grow inset-5">
          <RightColumn imageId={imageId} />
        </div>
      </div>
    </div>
  )
}

export const tableData = [
  [
    "NAME",
    "POS",
    "AGE",
    "OVR",
    "LEN",
    "REM",
    "TOTAL",
    "BONUS",
    "2046",
    "2047",
    "2048",
    "2049",
    "2050",
  ],
  [
    "C.Curry",
    "SS",
    "25",
    "61",
    "2",
    "2",
    "$500K",
    "$0",
    "$240K",
    "$260K",
    "$0",
    "$0",
    "$0",
  ],
  [
    "J.Jones",
    "CB",
    "25",
    "60",
    "2",
    "2",
    "$500K",
    "$0",
    "$240K",
    "$260K",
    "$0",
    "$0",
    "$0",
  ],
  [
    "B.Burks",
    "LT",
    "26",
    "60",
    "2",
    "1",
    "$570K",
    "$0",
    "$300K",
    "$0",
    "$0",
    "$0",
    "$0",
  ],
  [
    "J.Pearman",
    "LG",
    "25",
    "59",
    "2",
    "2",
    "$660K",
    "$0",
    "$320K",
    "$340K",
    "$0",
    "$0",
    "$0",
  ],
  [
    "K.Hutchins",
    "HB",
    "24",
    "59",
    "2",
    "1",
    "$520K",
    "$0",
    "$270K",
    "$0",
    "$0",
    "$0",
    "$0",
  ],
  [
    "J.Kane",
    "TE",
    "24",
    "58",
    "2",
    "2",
    "$910K",
    "$0",
    "$440K",
    "$470K",
    "$0",
    "$0",
    "$0",
  ],
] as SalaryData

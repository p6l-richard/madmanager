"use client"

import { useState } from "react"
import Image from "next/image"
import { useMutation } from "@tanstack/react-query"

import { cn } from "../../lib/utils"
import { Table } from "../../pages/parsed-images"
import { Steps } from "./steps"
import { UploadImage } from "./upload"

const IMAGE_URL = `https://storage.googleapis.com/madden-regression-bucket/salary-pic-number-zwo.jpeg`
const steps = [
  {
    id: 1,
    title: "File Upload",
    description: "Take a screenshot of the salary display and upload it here.",
    LeftColumn: UploadImage,
    RightColumn: () => <></>,
  },
  {
    id: 2,
    title: "Salary extraction",
    description: "Let AI extract the image for you.",
    LeftColumn: (filename) => (
      <div className="relative w-full h-full">
        <Image
          className="object-contain rounded-t-md"
          src={IMAGE_URL}
          sizes="100vw"
          fill
        />
      </div>
    ),
    RightColumn: () => {
      const parseImagePost = async ({ imageUrl }) => {
        const res = await fetch("/api/parse-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl }),
        })
        if (!res.ok) {
          console.error(res)
          throw Error("Failed to parse salary.")
        }
        const parsedSalary = await res.json()
        return parsedSalary
      }

      const parseImage = useMutation(parseImagePost)

      return (
        <div className="flex flex-col items-center justify-evenly">
          {parseImage.status === "idle" && (
            <>
              <h3>Extract salary data</h3>
              <p className="text-xs text-gray-600">
                Click the button below and the extracted data will appear here.
              </p>
              <button
                className={cn([
                  "inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                  // the disabled styles:
                  "disabled:bg-indigo-500  disabled:opacity-50 disabled:cursor-not-allowed",
                ])}
                onClick={() => parseImage.mutateAsync({ imageUrl: IMAGE_URL })}
              >
                AI magic 🪄
              </button>
            </>
          )}
          {/* {parseImage.status === "loading" && (
            <>
              <h3>Extracting salary data</h3>
              <p className="text-xs text-gray-600">
                Hang on, this might take a while...
              </p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 mr-3 stroke-current stroke-2 animate-spin fill-none"
                viewBox="0 0 24 24"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
            </>
          )}
           {parseImage.status === "success" && (
             <>
               <h3 className="mt-8 text-2xl font-semibold tracking-tight scroll-m-20">
                 ✅ Data extracted
               </h3>
               <Table data={parseImage.data} />
             </>
           )}
*/}

          <h3 className="mt-8 text-2xl font-semibold tracking-tight scroll-m-20">
            ✅ Data extracted
          </h3>
          <Table data={tableData} />
        </div>
      )
    },
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
export default function SalaryPage() {
  const [activeStep, setActiveStep] = useState(1)
  const step = steps.find((step) => step.id === activeStep)

  return (
    <>
      <div className="h-screen p-5">
        <div className="flex flex-col h-full rounded-lg shadow ">
          <Steps steps={steps} activeStep={activeStep} />
          {/* container header */}
          <div className="px-4 py-3 text-center xsm:px-6">
            <h3 className="text-lg font-bold leading-6 text-gray-900">
              Step {step.id}: {step.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{step.description}</p>
          </div>

          {/* container content */}
          <div className="overflow-y-auto grow md:grid md:grid-cols-2 md:gap-6">
            <step.LeftColumn />
            <step.RightColumn />
          </div>
          {/* container footer */}
          <div className="flex justify-between px-4 py-3 text-right bg-gray-50 sm:px-6 basis-1/12">
            <button
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-transparent rounded-md shadow-sm focus:outline-none hover:text-indigo-700 hover:bg-gray-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => {
                if (activeStep > 1) {
                  setActiveStep(activeStep - 1)
                }
              }}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setActiveStep((cur) => {
                  if (cur < steps.length) {
                    return cur + 1
                  }
                })
              }
              className={cn([
                "inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                // the disabled styles:
                "disabled:bg-indigo-500  disabled:opacity-50 disabled:cursor-not-allowed",
              ])}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const tableData = [
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
]

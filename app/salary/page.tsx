"use client"

import { useState } from "react"
import Image from "next/image"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ClipboardCheck, ClipboardCopy, Loader2 } from "lucide-react"

import { Button } from "../../components/button"
import { CollapsibleTableWrapper } from "../../components/collapsible-table-wrapper"
import { Separator } from "../../components/separator"
import { ToastDescription, ToastTitle, toast } from "../../components/toast"
import {
  TypographyH3,
  TypographyH4,
  TypographyP,
} from "../../components/typography"
import { tableData } from "../../lib/constants"
import { cn } from "../../lib/utils"
import {
  TableBody,
  TableData,
  TableHeader,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "../table"
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

const processImage = async ({ imageId }: { imageId: string }) => {
  if (process.env.NODE_ENV === "development") {
    return new Promise((resolve) => {
      return resolve(tableData)
    })
  }
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
const RightColumn = ({
  imageId,
  onProcess,
}: {
  imageId: string | undefined
  onProcess: () => void
}) => {
  const queryClient = useQueryClient()
  const imageData = useMutation(
    ["process-image", imageId],
    ({ imageId }: { imageId: string }) => {
      return processImage({ imageId })
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["salary", imageId], data)
        onProcess()
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
    <Table imageId={imageId} data={salary.data} />
  ) : (
    <></>
  )
}

export default function SalaryPage() {
  // the imageId from our store
  const [imageId, setImageId] = useState<string>()
  const [isProcessed, setIsProcessed] = useState(false)
  const queryClient = useQueryClient()

  const confirmSalaryResult = useMutation(
    ({ imageId }: { imageId: string }) => {
      return fetch(`/api/confirm-salary`, {
        method: "POST",
        body: JSON.stringify({ imageId }),
      })
    }
  )

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
              <div className="relative flex flex-col items-center justify-center flex-1 max-h-full mt-1 border-2 border-solid rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 sm:text-sm">
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
        <div className="mt-5 grow md:col-span-1 md:mt-0 sm:overflow-hidden">
          <div className="flex flex-col px-4 py-5 space-y-6 bg-white sm:p-6 h-96">
            <div className="relative flex flex-col items-center justify-center flex-1 max-h-full pl-4 mt-1 border-2 border-solid rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 sm:text-sm">
              <RightColumn
                imageId={imageId}
                onProcess={() => setIsProcessed(true)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* footer w/ cta? */}
      {Boolean(isProcessed) && !!imageId && (
        <div className="flex flex-col items-center justify-center col-span-2">
          <TypographyH3 className="mt-2">Looks good?</TypographyH3>
          <Button
            className="mt-2"
            onClick={() => {
              // copy salaryData to the clipboard
              const salaryData = queryClient.getQueryData<SalaryData>([
                "salary",
                imageId,
              ])
              if (!salaryData) {
                // early return if we don't have data
                // TODO: send toast with error message
                toast({ content: "No data to copy" })
                return
              }
              navigator.clipboard.writeText(
                salaryData // convert into tab separated values for seamless spreadsheet insertion
                  .map((row) => row.join("\t"))
                  .join("\n")
              )
              confirmSalaryResult.mutateAsync({ imageId })
              // TODO: send toast message to confirm copy to clipboard
              toast({
                content: (
                  <>
                    <ToastTitle asChild>
                      <TypographyH4 className="inline-flex items-center mt-4">
                        <ClipboardCheck className="w-5 h-5 mr-2" /> Copied to
                        clipboard
                      </TypographyH4>
                    </ToastTitle>
                    <ToastDescription className="mt-2 space-y-2">
                      <TypographyP>
                        We've copied the below data to your clipboard. You can
                        simply paste it into your spreadsheet.
                      </TypographyP>
                      <Separator />
                      <CollapsibleTableWrapper expandButtonTitle="View Preview">
                        <PreviewTable data={salaryData} />
                      </CollapsibleTableWrapper>
                    </ToastDescription>
                  </>
                ),
              })
            }}
          >
            <ClipboardCopy className="w-6 h-6 pr-2" /> Copy to clipboard
          </Button>
        </div>
      )}
    </div>
  )
}
const PreviewTable = ({ data }: { data: SalaryData }) => {
  return (
    <TableRoot>
      <TableHeader>
        {data[0].map((cell, i) => (
          <TableHeaderCell key={i}>{cell}</TableHeaderCell>
        ))}
      </TableHeader>
      <TableBody>
        {data.slice(1).map((row, i) => (
          <TableRow key={i}>
            {row.map((cell, j) => (
              <TableData key={j}>{cell}</TableData>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  )
}

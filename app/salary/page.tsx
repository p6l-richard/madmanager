"use client"

import { useState } from "react"
import Image from "next/image"
import { protos } from "@google-cloud/documentai"
import { type google } from "@google-cloud/documentai/build/protos/protos"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
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
import { cn, imageLoader } from "../../lib/utils"
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

const processImage = async ({
  imageIds,
}: Pick<RightColumnParams, "imageIds">) => {
  // if (process.env.NODE_ENV === "development") {
  //   return new Promise((resolve) => {
  //     return resolve(tableData)
  //   })
  // }
  const res = await fetch(`/api/process-image`, {
    method: "POST",
    body: JSON.stringify({ imageIds }),
  })
  if (!res.ok) {
    console.error(res)
    throw Error("Failed to process image.")
  }
  const operation = (await res.json()) as { operationId: string }
  return operation
}
interface RightColumnParams {
  imageIds: [string] | undefined
  currentImageIndex: number
  onProcess: () => void
}
const RightColumn = ({
  imageIds,
  onProcess,
  currentImageIndex,
}: RightColumnParams) => {
  const [operationId, setOperationId] = useState<string | undefined>(undefined)
  const queryClient = useQueryClient()
  const imageData = useMutation(
    ["process-image", imageIds],
    ({ imageIds }: Pick<RightColumnParams, "imageIds">) => {
      return processImage({ imageIds })
    },
    {
      onSuccess: (data) => {
        console.log("CHECK THE RESPONSE PLS:", data)
        setOperationId(data.operationId)
        // queryClient.setQueryData(["salary", imageId], data)
        // onProcess()
      },
    }
  )
  const operation = useQuery(
    ["operations", operationId],
    async () => {
      const response = await fetch(`/api/operations/${operationId}`)
      const data =
        (await response.json()) as protos.google.longrunning.Operation
      return data
    },
    {
      refetchInterval: (data) => {
        console.log("REFETCH INTERVAL", !data?.done ? 5000 : false)
        return !data?.done ? 5000 : false
      }, // poll every 5 seconds
      enabled:
        imageData.status === "success" && Boolean(imageData.data?.operationId),
      onSuccess: (data) => {
        console.log("CHECK THE RESPONSE PLS:", data)
        if (data.done) {
          console.log("--- DONE ---")
          toast({
            content: (
              <>
                <ToastTitle>🎉 Congratulations 🎉</ToastTitle>
                <ToastDescription>
                  The AI has finished parsing the data. We&apos;ll load the
                  table for you to review now.
                </ToastDescription>
              </>
            ),
          })
          // fetch the salary for this operation
          queryClient.invalidateQueries(["salary", operationId])
        }
      },
    }
  )

  const salary = useQuery(
    ["salary", imageIds, currentImageIndex],
    () =>
      // @ts-expect-error imageId can be undefined but the query won't run thanks to the enabled option
      fetchSalary({ imageId: imageIds.length && imageIds[currentImageIndex] }),
    {
      // we have to wait for the other two mutations to have happened before we can run this query
      enabled:
        Boolean(imageIds?.length) &&
        imageData.isSuccess &&
        Boolean(currentImageIndex),
    }
  )

  // if the left column hasn't got an imageId set, we don't want to render anything
  if (!imageIds?.length) return <></>

  return imageData.status === "idle" ? (
    <Button
      onClick={() => {
        console.log("AI magic Button: ", { imageIds })
        return imageData.mutateAsync({ imageIds })
      }}
    >
      AI magic 🪄
    </Button>
  ) : imageData.status === "loading" ? (
    <Button disabled>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Preparing the AI parsing...
    </Button>
  ) : imageData.status === "success" ? (
    <Button disabled>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      The AI is now parsing the data. This might take a while...
    </Button>
  ) : salary.data ? (
    <Table imageId={imageIds[currentImageIndex]} data={salary.data} />
  ) : (
    <></>
  )
}

export default function SalaryPage() {
  // the imageId from our store
  const [imageIds, setImageIds] = useState<Array<string>>()
  // the currently displayed image on the screen
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)

  const handleImageClick = () => {
    setCurrentImageIndex((prevIndex) => {
      if (typeof imageIds === "undefined") {
        return prevIndex
      }
      return (prevIndex + 1) % imageIds.length
    })
  }

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
  console.log({
    imageIds,
    currentImageIndex,
    conditionSingleImg: !!imageIds && imageIds.length === 1,
    conditionMultipleImgs: !!imageIds && imageIds.length > 0,
  })

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
        {!!imageIds ? (
          <div className="mt-5 grow md:col-span-1 md:mt-0">
            <div className="flex flex-col px-4 py-5 space-y-6 bg-white sm:p-6">
              <div className="grid grid-rows-1">
                {imageIds.map(
                  (imageId, index) => (
                    console.log({ imageId, index }),
                    (
                      // col-start-1 & row-start-1 positions the image in the first column of the grid
                      <div
                        className={clsx(
                          "col-start-1 row-start-1",
                          // if the image is the current image, it should appear on top of the others
                          index === currentImageIndex && "z-10 bg-white"
                        )}
                        key={imageId}
                      >
                        <div
                          className="relative"
                          // this creates the stacking effect
                          style={{
                            top: index * 5,
                            left: index * 5,
                            // transform: `${index * 5}deg`,
                          }}
                        >
                          <div className="relative flex flex-col items-center justify-center flex-1 mt-1 border-2 border-solid rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 sm:text-sm">
                            <Image
                              alt="screenshot uploaded by the user"
                              className="object-contain rounded-t-md h-96 w-96 rounded-2xl"
                              loader={(props) => imageLoader(props)}
                              src={imageId}
                              width={500}
                              height={500}
                              quality={100}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <UploadImage onUpload={setImageIds} />
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
        <div className="mt-5 grow md:col-span-1 md:mt-0">
          <div className="flex flex-col h-full px-4 py-5 space-y-6 bg-white sm:p-6 min-h-[24rem]">
            <div className="relative flex flex-col items-center justify-center flex-1 max-h-full pl-4 mt-1 border-2 border-solid rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 sm:text-sm">
              <RightColumn
                imageIds={imageIds}
                currentImageIndex={currentImageIndex}
                onProcess={() => setIsProcessed(true)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* footer w/ cta? */}
      {Boolean(isProcessed) && !!imageIds && (
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

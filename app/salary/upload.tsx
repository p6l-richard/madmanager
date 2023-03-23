import { Dispatch, SetStateAction, useState } from "react"
import { GenerateSignedPostPolicyV4Response } from "@google-cloud/storage"
import { useMutation } from "@tanstack/react-query"
import { useDropzone } from "react-dropzone"

import { Button } from "../../components/button"
import { Input } from "../../components/input"
import { TypographyP } from "../../components/typography"
import { cn } from "../../lib/utils"

export const UploadImage = ({
  onUpload: setImageIds,
}: {
  onUpload: Dispatch<SetStateAction<Array<string> | undefined>>
}) => {
  // MUTATION TO OBTAIN PRESIGNED URL BEFORE THE UPLOAD
  const postPresignedUrl = useMutation(
    async ({ filename }: { filename: string }) => {
      console.log("postPresignedUrl -> ")
      // if (process.env.NODE_ENV === "development") {
      //   return {
      //     fields: { key: filename },
      //     url: "",
      //   } satisfies GenerateSignedPostPolicyV4Response[0]
      // }
      const res = await fetch(`/api/upload-url?filename=${filename}`)
      if (!res.ok) throw new Error(res.statusText)
      return (await res.json()) as GenerateSignedPostPolicyV4Response[0]
    }
    // note: even though we now already have the imageId, we don't set it here; only after the actual gcsUpload
  )

  // THE DROPZONE FOR THE IMAGE SELECTION
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      maxFiles: 5,
      maxSize: 5 * 2 ** 30, // roughly 5GB
      multiple: true,
      onDropAccepted: async (files, _event) => {
        const signedPostPolicyV4Responses = await Promise.all(
          files.map((file) =>
            postPresignedUrl.mutateAsync({ filename: file.name })
          )
        )

        console.log({ signedPostPolicyV4Responses })
        const uploadResults = await Promise.all(
          signedPostPolicyV4Responses.map((response, index) =>
            uploadGcs.mutateAsync({ ...response, file: files[index] })
          )
        )
        uploadResults.forEach((result) => {
          if (!result.success) {
            console.error("Upload failed for file with key:", result.key)
          }
          console.log("Upload success for file with key:", result.key)
          setImageIds((prev) => {
            if (prev === undefined) return [result.key]
            return [...prev, result.key]
          })
        })
      },
    })

  // MUTATION TO UPLOAD TO GCS
  const uploadGcs = useMutation(
    async ({
      url,
      fields,
      file,
    }: GenerateSignedPostPolicyV4Response[0] & { file: File }) => {
      // if (process.env.NODE_ENV !== "development") {
      // build the request's body
      // const file = acceptedFiles[0]
      const formData = new FormData()
      console.log({ fields })
      Object.entries({ ...fields, file }).forEach(([key, value]) => {
        formData.append(key, value)
      })
      // make the fetch request to the presigned url
      const upload = await fetch(url, {
        method: "POST",
        body: formData,
      })

      if (!upload.ok) {
        console.error(upload)
        throw Error("Upload failed.")
      }
      // }

      return { key: fields.key, success: true }
    }
  )
  return (
    <div className="mt-5 grow md:col-span-1 md:mt-0 sm:overflow-hidden">
      <div className="flex flex-col px-4 py-5 space-y-6 bg-white sm:p-6 h-96">
        {/* dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "flex-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 mt-1 rounded-md border-2 border-dashed cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 sm:text-sm",
            isDragActive && "ring-slate-500 ring-2 ring-offset-1"
          )}
        >
          <div className="space-y-1 text-center">
            {acceptedFiles.length > 0 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 mx-auto stroke-current stroke-2 animate-spin fill-none"
                viewBox="0 0 24 24"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
            ) : (
              <svg
                className="w-12 h-12 mx-auto text-gray-400 stroke-current fill-none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <div className="flex text-sm text-gray-600">
              <label htmlFor="file-upload">
                <Button variant="link" className="p-1 h-max focus:ring-0">
                  Upload a file
                </Button>
                <Input
                  {...getInputProps()}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                />
              </label>
              <TypographyP className="[&:not(:first-child)]:mt-0">
                or drag and drop
              </TypographyP>
            </div>
            <TypographyP className="text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB
            </TypographyP>
          </div>
        </div>
      </div>
    </div>
  )
}

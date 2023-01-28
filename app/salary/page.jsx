"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useDropzone } from "react-dropzone"

import { cn } from "../../lib/utils"

export default function SalaryPage() {
  // MUTATION TO UPLOAD TO GCS
  const uploadGcs = useMutation(async () => {
    // build the request's body
    const { url, fields } = presignedUrl
    const file = acceptedFiles[0]
    const formData = new FormData()
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
    return { success: true }
  })

  // MUTATION TO OBTAIN PRESIGNED URL BEFORE THE UPLOAD
  // type: GenerateSignedPostPolicyV4Response
  const [presignedUrl, setPresignedUrl] = useState(null)
  const { mutateAsync: fetchPresignedUrl } = useMutation(
    async ({ filename }) => {
      const res = await fetch(`/api/upload-url?file=${filename}`)
      if (!res.ok) throw new Error(res.statusText)
      return await res.json()
    }
  )

  // THE DROPZONE FOR THE IMAGE SELECTION
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      maxFiles: 1,
      maxSize: 5 * 2 ** 30, // roughly 5GB
      multiple: false,
      onDropAccepted: (files, _event) => {
        const file = files[0]

        fetchPresignedUrl({
          filename: file.name,
        })
          .then((signedPostPolicyV4Response) => {
            setPresignedUrl(signedPostPolicyV4Response)
            setSubmitDisabled(false)
          })
          .catch((err) => console.error(err))
      },
    })

  return (
    <>
      <div className="h-screen p-5">
        <div className="flex flex-col h-full rounded-lg shadow ">
          {/* container header */}
          <div className="px-4 py-3 text-center bg-gray-50 sm:px-6">
            <h3 className="text-lg font-bold leading-6 text-gray-900">
              Step 1: File upload
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Take a screenshot of the salary display and upload it here.
            </p>
          </div>
          {/* container content */}

          <div className="grow md:grid md:grid-cols-2 md:gap-6">
            {/* left column */}
            <div className="mt-5 md:col-span-1 md:mt-0 sm:overflow-hidden">
              <div className="flex flex-col h-full px-4 py-5 space-y-6 bg-white sm:p-6">
                <label className="block text-sm font-medium text-gray-700">
                  Salary overview screenshot
                </label>
                {/* dropzone */}
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex-1 flex items-center justify-center px-6 pt-5 pb-6 mt-1 rounded-md border-2 border-dashed cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm",
                    isDragActive ? "border-indigo-500 " : "border-gray-300"
                  )}
                >
                  <div className="space-y-1 text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400"
                      stroke="currentColor"
                      fill="none"
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
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative font-medium text-indigo-600 bg-white rounded-md cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          {...getInputProps()}
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                {/* display file to upload */}
                <aside className="my-2">
                  <h4 className="block text-sm font-medium text-gray-700">
                    Files pending upload
                  </h4>
                  <ul>
                    {acceptedFiles.map((file) => (
                      <li key={file.name}>
                        {file.name} - {file.size} bytes
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>

              <div className="md:col-span-1">
                <div className="px-4 sm:px-0"></div>
              </div>
            </div>
          </div>
          {/* container footer */}
          <div className="px-4 py-3 text-right bg-gray-50 sm:px-6">
            <button
              onClick={uploadGcs.mutateAsync}
              disabled={
                uploadGcs.status === "loading" || acceptedFiles.length !== 1
              }
              className={cn([
                "inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                // the disabled styles:
                "disabled:bg-indigo-500  disabled:opacity-50 disabled:cursor-not-allowed",
              ])}
            >
              {uploadGcs.status !== "loading" ? (
                "Upload"
              ) : (
                // display a spinner during the upload
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  class="animate-spin h-5 w-5 mr-3 ..."
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

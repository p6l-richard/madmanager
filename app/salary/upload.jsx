import { useMutation } from "@tanstack/react-query"
import { useDropzone } from "react-dropzone"

import { cn } from "../../lib/utils"

export const UploadImage = () => {
  // MUTATION TO OBTAIN PRESIGNED URL BEFORE THE UPLOAD
  // type: GenerateSignedPostPolicyV4Response
  const postPresignedUrl = useMutation(async ({ filename }) => {
    const res = await fetch(`/api/upload-url?file=${filename}`)
    if (!res.ok) throw new Error(res.statusText)
    return await res.json()
  })

  // THE DROPZONE FOR THE IMAGE SELECTION
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      maxFiles: 1,
      maxSize: 5 * 2 ** 30, // roughly 5GB
      multiple: false,
      onDropAccepted: async (files, _event) => {
        const file = files[0]

        const signedPostPolicyV4Response = await postPresignedUrl.mutateAsync({
          filename: file.name,
        })

        const { success } = await uploadGcs.mutateAsync(
          signedPostPolicyV4Response
        )

        if (success) {
          console.log("success")
        }
      },
    })

  // MUTATION TO UPLOAD TO GCS
  const uploadGcs = useMutation(async ({ url, fields }) => {
    // build the request's body
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
    console.log("Haven't checked yet", upload)
    if (!upload.ok) {
      console.error(upload)
      throw Error("Upload failed.")
    }
    console.log("did it go thru?")
    return { success: true }
  })
  return (
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
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
        {/* display file to upload */}
        <aside className="my-2">
          <h4 className="block text-sm font-medium text-gray-700">
            File to upload
          </h4>
          <ul>
            {acceptedFiles.map((file) => (
              <li key={file.name} className="flex flex-row">
                <span className="block text-sm text-gray-600">
                  {postPresignedUrl.status === "loading" ||
                  uploadGcs.status === "loading" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 mr-3 stroke-current stroke-2 animate-spin fill-none"
                      viewBox="0 0 24 24"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 mr-3 stroke-2 fill-green-700 stroke-white"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                  )}
                </span>
                <span className="block text-sm text-gray-600">
                  {file.name} - {file.size} bytes
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="md:col-span-1">
        <div className="px-4 sm:px-0"></div>
      </div>
    </div>
  )
}

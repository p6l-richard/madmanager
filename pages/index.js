import { useState } from "react";
import { useMutation, useQuery } from "react-query";

export default function Homepage() {
  return (
    <>
      <Gallery />
      <Upload />
    </>
  );
}
// UPLOAD
const uploadPhoto = async (e) => {
  console.log("uploading photo");
  const file = e.target.files[0];
  console.log("file to upload", file);
  const filename = encodeURIComponent(file.name);
  const res = await fetch(`/api/upload-url?file=${filename}`);
  const { url, fields } = await res.json();
  console.log("url", url);
  const formData = new FormData();

  Object.entries({ ...fields, file }).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const upload = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!upload.ok) {
    console.error(upload);
    throw Error("Upload failed.");
  }
  console.log({ upload });
  return { success: true };
};

const Upload = () => {
  const upload = useMutation(["upload"], uploadPhoto, {
    onSuccess: () => {
      queryClient.invalidateQueries(["photos"]);
    },
  });
  return (
    <>
      {/* Display the upload mutation which returns {upload: success}. */}
      <p>Upload a .png or .jpg image (max 1MB).</p>
      <p>status: {JSON.stringify(upload.status)}</p>
      <p>data: {JSON.stringify(upload.data)}</p>
      <input
        onChange={upload.mutate}
        type="file"
        accept="image/png, image/jpeg"
      />
    </>
  );
};

// GALLERY

const getPhotos = async () => {
  // fetches all photos from the Google Cloud Storage bucket
  const res = await fetch("/api/photos");
  if (!res.ok) {
    console.error(res);
    throw Error("Failed to fetch photos.");
  }
  const photos = await res.json();
  return photos;
};

// parseImage mutation that calls the Google Cloud Document API from the Next.js server
const parseImage = async (imageUrl) => {
  const res = await fetch("/api/parse-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) {
    console.error(res);
    throw Error("Failed to parse salary.");
  }
  const parsedSalary = await res.json();
  return parsedSalary;
};

const Gallery = () => {
  // data loader
  const fetchPhotos = useQuery(["photos"], getPhotos);

  // pagination feature
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const handleNextPage = () => setPage((prevPage) => prevPage + 1);
  const handlePreviousPage = () => setPage((prevPage) => prevPage - 1);
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentImages = Boolean(fetchPhotos?.data?.length)
    ? fetchPhotos.data.slice(indexOfFirstItem, indexOfLastItem)
    : [];

  // image selection feature
  const [selectedImage, setSelectedImage] = useState(null);

  // parse salary mutation
  const parseImageMutation = useMutation(["parseImage"], parseImage, {
    onSuccess: () => {
      queryClient.invalidateQueries(["parsedImages"]);
    },
  });

  return (
    <div className="bg-gray-200">
      <div className="container p-4 mx-auto">
        <h1 className="text-2xl font-medium">Image Gallery</h1>
        <p className="text-gray-500">
          {fetchPhotos?.data?.length} images uploaded.
        </p>
        <div className="grid grid-cols-5 gap-4">
          {currentImages.map((image) => {
            const isSelected = selectedImage
              ? selectedImage.url === image.url
              : false;
            return (
              <div
                key={image.url}
                className={`bg-white rounded-lg overflow-hidden shadow-md cursor-pointer ${
                  isSelected ? "border-2 border-blue-500" : ""
                }`}
                onClick={() => setSelectedImage(image)}
              >
                {isSelected && (
                  <button
                    className="w-full px-4 py-2 font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-700"
                    onClick={() => parseImageMutation.mutate(selectedImage.url)}
                  >
                    Parse salary data
                  </button>
                )}
                <img
                  src={image.url}
                  alt="image"
                  className={`w-full ${isSelected ? "relative z-10" : ""}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between">
          <button
            className="px-4 py-2 font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-700"
            onClick={handlePreviousPage}
            disabled={page === 1}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-700"
            onClick={handleNextPage}
            disabled={page * itemsPerPage >= fetchPhotos?.data?.length}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

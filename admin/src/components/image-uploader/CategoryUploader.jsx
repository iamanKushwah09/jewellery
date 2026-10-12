import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUploadCloud, FiXCircle } from "react-icons/fi";

const Uploader = ({ initialImages = [], setNewImage }) => {

  console.log(initialImages, "initialImages");
  // State to manage the files selected in the current session

  const [files, setFiles] = useState([]); // Files selected in the current session
  const [loading, setLoading] = useState(false); // Loading state for uploads
  const [err, setError] = useState(""); // Error message state
  // Dropzone configuration 
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"], // Allowed formats
    },
    multiple: true, // Allow multiple files
    maxSize: 10000000, // Max file size: 10MB
    onDrop: (acceptedFiles) => {
      // Add files to state with previews

      console.log("acceptedFiles:", acceptedFiles);

      setFiles((prev) =>
        [...prev, ...acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )]);

    },
  });

  // Convert file to Base64
  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  // Process newly added files
  useEffect(() => {
    const processFiles = async () => {
      if (files.length > 0) {
        setLoading(true); // Show loading
        const newImages = [];
        for (const file of files) {
          try {
            const base64File = await convertBase64(file);
            newImages.push({ base64File, fileName: file.name });
          } catch (error) {
            setError("Failed to convert file to Base64");
            console.error("Error converting file to Base64:", error);
          }
        }
        // Update the parent state with new images
        console.log("newImages:", newImages);
        setNewImage((prevState) => {
          const filteredPrev = Array.isArray(prevState) 
            ? prevState.filter(img => {
                const str = typeof img === 'string' ? img : (img?.url || img?.fileName || img?.path || '');
                return !str.includes('default_image.png') && !str.includes('placeholder_kvepfp.png');
              })
            : [];
          return [...newImages, ...filteredPrev];
        });
        setLoading(false); // Hide loading
      }
    };

    processFiles();
    // Cleanup previews to avoid memory leaks
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files, setNewImage]);

  // Handle image click to open in new tab
  const handleImageClick = (imageSrc) => {
    if (imageSrc) {
      window.open(imageSrc, '_blank', 'noopener,noreferrer');
    }
  };

  // Render thumbnails for initial images
  const initialThumbs = initialImages?.map((img, index) => {
    const imageSrc = img?.base64File ? img.base64File : img;
    return (
      <div key={`initial-${index}`} className="relative m-2">
        <img
          className="inline-flex border rounded-md border-gray-100 w-24 max-h-24 cursor-pointer"
          src={imageSrc}
          alt={img?.fileName ? img.fileName : `Initial image ${index}`}
          onClick={() => handleImageClick(img?.url)}
        />
        <button
          type="button"
          className="absolute top-0 right-0 text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveFile(index);
          }}
        >
          <FiXCircle />
        </button>
      </div>
    );
  });

  // Render thumbnails for newly uploaded files
  const newThumbs = files.map((file, index) => (
    <div key={`new-${index}`} className="relative m-2">
      <img
        className="inline-flex border rounded-md border-gray-100 w-24 max-h-24 cursor-pointer"
        src={file.preview}
        alt={file.name}
        onClick={() => handleImageClick(file.preview)}
      />
      <button
        type="button"
        className="absolute top-0 right-0 text-red-500"
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveFile(index);
        }}
      >
        <FiXCircle />
      </button>
    </div>
  ));

  // Remove a file from the state
  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    console.log(newFiles, "newFiles");
    // Update the state with the new files array
    setFiles(newFiles);
    setNewImage((prevState) => Array.isArray(prevState) ? prevState.filter((_, i) => i !== index) : []);
  };


  return (
    <div className="w-full text-center">
      {/* Dropzone */}
      <div
        className="border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer px-3 py-2 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-100/60 dark:hover:bg-gray-800/80 transition-colors"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <span className="mx-auto flex justify-center">
          <FiUploadCloud className="text-xl text-blue-500" />
        </span>
        <p className="text-xs mt-0.5 text-gray-700 dark:text-gray-300 font-medium">Drag images here, or click to select</p>
        <em className="text-[10px] text-gray-400">.jpeg, .jpg, .png, .webp</em>
      </div>
      {/* Loading and error messages */}
      <div className="text-blue-500">{loading && "Uploading..."}</div>
      <div className="text-red-500">{err}</div>
      {/* Previews */}
      <aside className="flex flex-wrap mt-4">
        {
          files.length > 0 ? newThumbs : initialThumbs
        }
      </aside>
    </div>
  );
};

export default Uploader;

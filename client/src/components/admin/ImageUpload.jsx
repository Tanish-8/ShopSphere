import { useState, useRef } from "react";
import api from "../../services/api";
import { getStoredToken } from "../../services/authService";

export default function ImageUpload({ value, onChange, onUploadingChange }) {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.");
      return;
    }

    // Validate size (5 MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Maximum size is 5 MB.");
      return;
    }

    setError("");
    setUploading(true);
    if (onUploadingChange) onUploadingChange(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = getStoredToken();
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      };

      const response = await api.post("/upload", formData, config);
      const url = response.data?.url;
      if (url) {
        onChange(url);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to upload image. Please try again."
      );
    } finally {
      setUploading(false);
      if (onUploadingChange) onUploadingChange(false);
      setProgress(0);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleRemove = () => {
    onChange("");
    setError("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Product Image</label>

      {value ? (
        <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-2 w-48 h-48 group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover rounded-md"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-90 group-hover:opacity-100 hover:bg-red-700 transition shadow-sm text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition w-full max-w-lg ${
            dragActive
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-indigo-400 bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
          />

          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="mt-4 flex text-sm text-gray-600">
            <button
              type="button"
              onClick={onButtonClick}
              className="relative font-medium text-indigo-600 hover:text-indigo-500 outline-none"
            >
              Upload a file
            </button>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, WEBP up to 5MB</p>
        </div>
      )}

      {uploading && (
        <div className="w-full max-w-lg bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2 relative">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
          <span className="text-xs text-gray-500 mt-1 block">Uploading... {progress}%</span>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 w-full max-w-lg mt-2">
          {error}
        </p>
      )}
    </div>
  );
}

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBufferToCloudinary = (buffer, folder = "products") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    throw error;
  }
};

export const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("res.cloudinary.com")) return null;

  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    let startIndex = uploadIndex + 1;
    if (parts[startIndex].startsWith("v") && !isNaN(parts[startIndex].substring(1))) {
      startIndex += 1;
    }

    const remaining = parts.slice(startIndex).join("/");
    const dotIndex = remaining.lastIndexOf(".");
    return dotIndex !== -1 ? remaining.substring(0, dotIndex) : remaining;
  } catch (error) {
    console.error("Failed to extract public_id:", error);
    return null;
  }
};

export default {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
};

import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { protect, admin } from "../middleware/authMiddleware.js";
import { uploadBufferToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

// Upload rate limiter (max 30 uploads per hour per IP)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    message: "Too many file upload requests, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer memory storage configuration
const storage = multer.memoryStorage();

// File type and size validations
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter,
});

// @desc    Upload an image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
router.post("/", protect, admin, uploadLimiter, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("Please upload an image file");
    }

    // Upload memory buffer to Cloudinary
    const result = await uploadBufferToCloudinary(req.file.buffer, "products");

    res.status(201).json({
      success: true,
      url: result.url,
      public_id: result.public_id,
    });
  } catch (error) {
    next(error);
  }
});

// Handle Multer specific errors (e.g. limit file size)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400);
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new Error("File size too large. Maximum limit is 5 MB."));
    }
    return next(new Error(`Multer error: ${err.message}`));
  }
  next(err);
});

export default router;

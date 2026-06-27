import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getProductReviews,
  getTopProducts,
  productValidation,
  reviewValidation,
} from "../controllers/productController.js";

const router = express.Router();

// Public routes
router.get("/top", getTopProducts); // Must be before /:id to avoid conflict
router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/:id/reviews", getProductReviews);

// Private routes (logged-in users)
router.post("/:id/reviews", protect, reviewValidation, addProductReview);

// Admin-only routes
router.post("/", protect, admin, productValidation, createProduct);
router.put("/:id", protect, admin, productValidation, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

export default router;

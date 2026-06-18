import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// Create a Razorpay order (client will open checkout)
router.post("/create-order", protect, createRazorpayOrder);

// Verify payment signature and mark order paid
router.post("/verify", protect, verifyRazorpayPayment);

export default router;

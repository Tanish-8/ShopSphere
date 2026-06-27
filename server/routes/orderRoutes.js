import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateOrderToPaid,
  orderValidation,
  getOrderPricePreview,
} from "../controllers/orderController.js";

const router = express.Router();

// Private routes (logged-in users)
router.post("/", protect, orderValidation, createOrder);
router.post("/calculate", protect, getOrderPricePreview);
router.get("/myorders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/pay", protect, updateOrderToPaid);

// Admin-only routes
router.get("/", protect, admin, getAllOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;

import express from "express";
import { protect, admin, requireVerification } from "../middleware/authMiddleware.js";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateOrderToPaid,
  orderValidation,
  getOrderPricePreview,
  downloadOrderInvoice,
  cancelOrder,
  requestOrderReturn,
  adminProcessRefund,
} from "../controllers/orderController.js";

const router = express.Router();

// Private routes (logged-in users)
router.post("/", protect, requireVerification, orderValidation, createOrder);
router.post("/calculate", protect, getOrderPricePreview);
router.get("/myorders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.get("/:id/invoice", protect, downloadOrderInvoice);
router.put("/:id/pay", protect, updateOrderToPaid);
router.put("/:id/cancel", protect, cancelOrder);
router.put("/:id/return", protect, requestOrderReturn);

// Admin-only routes
router.get("/", protect, admin, getAllOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);
router.post("/:id/refund", protect, admin, adminProcessRefund);

export default router;

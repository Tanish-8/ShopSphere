import express from "express";
import { body } from "express-validator";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

const couponValidationRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ min: 3 })
    .withMessage("Coupon code must be at least 3 characters long"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("discountType")
    .isIn(["percentage", "fixed"])
    .withMessage("Discount type must be percentage or fixed"),
  body("discountValue")
    .isFloat({ min: 0 })
    .withMessage("Discount value must be a positive number"),
  body("minimumOrderAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum order amount must be a positive number"),
  body("maximumDiscount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum discount must be a positive number"),
  body("expiryDate").isISO8601().withMessage("Please provide a valid expiry date"),
];

// Customer validate coupon endpoint
router.post("/validate", protect, validateCoupon);

// Admin CRUD endpoints
router.get("/", protect, admin, getCoupons);
router.post("/", protect, admin, couponValidationRules, createCoupon);
router.put("/:id", protect, admin, couponValidationRules, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

export default router;

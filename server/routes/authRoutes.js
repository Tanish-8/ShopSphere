import express from "express";
import rateLimit from "express-rate-limit";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  updateUserRole,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../controllers/authController.js";

const router = express.Router();

// Rate limiter for security (brute-force mitigation)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 attempts
  message: {
    success: false,
    message: "Too many authentication requests, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post("/register", authLimiter, registerValidation, registerUser);
router.post("/login", authLimiter, loginValidation, loginUser);
router.post("/forgot-password", authLimiter, forgotPasswordValidation, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPasswordValidation, resetPassword);
router.post("/verify-email/:token", verifyEmail);

// Private routes (logged-in users)
router.post("/resend-verification", protect, resendVerificationEmail);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin-only routes
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);
router.put("/users/:id/role", protect, admin, updateUserRole);

export default router;

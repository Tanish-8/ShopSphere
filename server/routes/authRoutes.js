import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  updateUserRole,
  registerValidation,
  loginValidation,
} from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/register", registerValidation, registerUser);
router.post("/login", loginValidation, loginUser);

// Private routes (logged-in users)
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin-only routes
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);
router.put("/users/:id/role", protect, admin, updateUserRole);

export default router;

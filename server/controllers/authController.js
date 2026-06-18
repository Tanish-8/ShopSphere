import { validationResult, body } from "express-validator";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// ---------------------------------------------------------------------------
// Validation rules (re-exported so routes can attach them)
// ---------------------------------------------------------------------------
export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ---------------------------------------------------------------------------
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ---------------------------------------------------------------------------
export const registerUser = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(
        errors
          .array()
          .map((e) => e.msg)
          .join(". ")
      );
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error("A user with this email already exists");
    }

    // Create user (password is hashed by the pre-save hook)
    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Authenticate user & return token
// @route   POST /api/auth/login
// @access  Public
// ---------------------------------------------------------------------------
export const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(
        errors
          .array()
          .map((e) => e.msg)
          .join(". ")
      );
    }

    const { email, password } = req.body;

    // Find user and explicitly include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get current logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private
// ---------------------------------------------------------------------------
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Update current user's profile
// @route   PUT /api/auth/profile
// @access  Private
// ---------------------------------------------------------------------------
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Update allowed fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    // Support both legacy `address` and new `addresses` array during migration
    if (req.body.addresses && Array.isArray(req.body.addresses)) {
      user.addresses = req.body.addresses;
    } else if (req.body.address) {
      user.address = { ...user.address?.toObject?.(), ...req.body.address };
    }

    // Only update password if provided
    if (req.body.password) {
      user.password = req.body.password; // Will be hashed by pre-save hook
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get all users (admin)
// @route   GET /api/auth/users
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password");

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Delete user by ID (admin)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      res.status(400);
      throw new Error("Cannot delete an admin user");
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

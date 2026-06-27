import { validationResult, body } from "express-validator";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { sendEmail, getVerificationEmailTemplate, getResetPasswordEmailTemplate } from "../utils/email.js";

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

export const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Please provide a valid email address"),
];

export const resetPasswordValidation = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user (password is hashed by the pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationToken: verificationTokenHash,
      verificationTokenExpire,
    });

    // Send verification email (async)
    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    const emailHtml = getVerificationEmailTemplate(user.name, verificationUrl);
    
    sendEmail({
      to: user.email,
      subject: "ShopSphere — Email Verification",
      html: emailHtml,
    }).catch((err) => {
      console.error("Failed to send verification email:", err.message);
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
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
      console.warn(`[SECURITY WARNING] Failed login attempt: Email not registered (${email})`);
      res.status(401);
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`[SECURITY WARNING] Failed login attempt: Incorrect password for ${email}`);
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
        isVerified: user.isVerified,
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

// ---------------------------------------------------------------------------
// @desc    Update user role (admin)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== "admin" && role !== "customer")) {
      res.status(400);
      throw new Error("Role must be 'admin' or 'customer'");
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.role = role;
    await user.save();

    res.json({ success: true, data: { _id: user._id, role: user.role } });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Forgot Password — request reset token email
// @route   POST /api/auth/forgot-password
// @access  Public
// ---------------------------------------------------------------------------
export const forgotPassword = async (req, res, next) => {
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

    const { email } = req.body;

    const user = await User.findOne({ email });

    const successResponse = {
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    };

    // Prevent user enumeration: do not disclose if email is registered
    if (!user) {
      return res.json(successResponse);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Save to user schema
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour expiration
    await user.save();

    // Send email
    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const emailHtml = getResetPasswordEmailTemplate(user.name, resetUrl);

    await sendEmail({
      to: user.email,
      subject: "ShopSphere — Password Reset Request",
      html: emailHtml,
    });

    res.json(successResponse);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Reset Password — modify credentials using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ---------------------------------------------------------------------------
export const resetPassword = async (req, res, next) => {
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

    const rawToken = req.params.token;
    const { password } = req.body;

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired password reset token");
    }

    // Update password (pre-save hashes)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Verify Email — confirm user verification token
// @route   POST /api/auth/verify-email/:token
// @access  Public
// ---------------------------------------------------------------------------
export const verifyEmail = async (req, res, next) => {
  try {
    const rawToken = req.params.token;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const user = await User.findOne({
      verificationToken: tokenHash,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired email verification token");
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Private
// ---------------------------------------------------------------------------
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error("Email is already verified");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

    user.verificationToken = verificationTokenHash;
    user.verificationTokenExpire = verificationTokenExpire;
    await user.save();

    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    const emailHtml = getVerificationEmailTemplate(user.name, verificationUrl);

    await sendEmail({
      to: user.email,
      subject: "ShopSphere — Email Verification",
      html: emailHtml,
    });

    res.json({
      success: true,
      message: "Verification email resent successfully",
    });
  } catch (error) {
    next(error);
  }
};

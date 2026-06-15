import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ---------------------------------------------------------------------------
// protect — Verify JWT and attach user to req
// ---------------------------------------------------------------------------
export const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — no token provided",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user (without password) to the request object
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — user no longer exists",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — token is invalid or expired",
    });
  }
};

// ---------------------------------------------------------------------------
// admin — Restrict access to admin-role users only
// Must be used AFTER the protect middleware
// ---------------------------------------------------------------------------
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Forbidden — admin access required",
  });
};

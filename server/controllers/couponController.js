import { validationResult } from "express-validator";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Helper function to validate coupon and return calculations
export const validateCouponCode = async ({ user, code, cartItems, subtotal }) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    throw new Error("Coupon code does not exist.");
  }

  if (!coupon.isActive) {
    throw new Error("This coupon is currently inactive.");
  }

  const now = new Date();
  if (now < coupon.startDate) {
    throw new Error("This coupon is not active yet.");
  }
  if (now > coupon.expiryDate) {
    throw new Error("This coupon has expired.");
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("This coupon has reached its maximum global usage limit.");
  }

  if (subtotal < coupon.minimumOrderAmount) {
    throw new Error(`Minimum purchase of $${coupon.minimumOrderAmount.toFixed(2)} is required to apply this coupon.`);
  }

  // Check user-specific limit
  if (user && coupon.perUserLimit > 0) {
    const userUsageCount = await Order.countDocuments({
      user: user._id,
      couponCode: coupon.code,
      status: { $ne: "cancelled" },
    });
    if (userUsageCount >= coupon.perUserLimit) {
      throw new Error("You have reached the maximum usage limit for this coupon.");
    }
  }

  // Check user eligibility if restricted
  if (coupon.applicableUsers && coupon.applicableUsers.length > 0 && user) {
    const isAllowedUser = coupon.applicableUsers.some(
      (id) => id.toString() === user._id.toString()
    );
    if (!isAllowedUser) {
      throw new Error("This coupon is not applicable to your account.");
    }
  }

  // Filter eligible cart items based on inclusions and exclusions
  let eligibleSubtotal = 0;
  for (const item of cartItems) {
    const productId = item.product ? item.product.toString() : "";

    // Excluded products check
    if (coupon.excludedProducts && coupon.excludedProducts.some((id) => id.toString() === productId)) {
      continue;
    }

    // Applicable products check
    const hasProductRestriction = coupon.applicableProducts && coupon.applicableProducts.length > 0;
    const isProductAllowed = !hasProductRestriction || coupon.applicableProducts.some((id) => id.toString() === productId);

    // Applicable categories check
    const hasCategoryRestriction = coupon.applicableCategories && coupon.applicableCategories.length > 0;
    let isCategoryAllowed = true;

    if (hasCategoryRestriction) {
      const dbProduct = await Product.findById(productId);
      const categoryName = dbProduct?.category || "";
      isCategoryAllowed = coupon.applicableCategories.some(
        (cat) => cat.toLowerCase() === categoryName.toLowerCase()
      );
    }

    if (isProductAllowed && isCategoryAllowed) {
      eligibleSubtotal += item.price * item.quantity;
    }
  }

  if (eligibleSubtotal <= 0) {
    throw new Error("This coupon is not applicable to any items in your cart.");
  }

  // Calculate discount value
  let discountApplied = 0;
  if (coupon.discountType === "percentage") {
    discountApplied = (eligibleSubtotal * coupon.discountValue) / 100;
    if (coupon.maximumDiscount > 0 && discountApplied > coupon.maximumDiscount) {
      discountApplied = coupon.maximumDiscount;
    }
  } else if (coupon.discountType === "fixed") {
    discountApplied = Math.min(coupon.discountValue, eligibleSubtotal);
  }

  // Cap to global order subtotal
  discountApplied = Math.max(0, Math.min(discountApplied, subtotal));

  return {
    coupon,
    discountApplied,
  };
};

// @desc    Validate a coupon code (client)
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartItems } = req.body;
    if (!code) {
      res.status(400);
      throw new Error("Coupon code is required");
    }
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      res.status(400);
      throw new Error("Cart items are required for validation");
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const { coupon, discountApplied } = await validateCouponCode({
      user: req.user,
      code,
      cartItems,
      subtotal,
    });

    res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountApplied,
      message: `Coupon '${coupon.code}' applied successfully.`,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

// @desc    Get all coupons (admin)
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.code = { $regex: req.query.search, $options: "i" };
    }

    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      coupons,
      totalCoupons: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a coupon (admin)
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array().map((e) => e.msg).join(". "));
    }

    const { code } = req.body;
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      res.status(400);
      throw new Error("A coupon with this code already exists.");
    }

    const coupon = await Coupon.create({
      ...req.body,
      code: code.toUpperCase(),
    });

    res.status(201).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a coupon (admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array().map((e) => e.msg).join(". "));
    }

    let coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
      if (existing) {
        res.status(400);
        throw new Error("A coupon with this code already exists.");
      }
      req.body.code = req.body.code.toUpperCase();
    }

    coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a coupon (admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

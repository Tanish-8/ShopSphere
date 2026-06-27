import { validationResult, body } from "express-validator";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------
export const orderValidation = [
  body("orderItems")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("orderItems.*.product")
    .notEmpty()
    .withMessage("Product ID is required for each item"),
  body("orderItems.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("shippingAddress.street")
    .trim()
    .notEmpty()
    .withMessage("Street address is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),
  body("shippingAddress.zipCode")
    .trim()
    .notEmpty()
    .withMessage("Zip code is required"),
  body("shippingAddress.country")
    .trim()
    .notEmpty()
    .withMessage("Country is required"),
  body("paymentMethod")
    .isIn(["card", "paypal", "cod", "razorpay"])
    .withMessage("Payment method must be card, paypal, cod, or razorpay"),
];

export const calculateOrderPrices = async (items, couponCode, user) => {
  const itemsPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discountApplied = 0;
  let couponData = null;

  if (couponCode) {
    try {
      const { validateCouponCode } = await import("./couponController.js");
      const result = await validateCouponCode({
        user,
        code: couponCode,
        cartItems: items,
        subtotal: itemsPrice,
      });
      discountApplied = result.discountApplied;
      couponData = result.coupon;
    } catch (error) {
      console.warn("Coupon validation failed during price calculation:", error.message);
      throw error;
    }
  }

  const subtotalAfterDiscount = Math.max(0, itemsPrice - discountApplied);
  const taxPrice = +(subtotalAfterDiscount * 0.18).toFixed(2); // 18% tax
  const shippingPrice = itemsPrice > 500 ? 0 : 50; // Free shipping over $500
  const totalPrice = +(subtotalAfterDiscount + taxPrice + shippingPrice).toFixed(2);

  return {
    itemsPrice,
    discountApplied,
    taxPrice,
    shippingPrice,
    totalPrice: Math.max(0, totalPrice),
    couponCode: couponData ? couponData.code : undefined,
    discountType: couponData ? couponData.discountType : undefined,
    discountValue: couponData ? couponData.discountValue : undefined,
  };
};

// ---------------------------------------------------------------------------
// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
// ---------------------------------------------------------------------------
export const createOrder = async (req, res, next) => {
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

    const { orderItems, shippingAddress, paymentMethod } = req.body;

    // Verify each product exists and build the order items with current prices
    const verifiedItems = [];
    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }

      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`
        );
      }

      verifiedItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Calculate prices
    const { couponCode } = req.body;
    const prices = await calculateOrderPrices(verifiedItems, couponCode, req.user);

    const order = await Order.create({
      user: req.user._id,
      orderItems: verifiedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: prices.itemsPrice,
      taxPrice: prices.taxPrice,
      shippingPrice: prices.shippingPrice,
      totalPrice: prices.totalPrice,
      couponCode: prices.couponCode,
      discountType: prices.discountType,
      discountValue: prices.discountValue,
      discountApplied: prices.discountApplied,
      statusHistory: [
        { status: "ordered", at: Date.now(), changedBy: req.user._id },
      ],
    });

    // If coupon applied successfully, increment usage count in DB
    if (prices.couponCode) {
      const Coupon = (await import("../models/Coupon.js")).default;
      await Coupon.findOneAndUpdate(
        { code: prices.couponCode },
        { $inc: { usedCount: 1 } }
      );
    }

    // Reduce stock for each ordered product
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get logged-in user's orders
// @route   GET /api/orders/myorders
// @access  Private
// ---------------------------------------------------------------------------
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
// ---------------------------------------------------------------------------
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Customers can only view their own orders; admins can view any
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to view this order");
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments();
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const { status } = req.body;

    if (!status) {
      res.status(400);
      throw new Error("Status is required");
    }

    // Validate allowed transitions
    const allowed = {
      ordered: ["processing"],
      processing: ["shipped"],
      shipped: ["delivered"],
    };

    const prevStatusRaw = order.status || "ordered";
    const prevStatus = prevStatusRaw === "pending" ? "ordered" : prevStatusRaw;

    // If same status, nothing to do
    if (prevStatus === status) {
      return res.json({ success: true, data: order });
    }

    const allowedNext = allowed[prevStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status transition" });
    }

    // Append to history and update status
    const note = req.body.note;

    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({ status, at: Date.now(), note, changedBy: req.user._id });

    // Preserve previous status for potential restore logic
    const previousStatus = order.status;
    order.status = status;

    // Auto-set delivery fields
    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    // If cancelled, restore stock (only when moving into cancelled)
    if (status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    const updatedOrder = await order.save();

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Mark order as paid
// @route   PUT /api/orders/:id/pay
// @access  Private
// ---------------------------------------------------------------------------
export const updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Only the order owner or an admin can mark an order as paid
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to update this order");
    }

    order.isPaid = true;
    order.paidAt = Date.now();

    const updatedOrder = await order.save();

    res.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Calculate order prices preview
// @route   POST /api/orders/calculate
// @access  Private
// ---------------------------------------------------------------------------
export const getOrderPricePreview = async (req, res, next) => {
  try {
    const { orderItems, couponCode } = req.body;
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      res.status(400);
      throw new Error("Order must contain at least one item");
    }

    const verifiedItems = [];
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }

      verifiedItems.push({
        product: product._id,
        price: product.price,
        quantity: Number(item.quantity),
      });
    }

    const prices = await calculateOrderPrices(verifiedItems, couponCode, req.user);

    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Download order invoice as PDF
// @route   GET /api/orders/:id/invoice
// @access  Private
// ---------------------------------------------------------------------------
export const downloadOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error("Not authorized to download this invoice");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order._id}.pdf`
    );

    const { generateInvoicePDF } = await import("../utils/invoiceService.js");
    generateInvoicePDF(order, res);
  } catch (error) {
    next(error);
  }
};

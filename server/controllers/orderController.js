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
        { status: "Placed", at: Date.now(), changedBy: req.user._id },
      ],
      orderTimeline: [
        { status: "Placed", updatedAt: Date.now(), note: "Order placed successfully", updatedBy: req.user._id },
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
    const allowedStatuses = [
      "Placed",
      "Confirmed",
      "Packed",
      "Shipped",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
      "Return Requested",
      "Return Approved",
      "Pickup Scheduled",
      "Picked Up",
      "Returned",
      "Refund Processing",
      "Refunded",
      "Replacement Requested",
      "Replacement Approved",
      "Replacement Shipped",
      "Replacement Delivered"
    ];

    const prevStatus = order.status || "Placed";

    // If same status, nothing to do
    if (prevStatus.toLowerCase() === status.toLowerCase()) {
      return res.json({ success: true, data: order });
    }

    if (!allowedStatuses.some(s => s.toLowerCase() === status.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid status transition" });
    }

    // Append to history and update status
    const note = req.body.note;

    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({ status, at: Date.now(), note, changedBy: req.user._id });

    if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
    order.orderTimeline.push({
      status,
      updatedAt: Date.now(),
      note: note || `Order status updated to ${status}`,
      updatedBy: req.user._id,
    });

    // Preserve previous status for potential restore logic
    const previousStatus = order.status;
    order.status = status;

    // Prepare backend structure for future email notifications
    // TODO: Integrate sendEmail notifications template here
    // import { sendStatusUpdateEmail } from "../utils/email.js";
    // await sendStatusUpdateEmail(order.user, order._id, status);

    // Auto-set delivery fields
    if (status.toLowerCase() === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    // If cancelled, restore stock (only when moving into cancelled)
    if (status.toLowerCase() === "cancelled" && previousStatus?.toLowerCase() !== "cancelled") {
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

// ---------------------------------------------------------------------------
// @desc    Cancel order (customer/user)
// @route   PUT /api/orders/:id/cancel
// @access  Private
// ---------------------------------------------------------------------------
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Customer must be the owner of the order or admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Not authorized to cancel this order");
    }

    const currentStatus = order.status || "Placed";
    const isAdmin = req.user.role === "admin";

    // Configurable: statuses that block customer cancellation once shipped
    const nonCancelableByCustomer = ["shipped", "out for delivery", "delivered",
      "return requested", "return approved", "pickup scheduled", "picked up",
      "returned", "refund processing", "refunded",
      "replacement requested", "replacement approved", "replacement shipped", "replacement delivered"];

    // Admin can cancel any non-terminal status
    const nonCancelableByAdmin = ["cancelled", "refunded", "replacement delivered", "delivered"];

    if (isAdmin) {
      if (nonCancelableByAdmin.includes(currentStatus.toLowerCase())) {
        res.status(400);
        throw new Error(`Order cannot be cancelled at this stage: ${currentStatus}`);
      }
    } else {
      // Customer: can only cancel Placed, Confirmed, Packed
      const cancelableStatuses = ["placed", "confirmed", "packed"];
      if (!cancelableStatuses.includes(currentStatus.toLowerCase())) {
        const isShipped = nonCancelableByCustomer.includes(currentStatus.toLowerCase());
        res.status(400);
        throw new Error(
          isShipped
            ? `This order can no longer be cancelled because it has already been ${currentStatus.toLowerCase()}.`
            : `Order cannot be cancelled at this stage: ${currentStatus}`
        );
      }
    }

    const { reason } = req.body;
    const validReasons = [
      "Changed my mind",
      "Ordered by mistake",
      "Found lower price",
      "Delivery taking too long",
      "Need different product",
      "Other"
    ];
    const cancellationReason = reason || "Changed my mind";

    const cancelledAt = new Date();
    const cancelledByRole = isAdmin ? "admin" : "customer";
    const cancellerNote = isAdmin
      ? `Cancelled by admin. Reason: ${cancellationReason}`
      : `Cancelled by customer. Reason: ${cancellationReason}`;

    // Set order status and cancellation tracking fields
    order.status = "Cancelled";
    order.cancelledAt = cancelledAt;
    order.cancelledBy = req.user._id;
    order.cancelledByRole = cancelledByRole;
    order.cancellationReason = cancellationReason;

    // Add history log for cancellation
    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: "Cancelled",
      at: cancelledAt,
      note: cancellerNote,
      changedBy: req.user._id,
    });

    if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
    order.orderTimeline.push({
      status: "Cancelled",
      updatedAt: cancelledAt,
      note: cancellerNote,
      updatedBy: req.user._id,
    });

    // If prepaid (isPaid is true or paymentMethod is not cod)
    // Automatically create Refund Processing request or automated Razorpay refund
    if (order.paymentMethod === "razorpay" && order.isPaid) {
      const paymentId = order.paymentResult?.paymentId;
      if (paymentId) {
        const isSimulated = paymentId.startsWith("pay_") || paymentId.startsWith("sim_");
        if (isSimulated || process.env.RAZORPAY_KEY_ID.includes("your_") || process.env.RAZORPAY_KEY_ID.includes("placeholder")) {
          // Simulate Razorpay refund
          order.paymentStatus = "refunded";
          order.refundResult = {
            refundId: `rfnd_sim_${Math.random().toString(36).substring(2, 11)}`,
            amount: order.totalPrice,
            method: "razorpay",
            status: "completed",
            date: new Date(),
          };
          order.statusHistory.push({
            status: "Refunded",
            at: Date.now(),
            note: `Automated Razorpay refund processed. Refund ID: ${order.refundResult.refundId}`,
            changedBy: req.user._id,
          });

          if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
          order.orderTimeline.push({
            status: "Refunded",
            updatedAt: Date.now(),
            note: `Automated Razorpay refund processed. Refund ID: ${order.refundResult.refundId}`,
            updatedBy: req.user._id,
          });
        } else {
          // Real Razorpay refund
          try {
            const Razorpay = (await import("razorpay")).default;
            const keyId = process.env.RAZORPAY_KEY_ID.trim();
            const keySecret = process.env.RAZORPAY_KEY_SECRET.trim();
            const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
            const refundObj = await client.payments.refund(paymentId, {
              amount: Math.round(order.totalPrice * 100),
            });
            order.paymentStatus = "refunded";
            order.refundResult = {
              refundId: refundObj.id,
              amount: order.totalPrice,
              method: "razorpay",
              status: "completed",
              date: new Date(),
            };
            order.statusHistory.push({
              status: "Refunded",
              at: Date.now(),
              note: `Automated Razorpay refund processed. Refund ID: ${refundObj.id}`,
              changedBy: req.user._id,
            });

            if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
            order.orderTimeline.push({
              status: "Refunded",
              updatedAt: Date.now(),
              note: `Automated Razorpay refund processed. Refund ID: ${refundObj.id}`,
              updatedBy: req.user._id,
            });
          } catch (err) {
            console.error("Automated Razorpay refund failed:", err.message);
            order.paymentStatus = "Refund Processing";
            order.statusHistory.push({
              status: "Refund Processing",
              at: Date.now(),
              note: `Automated Razorpay refund failed. Reason: ${err.message}`,
              changedBy: req.user._id,
            });

            if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
            order.orderTimeline.push({
              status: "Refund Processing",
              updatedAt: Date.now(),
              note: `Automated Razorpay refund failed. Reason: ${err.message}`,
              updatedBy: req.user._id,
            });
          }
        }
      }
    } else if (order.isPaid || order.paymentMethod !== "cod") {
      order.paymentStatus = "Refund Processing";
      order.statusHistory.push({
        status: "Refund Processing",
        at: Date.now(),
        note: `Automatic refund processing request generated.`,
        changedBy: req.user._id,
      });

      if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
      order.orderTimeline.push({
        status: "Refund Processing",
        updatedAt: Date.now(),
        note: `Automatic refund processing request generated.`,
        updatedBy: req.user._id,
      });
    }

    // Invalidate coupon usage count if coupon applied
    if (order.couponCode) {
      try {
        const Coupon = (await import("../models/Coupon.js")).default;
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          { $inc: { usedCount: -1 } }
        );
      } catch (err) {
        console.warn("Failed to update coupon usage on cancellation:", err.message);
      }
    }

    // Restore product inventory
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: "Order has been cancelled successfully.",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Request order return (customer/user)
// @route   PUT /api/orders/:id/return
// @access  Private
// ---------------------------------------------------------------------------
export const requestOrderReturn = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Customer must be the owner of the order or admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Not authorized to return this order");
    }

    const currentStatus = order.status || "Placed";

    // Only allow returns if order status == Delivered
    if (currentStatus.toLowerCase() !== "delivered") {
      res.status(400);
      throw new Error("Only delivered orders can be returned.");
    }

    // Within return window (default 7 days from deliveredAt or updatedAt)
    const deliveredDate = new Date(order.deliveredAt || order.updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now - deliveredDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      res.status(400);
      throw new Error("Return window has expired (7 days max).");
    }

    const { type, reason, comments, images, video } = req.body;
    if (!reason) {
      res.status(400);
      throw new Error("Reason is required");
    }

    const requestType = type === "replacement" ? "replacement" : "return";
    const statusText = requestType === "replacement" ? "Replacement Requested" : "Return Requested";

    // Set order status
    order.status = statusText;

    // Populate return/replacement details
    order.returnReplacementDetails = {
      type: requestType,
      reason,
      comments,
      images: (images || []).slice(0, 5),
      video: video || undefined,
      requestedAt: new Date()
    };

    const logNote = `${requestType === "replacement" ? "Replacement" : "Return"} requested by customer. Reason: ${reason}.${comments ? ` Comments: ${comments}` : ""}`;

    // Add status history entry
    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: statusText,
      at: Date.now(),
      note: logNote,
      changedBy: req.user._id,
    });

    if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
    order.orderTimeline.push({
      status: statusText,
      updatedAt: Date.now(),
      note: logNote,
      updatedBy: req.user._id,
    });

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: `${requestType === "replacement" ? "Replacement" : "Return"} request submitted successfully.`,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Initiate order refund (Admin only)
// @route   POST /api/orders/:id/refund
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const adminProcessRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const { refundAmount, method, upiId, bankAccount, bankIfsc } = req.body;
    const amount = Number(refundAmount || order.totalPrice);

    let refundId = `rfnd_adm_${Math.random().toString(36).substring(2, 11)}`;
    let refundStatus = "completed";
    let refundNote = `Refund of $${amount.toFixed(2)} processed via ${method || order.paymentMethod}.`;

    if (order.paymentMethod === "razorpay" && order.isPaid) {
      const paymentId = order.paymentResult?.paymentId;
      if (paymentId && !paymentId.startsWith("pay_sim") && !paymentId.startsWith("sim_") && !process.env.RAZORPAY_KEY_ID.includes("your_") && !process.env.RAZORPAY_KEY_ID.includes("placeholder")) {
        try {
          const Razorpay = (await import("razorpay")).default;
          const keyId = process.env.RAZORPAY_KEY_ID.trim();
          const keySecret = process.env.RAZORPAY_KEY_SECRET.trim();
          const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const refundObj = await client.payments.refund(paymentId, {
            amount: Math.round(amount * 100),
          });
          refundId = refundObj.id;
        } catch (err) {
          res.status(400);
          throw new Error(`Razorpay refund failed: ${err.message}`);
        }
      } else {
        refundId = `rfnd_sim_${Math.random().toString(36).substring(2, 11)}`;
      }
    } else if (order.paymentMethod === "cod") {
      if (method === "UPI" && upiId) {
        refundNote += ` UPI ID: ${upiId}`;
      } else if (method === "Bank Transfer" && bankAccount) {
        refundNote += ` Bank Account: ${bankAccount}, IFSC: ${bankIfsc || "N/A"}`;
      }
    }

    order.paymentStatus = "refunded";
    order.status = "Refunded";

    order.refundResult = {
      refundId,
      amount,
      method: method || order.paymentMethod,
      status: refundStatus,
      date: new Date(),
    };

    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: "Refunded",
      at: Date.now(),
      note: refundNote,
      changedBy: req.user._id,
    });

    if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
    order.orderTimeline.push({
      status: "Refunded",
      updatedAt: Date.now(),
      note: refundNote,
      updatedBy: req.user._id,
    });

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: "Refund initiated successfully.",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

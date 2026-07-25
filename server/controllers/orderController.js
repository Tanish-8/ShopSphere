import { validationResult, body } from "express-validator";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { ORDER_STATUS, PAYMENT_STATUS, CANCELLABLE_STATUSES } from "../utils/constants.js";

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

    const isOnlinePrepaid = ["card", "paypal"].includes(paymentMethod);
    const initialPaymentStatus = isOnlinePrepaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING;
    const initialIsPaid = isOnlinePrepaid;
    const initialPaidAt = isOnlinePrepaid ? new Date() : undefined;

    const initialTimeline = [
      { status: ORDER_STATUS.PLACED, updatedAt: Date.now(), note: "Order placed successfully", updatedBy: req.user._id }
    ];
    if (isOnlinePrepaid) {
      initialTimeline.push({
        status: "Payment Successful",
        updatedAt: Date.now(),
        note: `Payment of $${prices.totalPrice.toFixed(2)} completed successfully via ${paymentMethod}`,
        updatedBy: req.user._id
      });
      initialTimeline.push({
        status: ORDER_STATUS.CONFIRMED,
        updatedAt: Date.now(),
        note: "Order confirmed automatically after successful payment",
        updatedBy: req.user._id
      });
    }

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
      isPaid: initialIsPaid,
      paidAt: initialPaidAt,
      paymentStatus: initialPaymentStatus,
      status: isOnlinePrepaid ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PLACED,
      statusHistory: isOnlinePrepaid ? [
        { status: ORDER_STATUS.PLACED, at: Date.now(), changedBy: req.user._id },
        { status: "Payment Successful", at: Date.now(), changedBy: req.user._id },
        { status: ORDER_STATUS.CONFIRMED, at: Date.now(), changedBy: req.user._id }
      ] : [
        { status: ORDER_STATUS.PLACED, at: Date.now(), changedBy: req.user._id }
      ],
      orderTimeline: initialTimeline,
    });

    if (isOnlinePrepaid) {
      try {
        const { sendStatusUpdateNotification } = await import("../utils/email.js");
        const populatedUser = await User.findById(req.user._id);
        if (populatedUser) {
          await sendStatusUpdateNotification(populatedUser, order._id, "Order Confirmed", "Order confirmed automatically after successful payment");
        }
      } catch (emailErr) {
        console.warn("Failed to send order confirmation email:", emailErr.message);
      }
    }

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

    const prevStatusUpper = (order.status || ORDER_STATUS.PLACED).toUpperCase();
    const newStatusUpper = status.toUpperCase();

    if (!ORDER_STATUS[newStatusUpper]) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    // If same status, nothing to do
    if (prevStatusUpper === newStatusUpper) {
      return res.json({ success: true, data: order });
    }

    // Enforce strict sequential transition for core fulfilment status
    const coreFlow = [
      ORDER_STATUS.PLACED,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED
    ];
    const prevCoreIdx = coreFlow.indexOf(prevStatusUpper);
    const newCoreIdx = coreFlow.indexOf(newStatusUpper);

    if (prevCoreIdx !== -1 && newCoreIdx !== -1) {
      if (newCoreIdx !== prevCoreIdx + 1) {
        res.status(400);
        throw new Error(`Invalid transition: Cannot move directly from "${prevStatusUpper}" to "${newStatusUpper}". Must follow sequential flow: PLACED -> CONFIRMED -> PACKED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED.`);
      }
    }

    // Enforce extra transition constraints
    if (prevStatusUpper === ORDER_STATUS.CANCELLED && coreFlow.includes(newStatusUpper)) {
      res.status(400);
      throw new Error("Cannot progress or ship a cancelled order.");
    }

    if (prevStatusUpper === ORDER_STATUS.DELIVERED && newStatusUpper === ORDER_STATUS.CANCELLED) {
      res.status(400);
      throw new Error("Cannot cancel a delivered order.");
    }

    if (newStatusUpper === ORDER_STATUS.CANCELLED) {
      if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED, ORDER_STATUS.REFUNDED].includes(prevStatusUpper)) {
        res.status(400);
        throw new Error("Order can no longer be cancelled once it has been shipped or completed.");
      }
    }

    // Append to history and update status
    const note = req.body.note;

    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({ status: newStatusUpper, at: Date.now(), note, changedBy: req.user._id });

    if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
    order.orderTimeline.push({
      status: newStatusUpper,
      updatedAt: Date.now(),
      note: note || `Order status updated to ${newStatusUpper}`,
      updatedBy: req.user._id,
    });

    const previousStatus = order.status;
    order.status = newStatusUpper;

    // Auto-set delivery fields and COD payment collection
    if (newStatusUpper === ORDER_STATUS.DELIVERED) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      if (order.paymentMethod === "cod") {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = PAYMENT_STATUS.PAID;

        // Push timeline entry for payment collection
        order.orderTimeline.push({
          status: "Payment Collected",
          updatedAt: Date.now(),
          note: "COD payment collected successfully at the time of delivery",
          updatedBy: req.user._id
        });
        order.statusHistory.push({
          status: "Payment Collected",
          at: Date.now(),
          note: "COD payment collected successfully at the time of delivery",
          changedBy: req.user._id
        });
      }
    }

    // If cancelled, restore stock (only when moving into cancelled)
    if (newStatusUpper === ORDER_STATUS.CANCELLED && previousStatus !== ORDER_STATUS.CANCELLED) {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    const updatedOrder = await order.save();

    // Dispatch status update notifications
    try {
      const { sendStatusUpdateNotification } = await import("../utils/email.js");
      const populatedUser = await User.findById(order.user);
      if (populatedUser) {
        let notificationStatus = newStatusUpper;
        if (newStatusUpper === ORDER_STATUS.CONFIRMED) notificationStatus = "Order Confirmed";
        else if (newStatusUpper === ORDER_STATUS.PACKED) notificationStatus = "Order Packed";
        else if (newStatusUpper === ORDER_STATUS.SHIPPED) notificationStatus = "Order Shipped";
        else if (newStatusUpper === ORDER_STATUS.OUT_FOR_DELIVERY) notificationStatus = "Out For Delivery";
        else if (newStatusUpper === ORDER_STATUS.DELIVERED) notificationStatus = "Delivered";
        else if (newStatusUpper === ORDER_STATUS.CANCELLED) notificationStatus = "Cancelled";

        await sendStatusUpdateNotification(
          populatedUser,
          order._id,
          notificationStatus,
          note || `Your order status has been updated to ${newStatusUpper}.`
        );
      }
    } catch (emailErr) {
      console.warn("Failed to send status update email notification:", emailErr.message);
    }

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

    if (order.paymentMethod === "cod" && (order.status || "").toUpperCase() !== ORDER_STATUS.DELIVERED) {
      res.status(400);
      throw new Error("Cannot mark COD order as Paid before it is Delivered.");
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = PAYMENT_STATUS.PAID;

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

    const currentStatusUpper = (order.status || ORDER_STATUS.PLACED).toUpperCase();

    // Cancellation is allowed ONLY when status is PLACED, CONFIRMED, PACKED
    if (!CANCELLABLE_STATUSES.includes(currentStatusUpper)) {
      res.status(400);
      throw new Error(`This order can no longer be cancelled because it is in status: ${currentStatusUpper}.`);
    }

    const { reason } = req.body;
    const cancellationReason = reason || "Changed my mind";

    const cancelledAt = new Date();
    const isAdmin = req.user.role === "admin";
    const cancelledByRole = isAdmin ? "admin" : "customer";
    const cancellerNote = isAdmin
      ? `Cancelled by admin. Reason: ${cancellationReason}`
      : `Cancelled by customer. Reason: ${cancellationReason}`;

    // Set order status and cancellation tracking fields
    order.status = ORDER_STATUS.CANCELLED;
    order.cancelledAt = cancelledAt;
    order.cancelledBy = req.user._id;
    order.cancelledByRole = cancelledByRole;
    order.cancellationReason = cancellationReason;

    // Add history log for cancellation
    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      at: cancelledAt,
      note: cancellerNote,
      changedBy: req.user._id,
    });

    if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
    order.orderTimeline.push({
      status: ORDER_STATUS.CANCELLED,
      updatedAt: cancelledAt,
      note: cancellerNote,
      updatedBy: req.user._id,
    });

    // If prepaid (isPaid is true or paymentMethod is not cod)
    // Automatically create Refund Pending request or automated Razorpay refund
    if (order.paymentMethod === "razorpay" && order.isPaid) {
      const paymentId = order.paymentResult?.paymentId;
      if (paymentId) {
        const isSimulated = paymentId.startsWith("pay_") || paymentId.startsWith("sim_");
        if (isSimulated || process.env.RAZORPAY_KEY_ID.includes("your_") || process.env.RAZORPAY_KEY_ID.includes("placeholder")) {
          // Simulate Razorpay refund
          order.paymentStatus = PAYMENT_STATUS.REFUNDED;
          order.refundResult = {
            refundId: `rfnd_sim_${Math.random().toString(36).substring(2, 11)}`,
            amount: order.totalPrice,
            method: "razorpay",
            status: "completed",
            date: new Date(),
          };
          order.statusHistory.push({
            status: ORDER_STATUS.REFUNDED,
            at: Date.now(),
            note: `Automated Razorpay refund processed. Refund ID: ${order.refundResult.refundId}`,
            changedBy: req.user._id,
          });

          if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
          order.orderTimeline.push({
            status: ORDER_STATUS.REFUNDED,
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
            order.paymentStatus = PAYMENT_STATUS.REFUNDED;
            order.refundResult = {
              refundId: refundObj.id,
              amount: order.totalPrice,
              method: "razorpay",
              status: "completed",
              date: new Date(),
            };
            order.statusHistory.push({
              status: ORDER_STATUS.REFUNDED,
              at: Date.now(),
              note: `Automated Razorpay refund processed. Refund ID: ${refundObj.id}`,
              changedBy: req.user._id,
            });

            if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
            order.orderTimeline.push({
              status: ORDER_STATUS.REFUNDED,
              updatedAt: Date.now(),
              note: `Automated Razorpay refund processed. Refund ID: ${refundObj.id}`,
              updatedBy: req.user._id,
            });
          } catch (err) {
            console.error("Automated Razorpay refund failed:", err.message);
            order.paymentStatus = PAYMENT_STATUS.REFUND_PENDING;
            order.statusHistory.push({
              status: PAYMENT_STATUS.REFUND_PENDING,
              at: Date.now(),
              note: `Automated Razorpay refund failed. Reason: ${err.message}`,
              changedBy: req.user._id,
            });

            if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
            order.orderTimeline.push({
              status: PAYMENT_STATUS.REFUND_PENDING,
              updatedAt: Date.now(),
              note: `Automated Razorpay refund failed. Reason: ${err.message}`,
              updatedBy: req.user._id,
            });
          }
        }
      }
    } else if (order.isPaid || order.paymentMethod !== "cod") {
      order.paymentStatus = PAYMENT_STATUS.REFUND_PENDING;
      order.statusHistory.push({
        status: PAYMENT_STATUS.REFUND_PENDING,
        at: Date.now(),
        note: `Automatic refund processing request generated.`,
        changedBy: req.user._id,
      });

      if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
      order.orderTimeline.push({
        status: PAYMENT_STATUS.REFUND_PENDING,
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

    // Send Cancellation & Refund notifications
    try {
      const { sendStatusUpdateNotification } = await import("../utils/email.js");
      const populatedUser = await User.findById(order.user);
      if (populatedUser) {
        await sendStatusUpdateNotification(populatedUser, order._id, "Cancelled", cancellerNote);

        if (order.paymentStatus === PAYMENT_STATUS.REFUNDED) {
          await sendStatusUpdateNotification(populatedUser, order._id, "Refund Completed", `Refund of $${order.totalPrice.toFixed(2)} completed successfully.`);
        } else if (order.paymentStatus === PAYMENT_STATUS.REFUND_PENDING) {
          await sendStatusUpdateNotification(populatedUser, order._id, "Refund Initiated", `Refund of $${order.totalPrice.toFixed(2)} has been initiated.`);
        }
      }
    } catch (emailErr) {
      console.warn("Failed to send cancellation email notification:", emailErr.message);
    }

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

    const currentStatusUpper = (order.status || ORDER_STATUS.PLACED).toUpperCase();

    // Only allow returns if order status == DELIVERED
    if (currentStatusUpper !== ORDER_STATUS.DELIVERED) {
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
    const statusText = ORDER_STATUS.RETURNED;

    // Set order status
    order.status = statusText;
    if (requestType === "return") {
      order.paymentStatus = PAYMENT_STATUS.REFUND_PENDING;
    }

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

    if (!order.isPaid) {
      res.status(400);
      throw new Error("Cannot refund an unpaid order.");
    }

    const currentStatusUpper = (order.status || "").toUpperCase();
    const allowedRefundStatuses = [ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED, ORDER_STATUS.REFUNDED];
    if (!allowedRefundStatuses.includes(currentStatusUpper)) {
      res.status(400);
      throw new Error("Refunds are only allowed after the order is Cancelled or Returned.");
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

    order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    order.status = ORDER_STATUS.REFUNDED;

    order.refundResult = {
      refundId,
      amount,
      method: method || order.paymentMethod,
      status: refundStatus,
      date: new Date(),
    };

    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: ORDER_STATUS.REFUNDED,
      at: Date.now(),
      note: refundNote,
      changedBy: req.user._id,
    });

    if (!Array.isArray(order.orderTimeline)) order.orderTimeline = [];
    order.orderTimeline.push({
      status: ORDER_STATUS.REFUNDED,
      updatedAt: Date.now(),
      note: refundNote,
      updatedBy: req.user._id,
    });

    const updatedOrder = await order.save();

    // Trigger Refund Completed notification
    try {
      const { sendStatusUpdateNotification } = await import("../utils/email.js");
      const populatedUser = await User.findById(order.user);
      if (populatedUser) {
        await sendStatusUpdateNotification(populatedUser, order._id, "Refund Completed", refundNote);
      }
    } catch (emailErr) {
      console.warn("Failed to send refund completed email notification:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Refund initiated successfully.",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

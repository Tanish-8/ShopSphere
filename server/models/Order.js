import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      street: { type: String, required: [true, "Street is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      zipCode: { type: String, required: [true, "Zip code is required"] },
      country: { type: String, required: [true, "Country is required"] },
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["card", "paypal", "cod", "razorpay"],
      default: "card",
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      enum: [
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
      ],
      default: "Placed",
    },
    statusHistory: [
      {
        status: { type: String },
        at: { type: Date, default: Date.now },
        note: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    orderTimeline: [
      {
        status: { type: String },
        updatedAt: { type: Date, default: Date.now },
        note: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    // Cancellation tracking
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledByRole: { type: String, enum: ["customer", "admin"] },
    returnReplacementDetails: {
      type: { type: String, enum: ["return", "replacement"] },
      reason: { type: String },
      comments: { type: String },
      images: [{ type: String }],
      video: { type: String },
      requestedAt: { type: Date },
      actionedAt: { type: Date },
      adminNotes: { type: String }
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    paymentResult: {
      paymentId: { type: String },
      paymentMethod: { type: String },
      paymentDate: { type: Date },
      razorpayOrderId: { type: String },
      razorpaySignature: { type: String },
    },
    refundResult: {
      refundId: { type: String },
      amount: { type: Number },
      method: { type: String },
      status: { type: String },
      date: { type: Date },
      error: { type: String },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "Refund Processing"],
      default: "pending",
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    couponCode: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
    },
    discountValue: {
      type: Number,
      default: 0.0,
    },
    discountApplied: {
      type: Number,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;

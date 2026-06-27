import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: [true, "Coupon description is required"],
    },
    discountType: {
      type: String,
      required: [true, "Discount type is required"],
      enum: ["percentage", "fixed"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    minimumOrderAmount: {
      type: Number,
      default: 0.0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maximumDiscount: {
      type: Number,
      default: 0.0, // 0 means no limit
      min: [0, "Maximum discount cannot be negative"],
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 means unlimited
      min: [0, "Usage limit cannot be negative"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },
    perUserLimit: {
      type: Number,
      default: 1, // default 1 use per user
      min: [0, "Per-user limit cannot be negative"],
    },
    applicableCategories: [
      {
        type: String,
        trim: true,
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiryDate: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;

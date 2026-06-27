import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w.-]+@[\w.-]+\.\w{2,}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    phone: {
      type: String,
      trim: true,
    },
    // Legacy single-address field (kept for backward compatibility during migration)
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },

    // New: saved addresses array (address book)
    addresses: [
      {
        label: { type: String, trim: true }, // Home, Work, Other, or custom
        fullName: { type: String, trim: true },
        phone: { type: String, trim: true },
        landmark: { type: String, trim: true },
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Pre-save hook — hash password before persisting
// ---------------------------------------------------------------------------
userSchema.pre("save", async function (next) {
  // Only hash the password if it was modified (or is new)
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---------------------------------------------------------------------------
// Instance method — compare candidate password with stored hash
// ---------------------------------------------------------------------------
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;

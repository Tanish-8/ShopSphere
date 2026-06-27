import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import compression from "compression";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import { handleWebhook } from './controllers/paymentController.js';
import migrateAddresses from "./utils/migrateAddresses.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./config/swagger.js";

// ---------------------------------------------------------------------------
// Load environment variables (must be the very first thing)
// ---------------------------------------------------------------------------
dotenv.config();

// ---------------------------------------------------------------------------
// Initialize Express
// ---------------------------------------------------------------------------
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// Enable compression to optimize payload size
app.use(compression());

// Secure HTTP headers with Helmet (includes HSTS, Referrer, and Content Security Policy)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://checkout.razorpay.com",
          "https://api.razorpay.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://images.unsplash.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.razorpay.com",
          "https://lumberjack-cx.razorpay.com",
        ],
        frameSrc: ["'self'", "https://api.razorpay.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "same-origin" },
  })
);

// Prevent NoSQL query injection
app.use(mongoSanitize());

// Prevent XSS script injections
app.use(xss());

// Prevent HTTP parameter pollution
app.use(hpp());

// General API request rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", generalLimiter);

// Webhook raw body handler must run before JSON body parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Parse JSON bodies (enforce 20kb limit to mitigate large payload DOS attacks)
app.use(express.json({ limit: "20kb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// Enable CORS for frontend
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ];
      if (process.env.CORS_ORIGIN) {
        const origins = process.env.CORS_ORIGIN.split(",").map((o) => o.trim());
        allowed.push(...origins);
      }
      if (process.env.CLIENT_URL) {
        allowed.push(process.env.CLIENT_URL);
      }

      // Allow requests with no origin (e.g. server-to-server, curl)
      if (!origin) return callback(null, true);

      if (allowed.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);

// HTTP request logger (dev mode only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serve uploaded files as static assets
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.get("/api", (req, res) => {
  res.json({
    message: "🛒 ShopSphere API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      orders: "/api/orders",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
    app.use("/api/addresses", addressRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/payments", paymentRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/coupons", couponRoutes);

  // Serve Swagger API Documentation (hidden in production by default unless ENABLE_SWAGGER_IN_PRODUCTION is true)
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER_IN_PRODUCTION === "true") {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start Server — connect to DB first, then listen
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Wait for MongoDB connection before accepting HTTP requests
    await connectDB();
        
        // Run address migration (idempotent) to preserve legacy single address
        await migrateAddresses();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`   http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error("💥 Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

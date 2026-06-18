import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import migrateAddresses from "./utils/migrateAddresses.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

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

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:5173",
        "http://localhost:5174",
      ];
      if (process.env.CLIENT_URL) allowed.push(process.env.CLIENT_URL);

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

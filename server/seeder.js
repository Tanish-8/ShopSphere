import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";
import User from "./models/User.js";
import products from "./data/products.js";
import { CATEGORIES } from "../shared/categories.js";

dotenv.config();

const ensureSeederUser = async () => {
  const adminUser = await User.findOne({ role: "admin" });
  if (adminUser) return adminUser._id;

  const anyUser = await User.findOne();
  if (anyUser) return anyUser._id;

  const createdUser = await User.create({
    name: "Seeder Admin",
    email: "seeder-admin@shopsphere.dev",
    password: "password123",
    role: "admin"
  });

  return createdUser._id;
};

const validateProductCatalog = (items) => {
  const skus = new Set();
  const names = new Set();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prefix = `Product at index ${i} (${item.name || "Unnamed"}):`;

    if (!item.name || typeof item.name !== "string" || item.name.trim() === "") {
      throw new Error(`${prefix} Missing or invalid product name.`);
    }
    if (!item.image || typeof item.image !== "string" || !item.image.startsWith("http")) {
      throw new Error(`${prefix} Missing or invalid image URL.`);
    }
    if (!item.category || typeof item.category !== "string" || item.category.trim() === "") {
      throw new Error(`${prefix} Missing or invalid category.`);
    }
    if (!CATEGORIES.includes(item.category)) {
      throw new Error(`${prefix} Invalid category name: "${item.category}". Not in canonical CATEGORIES list.`);
    }
    if (!item.brand || typeof item.brand !== "string" || item.brand.trim() === "") {
      throw new Error(`${prefix} Missing or invalid brand.`);
    }
    if (!item.description || typeof item.description !== "string" || item.description.trim() === "") {
      throw new Error(`${prefix} Missing or invalid description.`);
    }

    if (names.has(item.name.toLowerCase())) {
      throw new Error(`${prefix} Duplicate product name: "${item.name}".`);
    }
    names.add(item.name.toLowerCase());

    if (!item.sku || typeof item.sku !== "string") {
      throw new Error(`${prefix} Missing or invalid SKU.`);
    }
    if (skus.has(item.sku)) {
      throw new Error(`${prefix} Duplicate SKU found: "${item.sku}".`);
    }
    skus.add(item.sku);

    if (typeof item.price !== "number" || item.price <= 0) {
      throw new Error(`${prefix} Price must be a positive number (found ${item.price}).`);
    }
    if (typeof item.originalPrice !== "number" || item.originalPrice <= 0) {
      throw new Error(`${prefix} OriginalPrice must be a positive number (found ${item.originalPrice}).`);
    }
    if (typeof item.discount !== "number" || item.discount < 0 || item.discount > 100) {
      throw new Error(`${prefix} Discount must be a number between 0 and 100 (found ${item.discount}).`);
    }

    if (typeof item.rating !== "number" || item.rating < 1.0 || item.rating > 5.0) {
      throw new Error(`${prefix} Rating must be between 1.0 and 5.0 (found ${item.rating}).`);
    }
    if (typeof item.numReviews !== "number" || item.numReviews < 0) {
      throw new Error(`${prefix} numReviews must be a non-negative number (found ${item.numReviews}).`);
    }

    if (typeof item.countInStock !== "number" || item.countInStock < 0) {
      throw new Error(`${prefix} countInStock must be a non-negative number (found ${item.countInStock}).`);
    }

    if (!Array.isArray(item.features) || item.features.length === 0) {
      throw new Error(`${prefix} Product features must be a non-empty array.`);
    }
    if (!item.specifications || typeof item.specifications !== "object" || Object.keys(item.specifications).length === 0) {
      throw new Error(`${prefix} Product specifications must be a non-empty object.`);
    }
  }

  console.log(`✅ Automated Data Quality Validation Passed for all ${items.length} products.`);
};

const importData = async () => {
  try {
    // Validate first
    validateProductCatalog(products);

    await connectDB();

    await Product.deleteMany();

    const seederUserId = await ensureSeederUser();
    const productsToInsert = products.map((item) => ({
      user: seederUserId,
      name: item.name,
      brand: item.brand || "Unbranded",
      description: item.description,
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      discount: item.discount || 0,
      category: item.category,
      images: [item.image],
      stock: item.countInStock,
      rating: item.rating,
      numReviews: item.numReviews,
      badge: item.badge || "",
      sku: item.sku,
      tags: item.tags || [],
      features: item.features || [],
      specifications: item.specifications || {}
    }));

    await Product.insertMany(productsToInsert);
    console.log("Product data imported successfully.");
    process.exit(0);
  } catch (error) {
    console.error(`Seeder import failed: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await Product.deleteMany();
    console.log("Product data destroyed successfully.");
    process.exit(0);
  } catch (error) {
    console.error(`Seeder destroy failed: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}

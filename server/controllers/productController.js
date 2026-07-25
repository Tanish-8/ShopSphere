import { validationResult, body } from "express-validator";
import Product from "../models/Product.js";
import { deleteFromCloudinary, extractPublicIdFromUrl } from "../config/cloudinary.js";

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------
export const productValidation = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

export const reviewValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment").trim().notEmpty().withMessage("Comment is required"),
];

// ---------------------------------------------------------------------------
// @desc    Get all products (with search, filter, pagination)
// @route   GET /api/products
// @access  Public
// ---------------------------------------------------------------------------
export const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    // Build dynamic filter
    const filter = {};

    // Keyword / Search query (matches name, brand, category, description, and tags)
    const search = req.query.search || req.query.keyword;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Category filter (ignore 'All' category button click)
    if (req.query.category && req.query.category.toLowerCase() !== "all") {
      filter.category = { $regex: req.query.category, $options: "i" };
    }

    // Featured filter
    if (req.query.featured === "true") {
      filter.isFeatured = true;
    }

    // Brand filter (supports comma-separated multiple brands)
    if (req.query.brand) {
      const brands = req.query.brand.split(",").map(b => b.trim()).filter(Boolean);
      if (brands.length > 0) {
        filter.brand = { $in: brands.map(b => new RegExp("^" + b + "$", "i")) };
      }
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.rating) {
      filter.rating = { $gte: Number(req.query.rating) };
    }

    // Availability filter (supports comma-separated: in_stock, low_stock, out_of_stock)
    if (req.query.availability) {
      const avList = req.query.availability.split(",").map(a => a.trim()).filter(Boolean);
      const avFilters = [];
      if (avList.includes("in_stock")) {
        avFilters.push({ stock: { $gt: 5 } });
      }
      if (avList.includes("low_stock")) {
        avFilters.push({ stock: { $gt: 0, $lte: 5 } });
      }
      if (avList.includes("out_of_stock")) {
        avFilters.push({ stock: 0 });
      }
      if (avFilters.length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: avFilters });
      }
    } else if (req.query.inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    // Discount filter (minimum discount percentage)
    if (req.query.discount) {
      filter.discount = { $gte: Number(req.query.discount) };
    }

    // Badge filter
    if (req.query.badge) {
      filter.badge = { $regex: req.query.badge, $options: "i" };
    }

    // Sorting
    let sort = { createdAt: -1 }; // Default: newest first
    if (req.query.sort) {
      const sortMap = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        priceLow: { price: 1 },
        priceHigh: { price: -1 },
        rating: { rating: -1 },
        newest: { createdAt: -1 },
        popularity: { numReviews: -1, rating: -1 },
        highestRated: { rating: -1 },
        mostReviewed: { numReviews: -1 },
        discount: { discount: -1 },
        az: { name: 1 },
      };
      sort = sortMap[req.query.sort] || sort;
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products,
      products,
      totalProducts: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
// ---------------------------------------------------------------------------
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const createProduct = async (req, res, next) => {
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

    const productData = {
      ...req.body,
      user: req.user._id, // Admin who created the product
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const updateProduct = async (req, res, next) => {
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

    let product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Identify and delete replaced Cloudinary images
    const oldImages = product.images || [];
    const newImages = req.body.images || (req.body.image ? [req.body.image] : []);

    for (const oldUrl of oldImages) {
      if (!newImages.includes(oldUrl)) {
        const publicId = extractPublicIdFromUrl(oldUrl);
        if (publicId) {
          deleteFromCloudinary(publicId).catch((err) => {
            console.error(`Failed to delete replaced image ${publicId}:`, err.message);
          });
        }
      }
    }

    if (product.image && req.body.image && product.image !== req.body.image) {
      const publicId = extractPublicIdFromUrl(product.image);
      if (publicId) {
        deleteFromCloudinary(publicId).catch((err) => {
          console.error(`Failed to delete replaced image ${publicId}:`, err.message);
        });
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Delete associated Cloudinary images
    const imagesToDelete = [...(product.images || [])];
    if (product.image) {
      imagesToDelete.push(product.image);
    }

    for (const imageUrl of imagesToDelete) {
      const publicId = extractPublicIdFromUrl(imageUrl);
      if (publicId) {
        deleteFromCloudinary(publicId).catch((err) => {
          console.error(`Failed to delete image ${publicId}:`, err.message);
        });
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private
// ---------------------------------------------------------------------------
export const addProductReview = async (req, res, next) => {
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

    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Check if user has already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("You have already reviewed this product");
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get top-rated products
// @route   GET /api/products/top
// @access  Public
// ---------------------------------------------------------------------------
export const getTopProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ rating: -1 }).limit(5);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a product
export const getProductReviews = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).select('reviews rating numReviews');
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json({ success: true, data: product.reviews || [], rating: product.rating, numReviews: product.numReviews });
  } catch (error) {
    next(error);
  }
};

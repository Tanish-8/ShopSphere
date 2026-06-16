import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";
import User from "./models/User.js";
import products from "./data/products.js";

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

const importData = async () => {
  try {
    await connectDB();

    await Product.deleteMany();

    const seederUserId = await ensureSeederUser();
    const productsToInsert = products.map((item) => ({
      user: seederUserId,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      images: [item.image],
      stock: item.countInStock,
      rating: item.rating,
      numReviews: item.numReviews
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

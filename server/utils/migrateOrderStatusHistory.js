import 'dotenv/config';
import connectDB from "../config/db.js";
import Order from "../models/Order.js";
import { fileURLToPath } from "url";

// Idempotent migration: add statusHistory for orders missing it
const run = async () => {
  try {
    await connectDB();

    console.log("Starting migrateOrderStatusHistory...");

    const cursor = Order.find({ $or: [{ statusHistory: { $exists: false } }, { statusHistory: { $size: 0 } }] }).cursor();
    let count = 0;
    for (let order = await cursor.next(); order != null; order = await cursor.next()) {
      const history = [];
      // initial 'ordered' entry at createdAt
      history.push({ status: "ordered", at: order.createdAt || new Date(order._id.getTimestamp()) });

      // If current status is not 'ordered', add current status using updatedAt
      const currentStatus = order.status || "ordered";
      if (currentStatus !== "ordered") {
        const at = order.updatedAt || new Date();
        history.push({ status: currentStatus, at });
      }

      order.statusHistory = history;
      await order.save();
      count++;
      if (count % 50 === 0) console.log(`  Migrated ${count} orders...`);
    }

    console.log(`Migration complete. Orders migrated: ${count}`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

// If executed directly with `node migrateOrderStatusHistory.js`, run the migration
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  run();
}

export default run;

import User from "../models/User.js";

// Idempotent migration: copy legacy `address` into `addresses[0]` when addresses empty
import 'dotenv/config';

export default async function migrateAddresses() {
  try {
    const users = await User.find({ $or: [ { addresses: { $exists: false } }, { addresses: { $size: 0 } } ] });

    for (const user of users) {
      if (user.address && Object.keys(user.address).length > 0) {
        user.addresses = [
          {
            label: "Home",
            fullName: user.name || "",
            phone: user.phone || "",
            landmark: "",
            street: user.address.street || "",
            city: user.address.city || "",
            state: user.address.state || "",
            zipCode: user.address.zipCode || "",
            country: user.address.country || "",
            isDefault: true,
          },
        ];
        await user.save();
        console.log(`Migrated address for user ${user._id}`);
      }
    }
  } catch (err) {
    console.error('Address migration failed:', err.message);
  }
}

// Run when executed directly
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    // connect DB lazily to avoid circular imports
    try {
      const connectDB = (await import("../config/db.js")).default;
      await connectDB();
      await migrateAddresses();
      console.log("Address migration complete");
      process.exit(0);
    } catch (err) {
      console.error("Address migration failed:", err);
      process.exit(1);
    }
  })();
}

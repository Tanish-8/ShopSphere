import User from "../models/User.js";

// Idempotent migration: copy legacy `address` into `addresses[0]` when addresses empty
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

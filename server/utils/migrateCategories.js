import Product from "../models/Product.js";

const migrateCategories = async () => {
  try {
    console.log("🔄 Auditing and migrating product categories...");
    const mapping = {
      "Beauty": "Beauty & Health",
      "Health": "Beauty & Health",
      "Sports": "Sports & Fitness",
      "Books": "Books & Stationery",
      "Groceries": "Groceries & Gourmet",
      "Kitchen": "Kitchen & Dining"
    };

    let totalUpdated = 0;
    for (const [oldCat, newCat] of Object.entries(mapping)) {
      // Direct updateMany bypasses schema validator for migration
      const result = await Product.updateMany(
        { category: oldCat },
        { $set: { category: newCat } }
      );
      if (result.modifiedCount > 0) {
        console.log(`   Mapped legacy category "${oldCat}" to "${newCat}" for ${result.modifiedCount} products.`);
        totalUpdated += result.modifiedCount;
      }
    }
    console.log(`✅ Product category migration finished. Total products updated: ${totalUpdated}`);
  } catch (error) {
    console.error("💥 Failed to migrate product categories:", error.message);
  }
};

export default migrateCategories;

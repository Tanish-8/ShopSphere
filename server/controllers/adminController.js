import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { PAYMENT_STATUS } from "../utils/constants.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core KPIs
    const revenueAgg = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const pendingOrders = await Order.countDocuments({
      orderStatus: { $in: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"] }
    });
    const deliveredOrders = await Order.countDocuments({ orderStatus: "DELIVERED" });
    const cancelledOrders = await Order.countDocuments({ orderStatus: "CANCELLED" });

    const lowStockProducts = await Product.countDocuments({ stock: { $gt: 0, $lte: 5 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // 2. Monthly Revenue and Orders
    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: { $cond: [{ $eq: ["$isPaid", true] }, "$totalPrice", 0] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Sales by Category
    const salesByCategory = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$productInfo.category", "Uncategorized"] },
          value: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } }
        }
      }
    ]);

    // 4. Top Selling Products
    const topProducts = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.name",
          qty: { $sum: "$orderItems.qty" },
          revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } }
        }
      },
      { $sort: { qty: -1 } },
      { $limit: 5 }
    ]);

    // 5. Top Brands
    const topBrands = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$productInfo.brand", "Unbranded"] },
          qty: { $sum: "$orderItems.qty" }
        }
      },
      { $sort: { qty: -1 } },
      { $limit: 5 }
    ]);

    // 6. Top Customers
    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          spend: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$userInfo.name", "Guest User"] },
          email: { $ifNull: ["$userInfo.email", "N/A"] },
          spend: 1,
          orders: 1
        }
      },
      { $sort: { spend: -1 } },
      { $limit: 5 }
    ]);

    // 7. Payment Methods distribution
    const paymentMethods = await Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 }
        }
      }
    ]);

    // 8. Order Status Distribution
    const orderStatuses = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        lowStockProducts,
        outOfStockProducts,
        monthlyStats,
        salesByCategory,
        topProducts,
        topBrands,
        topCustomers,
        paymentMethods,
        orderStatuses
      },
    });
  } catch (error) {
    next(error);
  }
};

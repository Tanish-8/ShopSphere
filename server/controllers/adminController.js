import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    // Total revenue: sum of totalPrice where isPaid true
    const revenueAgg = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });
    const failedPayments = await Order.countDocuments({ paymentStatus: 'failed' });
    const pendingPayments = await Order.countDocuments({ paymentStatus: 'pending' });
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();

    // Reviews metrics across all products
    const reviewsAgg = await Product.aggregate([
      { $match: { numReviews: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: "$numReviews" },
          ratingSum: { $sum: { $multiply: ["$rating", "$numReviews"] } },
        },
      },
    ]);

    const totalReviews = reviewsAgg[0]?.totalReviews || 0;
    const averageRating = totalReviews > 0 ? (reviewsAgg[0].ratingSum / totalReviews) : 0;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        paidOrders,
        failedPayments,
        pendingPayments,
        totalProducts,
        totalUsers,
        totalReviews,
        averageRating,
      },
    });
  } catch (error) {
    next(error);
  }
};

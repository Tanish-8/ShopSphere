import Order from "../models/Order.js";

const migrateOrders = async () => {
  try {
    const orders = await Order.find({});
    let updatedCount = 0;

    const statusMap = {
      pending: "PLACED",
      placed: "PLACED",
      ordered: "PLACED",
      confirmed: "CONFIRMED",
      "payment confirmed": "CONFIRMED",
      processing: "PACKED",
      packed: "PACKED",
      shipped: "SHIPPED",
      out_for_delivery: "OUT_FOR_DELIVERY",
      "out for delivery": "OUT_FOR_DELIVERY",
      delivered: "DELIVERED",
      completed: "DELIVERED",
      cancelled: "CANCELLED",
      returned: "RETURNED",
      "return requested": "RETURNED",
      "return approved": "RETURNED",
      "pickup scheduled": "RETURNED",
      "picked up": "RETURNED",
      refunded: "REFUNDED",
      "refund processing": "REFUNDED"
    };

    const paymentStatusMap = {
      pending: "PENDING",
      paid: "PAID",
      failed: "FAILED",
      "refund processing": "REFUND_PENDING",
      "refund pending": "REFUND_PENDING",
      refunded: "REFUNDED"
    };

    for (const order of orders) {
      let isModified = false;

      // 1. Map order status
      const oldStatus = (order.status || "Placed").toLowerCase();
      const mappedStatus = statusMap[oldStatus] || "PLACED";
      if (order.status !== mappedStatus) {
        order.status = mappedStatus;
        isModified = true;
      }

      // 2. Map payment status
      const oldPaymentStatus = (order.paymentStatus || "Pending").toLowerCase();
      const mappedPaymentStatus = paymentStatusMap[oldPaymentStatus] || "PENDING";
      if (order.paymentStatus !== mappedPaymentStatus) {
        order.paymentStatus = mappedPaymentStatus;
        isModified = true;
      }

      // 3. Map statusHistory
      if (Array.isArray(order.statusHistory)) {
        order.statusHistory.forEach((h) => {
          if (h.status) {
            const lowerHStatus = h.status.toLowerCase();
            const mappedHStatus = statusMap[lowerHStatus] || paymentStatusMap[lowerHStatus] || h.status.toUpperCase();
            if (h.status !== mappedHStatus) {
              h.status = mappedHStatus;
              isModified = true;
            }
          }
        });
      }

      // 4. Map orderTimeline
      if (Array.isArray(order.orderTimeline)) {
        order.orderTimeline.forEach((t) => {
          if (t.status) {
            const lowerTStatus = t.status.toLowerCase();
            const mappedTStatus = statusMap[lowerTStatus] || paymentStatusMap[lowerTStatus] || t.status.toUpperCase();
            if (t.status !== mappedTStatus) {
              t.status = mappedTStatus;
              isModified = true;
            }
          }
        });
      }

      if (isModified) {
        await order.save();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`[Migration] Safely migrated ${updatedCount} orders to new uppercase statuses.`);
    }
  } catch (error) {
    console.error("[Migration] Error migrating orders status database fields:", error.message);
  }
};

export default migrateOrders;

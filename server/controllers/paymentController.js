import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razor;
if (keyId && keySecret) {
  razor = new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Create a Razorpay order
export const createRazorpayOrder = async (req, res, next) => {
  try {
    if (!razor) {
      res.status(500);
      throw new Error("Razorpay not configured on server");
    }

    const { amount, orderId } = req.body;
    if (!amount) {
      res.status(400);
      throw new Error("Amount is required");
    }

    // Amount expected in rupees, convert to paise
    const amountPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `shopsphere_rcpt_${orderId || Date.now()}`,
      payment_capture: 1,
    };

    const order = await razor.orders.create(options);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify payment signature and mark ShopSphere order as paid
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      res.status(400);
      throw new Error("Missing required verification fields");
    }

    if (!keySecret) {
      res.status(500);
      throw new Error("Razorpay secret not configured on server");
    }

    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      res.status(400);
      throw new Error("Invalid signature");
    }

    // Mark ShopSphere order as paid
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      paymentId: razorpay_payment_id,
      paymentMethod: "razorpay",
      paymentDate: new Date(),
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
    };

    await order.save();

    res.json({ success: true, message: "Payment verified and order updated", data: order });
  } catch (error) {
    next(error);
  }
};

export default {
  createRazorpayOrder,
  verifyRazorpayPayment,
};

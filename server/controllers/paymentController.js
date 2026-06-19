import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import PaymentLog from "../models/PaymentLog.js";

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
        receipt: order.receipt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Handle Razorpay webhooks (raw body expected)
export const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const raw = req.body; // express.raw provides Buffer

    if (!webhookSecret) {
      return res.status(500).send('Webhook secret not configured');
    }

    const expected = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');
    if (signature !== expected) {
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(raw.toString());
    const event = payload.event;

    // Extract payment entity
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    // Determine razorpay order id and payment id
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    // Look up razorpay order to find receipt containing shopsphere id
    let shopOrderId = null;
    if (razorpayOrderId && razor) {
      try {
        const rpOrder = await razor.orders.fetch(razorpayOrderId);
        if (rpOrder && rpOrder.receipt && rpOrder.receipt.startsWith('shopsphere_rcpt_')) {
          shopOrderId = rpOrder.receipt.replace('shopsphere_rcpt_', '');
        }
      } catch (e) {
        // ignore
      }
    }

    // Log event and prevent duplicates
    const exists = await PaymentLog.findOne({ paymentId: paymentId, event });
    if (exists) {
      return res.status(200).send('Already processed');
    }

    await PaymentLog.create({ orderId: shopOrderId || null, paymentId: paymentId, event, payload });

    if (shopOrderId) {
      const order = await Order.findById(shopOrderId);
      if (order) {
        if (event === 'payment.captured' || event === 'order.paid') {
          if (order.paymentResult?.paymentId === paymentId) {
            return res.status(200).send('Already processed');
          }
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentStatus = 'paid';
          order.paymentResult = {
            paymentId: paymentId,
            paymentMethod: 'razorpay',
            paymentDate: new Date(),
            razorpayOrderId,
            razorpaySignature: signature,
          };
          await order.save();
        } else if (event === 'payment.failed') {
          order.paymentStatus = 'failed';
          order.paymentResult = {
            paymentId: paymentId,
            paymentMethod: 'razorpay',
            paymentDate: new Date(),
            razorpayOrderId,
            razorpaySignature: signature,
            failureReason: paymentEntity?.error_description || payload.payload?.payment?.entity?.error_code || 'failed',
          };
          await order.save();
        }
      }
    }

    res.status(200).send('ok');
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

    // Prevent duplicate processing
    if (order.paymentResult?.paymentId === razorpay_payment_id) {
      return res.json({ success: true, message: "Payment already processed" });
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
    order.paymentStatus = 'paid';

    await order.save();

    // Log payment
    await PaymentLog.create({ orderId: order._id, paymentId: razorpay_payment_id, event: 'payment.verified', payload: req.body });

    res.json({ success: true, message: "Payment verified and order updated", data: order });
  } catch (error) {
    next(error);
  }
};

export default {
  createRazorpayOrder,
  verifyRazorpayPayment,
};

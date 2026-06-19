import mongoose from "mongoose";

const paymentLogSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    paymentId: { type: String },
    event: { type: String },
    payload: { type: Object },
  },
  { timestamps: true }
);

const PaymentLog = mongoose.model("PaymentLog", paymentLogSchema);
export default PaymentLog;

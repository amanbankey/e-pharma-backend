import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.Mixed },
      name: { type: String },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  address: { type: String, required: true },
  paymentMethod: {
    type: String,
    enum: ["razorpay", "cod"],
    default: "razorpay",
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  deliveryStatus: {
    type: String,
    enum: ["processing", "shipped", "delivered"],
    default: "processing",
  },
  expectedDeliveryDate: { type: Date },
}, { timestamps: true });

const Order = mongoose.model("Order", OrderSchema);
export default Order;

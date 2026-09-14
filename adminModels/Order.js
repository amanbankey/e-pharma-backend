import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: { type: String },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],

  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  address: { type: String, required: true },

  paymentMethod: { type: String, enum: ["razorpay", "cod"], default: "razorpay" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },

  orderStatus: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "returned",
      "refunded",
    ],
    default: "pending",
  },

  orderDate: { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true });

const Order = mongoose.model("UserOrder", OrderSchema);
export default Order;

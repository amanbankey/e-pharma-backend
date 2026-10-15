import Order from "../adminModels/Order.js";
import Product from "../adminModels/Product.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendMail.js";
import { razor } from "../config/razorpay.js";
import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Builds the order items from the database. The price and name always come from the Product
// collection, never from the browser, so a customer cannot change what they pay.
const buildOrderItems = async (items, clientAmount) => {
  const ids = items.map((i) => i.product);
  if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    return { error: "One or more products in your order are invalid. Please refresh the page and try again." };
  }

  const products = await Product.find({ _id: { $in: ids }, isActive: { $ne: false } });

  const orderItems = [];
  for (const i of items) {
    const product = products.find((p) => p._id.toString() === String(i.product));
    if (!product) {
      return { error: `${i.name || "A product"} is no longer available. Please remove it from your cart and try again.` };
    }

    const qty = Number(i.qty);
    if (!Number.isInteger(qty) || qty < 1) {
      return { error: `Invalid quantity for ${product.name}. Please enter a quantity of 1 or more.` };
    }

    orderItems.push({ product: product._id, name: product.name, qty, price: product.price });
  }

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  // The cart may hold an old price (e.g. the price changed after it was added) - never charge a surprise amount
  if (Math.round(totalAmount * 100) !== Math.round(Number(clientAmount) * 100)) {
    return {
      error: `The price of an item in your order has changed (current total ₹${totalAmount}). Please remove the item from your cart, add it again and retry.`,
    };
  }

  return { orderItems, totalAmount };
};

export const createOrder = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.user.id;

    if (!items || !items.length || !amount || !address) {
      return res.status(400).json({ success: false, message: "Please input valid details!" });
    }

    const { orderItems, totalAmount, error } = await buildOrderItems(items, amount);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const rzpOrder = await razor.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `order_${userId}_${Date.now()}`,
      notes: { userId },
    });

    await Order.create({
      orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
      user: userId,
      items: orderItems,
      subtotal: totalAmount,
      totalAmount,
      address,
      paymentMethod: "razorpay",
      razorpayOrderId: rzpOrder.id,
      paymentStatus: "pending",
    });

    res.status(200).json({
      success: true,
      message: "Order created",
      order: rzpOrder,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err?.error?.message || err?.message || err);
    res.status(500).json({
      success: false,
      message: err?.error?.description || err?.message || "Unable to create Razorpay order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = req.user.id;

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, user: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature",
      });
    }

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    order.orderStatus = "confirmed";
    order.expectedDeliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await order.save();

    const user = await User.findById(userId);
    if (user?.email) {
      await sendEmail(
        user.email,
        "Vernal Rx — Order Confirmed!",
        `Thanks ${user.fullName}, your order of ₹${order.totalAmount} has been confirmed and is being processed. Expected delivery: ${order.expectedDeliveryDate.toDateString()}.`
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment complete!",
      order,
    });
  } catch (err) {
    console.error("Razorpay payment verification failed:", err);
    res.status(500).json({ success: false, message: "Unable to verify payment" });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ message: "Razorpay webhook secret is not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const digest = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    if (signature !== digest) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const payload = JSON.parse(req.body.toString("utf8"));
    const event = payload.event;

    if (event === "payment.captured") {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      await Order.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { paymentStatus: "paid", razorpayPaymentId: payment.id }
      );
    }

    res.json({ status: "ok", ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
};

export const createCodOrder = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.user.id;

    if (!items || !items.length || !amount || !address) {
      return res.status(400).json({ success: false, message: "Please input valid details!" });
    }

    const { orderItems, totalAmount, error } = await buildOrderItems(items, amount);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const order = await Order.create({
      orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
      user: userId,
      items: orderItems,
      subtotal: totalAmount,
      totalAmount,
      address,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "confirmed",
      expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    const user = await User.findById(userId);
    if (user?.email) {
      try {
        await sendEmail(
          user.email,
          "Vernal Rx — Cash on Delivery Order Confirmed!",
          `Thanks ${user.fullName}, your Cash on Delivery order of ₹${totalAmount} has been placed successfully and is being processed. Expected delivery: ${order.expectedDeliveryDate.toDateString()}. Please pay cash on delivery.`
        );
      } catch (mailErr) {
        console.warn("Could not send confirmation email:", mailErr?.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Order placed successfully with Cash on Delivery",
      order,
    });
  } catch (err) {
    console.error("COD order creation failed:", err?.message || err);
    res.status(500).json({
      success: false,
      message: err?.message || "Unable to place Cash on Delivery order",
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }],
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["processing", "shipped", "delivered"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Delivery status updated", order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

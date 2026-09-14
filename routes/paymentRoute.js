import express from "express";
import {
  createOrder,
  createCodOrder,
  verifyPayment,
  razorpayWebhook,
  getMyOrders,
  updateDeliveryStatus,
} from "../controllers/paymentController.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create-order", auth, createOrder);
router.post("/create-cod-order", auth, createCodOrder);
router.post("/verify-payment", auth, verifyPayment);
router.post("/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
router.get("/my-orders", auth, getMyOrders);
router.put("/:id/status", auth, isAdmin, updateDeliveryStatus);

export default router;

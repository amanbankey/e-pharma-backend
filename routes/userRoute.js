import express from "express";
import {
  login,
  signup,
  sendOTP,
  resetPasswordToken,
  resetPassword,
  changePassword, phoneSignup, sendMobileOTP, phoneLogin
} from "../controllers/authController.js";
import {
  updateProfile,
  deleteAccount,
  getAllUserDetails,
  getUserById,
 
} from "../controllers/profileController.js";
import { auth } from "../middlewares/auth.js";
import { submitContactForm } from "../controllers/contactController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Limit contact form spam: 5 messages per IP per 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent. Please wait a few minutes before trying again.",
  },
});

router.post("/contact", contactLimiter, submitContactForm);
router.post("/signup", signup);
router.post("/login", login);
router.post("/send-otp", sendOTP);

router.post("/mobile-signup", phoneSignup )
router.post("/mobile-login", phoneLogin);
router.post("/mobile-send-otp", sendMobileOTP);

router.post("/reset-password-token", resetPasswordToken);
router.post("/reset-password", resetPassword);
router.post("/change-password", auth, changePassword);

router.get("/me", auth, getAllUserDetails);
router.put("/me", auth, updateProfile);
router.delete("/me", auth, deleteAccount);
router.get("/user/:id", auth, getUserById);

export default router;

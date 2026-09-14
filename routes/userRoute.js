import express from "express";
import {
  login,
  signup,
  sendOTP,
  resetPasswordToken,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";
import {
  updateProfile,
  deleteAccount,
  getAllUserDetails,
  getUserById,
} from "../controllers/profileController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/send-otp", sendOTP);

router.post("/reset-password-token", resetPasswordToken);
router.post("/reset-password", resetPassword);
router.post("/change-password", auth, changePassword);

router.get("/me", auth, getAllUserDetails);
router.put("/me", auth, updateProfile);
router.delete("/me", auth, deleteAccount);
router.get("/user/:id", auth, getUserById);

export default router;

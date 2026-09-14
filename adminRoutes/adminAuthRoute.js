import express from "express";
import {
  setupSuperAdmin,
  adminLogin,
  getAdminProfile,
  superAdminResetPasswordToken,
  superAdminResetPassword,
  superAdminChangePassword,
} from "../adminController/adminAuthController.js";
import { adminAuth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/setup-super-admin", setupSuperAdmin);
router.post("/login", adminLogin);
router.get("/me", adminAuth, getAdminProfile);

router.post("/reset-password-token", superAdminResetPasswordToken);
router.post("/reset-password", superAdminResetPassword);
router.post("/change-password", adminAuth, superAdminChangePassword);

export default router;

import Admin from "../adminModels/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import sendEmail from "../utils/sendMail.js";

dotenv.config();

export const setupSuperAdmin = async (req, res) => {
  try {
    const { fullName, email, password, setupKey } = req.body;

    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ success: false, message: "Invalid setup key" });
    }

    const existingSuperAdmin = await Admin.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      return res.status(400).json({ success: false, message: "Super admin already exists" });
    }

    if (!fullName || !email || !password) {
      return res.status(404).json({ success: false, message: "Please input valid details!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const superAdmin = await Admin.create({
      fullName,
      email,
      password: hashedPassword,
      role: "superadmin",
      permissions: ["products", "inventory", "orders", "reports", "users", "admins"],
    });

    return res.status(200).json({
      success: true,
      message: "Super admin created successfully",
      admin: { id: superAdmin._id, email: superAdmin.email, role: superAdmin.role },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password, loginAs } = req.body;

    if (!email || !password || !loginAs) {
      return res.status(404).json({ success: false, message: "Please input valid details!" });
    }

    const admin = await Admin.findOne({ email });

    if (!admin || !admin.isActive) {
      return res.status(400).json({ success: false, message: "Admin is not registered or is inactive" });
    }

    if (admin.role !== loginAs) {
      return res.status(400).json({
        success: false,
        message: `This account is a ${admin.role}. Please switch to the ${admin.role} tab.`,
      });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "Password is incorrect" });
    }

    const payload = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      type: "admin",
    };

    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: "8h" });

    admin.lastLoginAt = new Date();
    await admin.save();

    const options = {
      expires: new Date(Date.now() + 8 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res.cookie("adminToken", token, options).status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ success: false, message: "Login failure, please try again" });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    res.status(200).json({ success: true, admin });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const superAdminResetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address",
      });
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: `This email: ${email} is not registered`,
      });
    }

    if (admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Password reset via email is only available for Super Admin accounts. Normal admins should contact Super Admin.",
      });
    }

    const token = crypto.randomUUID();

    await Admin.findOneAndUpdate(
      { email: admin.email },
      {
        token,
        resetPasswordExpires: Date.now() + 60 * 60 * 1000,
      },
      { new: true }
    );

    const adminFrontendUrl = process.env.ADMIN_FRONTEND_URL || "http://localhost:5175";
    const url = `${adminFrontendUrl}/update-password?token=${token}`;

    await sendEmail(
      admin.email,
      "Super Admin Password Reset Link - Vernal Rx",
      `<p>Hi ${admin.fullName},</p>
       <p>A password reset was requested for your Vernal Rx Super Admin account.</p>
       <p>Please click the link below to reset your password (valid for 1 hour):</p>
       <p><a href="${url}" style="display:inline-block;padding:10px 20px;background:#0d47a1;color:#ffffff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
       <p>Or open this URL: <br/>${url}</p>
       <p>If you did not request this, please ignore this email.</p>`
    );

    return res.status(200).json({
      success: true,
      message: "Reset link sent successfully, please check your email",
    });
  } catch (err) {
    console.error("Super admin reset password token error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset email",
      error: err.message,
    });
  }
};

export const superAdminResetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please input valid details!",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const admin = await Admin.findOne({ token });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid",
      });
    }

    if (admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized password reset attempt",
      });
    }

    if (admin.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Your reset token has expired, please request a new link",
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    await Admin.findOneAndUpdate(
      { token },
      {
        password: hashedPassword,
        token: undefined,
        resetPasswordExpires: undefined,
      },
      { new: true }
    );

    try {
      await sendEmail(
        admin.email,
        "Super Admin Password Reset Successful - Vernal Rx",
        `<p>Hi ${admin.fullName},</p><p>Your Super Admin password has been reset successfully. You can now log in with your new password.</p>`
      );
    } catch (mailErr) {
      console.warn("Could not send confirmation email:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("Super admin reset password error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to reset password",
    });
  }
};

export const superAdminChangePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter both current password and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    try {
      await sendEmail(
        admin.email,
        "Password Updated - Vernal Rx Admin",
        `<p>Hi ${admin.fullName},</p><p>Your password has been updated successfully.</p>`
      );
    } catch (mailErr) {
      console.warn("Could not send change password notification:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update password",
    });
  }
};


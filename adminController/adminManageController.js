import Admin from "../adminModels/Admin.js";
import bcrypt from "bcrypt";
import sendEmail from "../utils/sendMail.js";

const ALL_SECTIONS = ["products", "inventory", "orders", "reports", "users", "admins"];

export const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, permissions = [] } = req.body;

    if (!fullName || !email || !password) {
      return res.status(404).json({ success: false, message: "Please input valid details!" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(404).json({ success: false, message: "Email already exists!" });
    }

    const validPermissions = permissions.filter((p) => ALL_SECTIONS.includes(p));
    const hashedPassword = bcrypt.hashSync(password, 10);

    const admin = await Admin.create({
      fullName,
      email,
      password: hashedPassword,
      role: "admin",
      permissions: validPermissions,
      createdBy: req.admin.id,
    });

    try {
      await sendEmail(
        email,
        "You have been added as an admin — Vernal Rx",
        `Hi ${fullName}, an admin account has been created for you. Login email: ${email}. Please use the password shared with you separately to sign in.`
      );
    } catch {}

    res.status(200).json({
      success: true,
      message: "Admin created successfully",
      admin: { id: admin._id, fullName: admin.fullName, email: admin.email, permissions: admin.permissions },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: "admin" }).select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, admins });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAdminPermissions = async (req, res) => {
  try {
    const { permissions = [], isActive } = req.body;
    const validPermissions = permissions.filter((p) => ALL_SECTIONS.includes(p));

    const update = { permissions: validPermissions };
    if (typeof isActive === "boolean") update.isActive = isActive;

    const admin = await Admin.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      update,
      { new: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success: true, message: "Admin updated", admin });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOneAndDelete({ _id: req.params.id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    res.status(200).json({ success: true, message: "Admin removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

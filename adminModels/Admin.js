import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "admin"], default: "admin" },
  permissions: [
    {
      type: String,
      enum: ["products", "inventory", "orders", "reports", "users", "admins"],
    },
  ],
  isActive: { type: Boolean, default: true },
  token: { type: String },
  resetPasswordExpires: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  lastLoginAt: { type: Date },
}, { timestamps: true });

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  token: { type: String },
  resetPasswordExpires: { type: Date },
  additionalDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
  profileImage: {
    type: String,
    default: "",
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  address: { type: String, default: "" },
}, { timestamps: true });

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;

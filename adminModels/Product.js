import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  composition: { type: String, default: "" },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  unit: { type: String, default: "" },
  images: [{ type: String }],
  manufacturer: { type: String, default: "" },
  prescriptionRequired: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  totalStock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 20 },
  expiryDate: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

ProductSchema.virtual("availableStock").get(function () {
  return Math.max(this.totalStock - this.reservedStock, 0);
});
ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", ProductSchema);
export default Product;

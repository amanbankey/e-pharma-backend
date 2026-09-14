import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
} from "../controllers/productController.js";
import { adminAuth, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);

router.post("/upload-image", adminAuth, requirePermission("products"), uploadProductImage);
router.delete("/delete-image", adminAuth, requirePermission("products"), deleteProductImage);

router.post("/", adminAuth, requirePermission("products"), createProduct);
router.put("/:id", adminAuth, requirePermission("products"), updateProduct);
router.delete("/:id", adminAuth, requirePermission("products"), deleteProduct);

export default router;


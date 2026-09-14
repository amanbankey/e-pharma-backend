import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderDeliveryDate,
} from "../adminController/adminController.js";
import {
  createAdmin,
  getAllAdmins,
  updateAdminPermissions,
  deleteAdmin,
} from "../adminController/adminManageController.js";
import {
  getInventorySummary,
  getInventoryList,
  updateStock,
} from "../adminController/inventoryController.js";
import {
  getSalesReport,
  getTopProducts,
  getOrderStatusBreakdown,
} from "../adminController/reportController.js";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../adminController/adminCategoryController.js";
import { adminAuth, isSuperAdmin, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

router.use(adminAuth);

router.get("/dashboard", requirePermission("orders"), getDashboardStats);

router.get("/users", requirePermission("users"), getAllUsers);
router.delete("/users/:id", requirePermission("users"), deleteUser);

router.get("/orders", requirePermission("orders"), getAllOrders);
router.get("/orders/:id", requirePermission("orders"), getOrderById);
router.put("/orders/:id/status", requirePermission("orders"), updateOrderStatus);
router.put("/orders/:id/delivery-date", requirePermission("orders"), updateOrderDeliveryDate);

router.get("/inventory/summary", requirePermission("inventory"), getInventorySummary);
router.get("/inventory", requirePermission("inventory"), getInventoryList);
router.put("/inventory/:id/stock", requirePermission("inventory"), updateStock);

router.get("/reports/sales", requirePermission("reports"), getSalesReport);
router.get("/reports/top-products", requirePermission("reports"), getTopProducts);
router.get("/reports/order-status", requirePermission("reports"), getOrderStatusBreakdown);

router.post("/admins", isSuperAdmin, createAdmin);
router.get("/admins", isSuperAdmin, getAllAdmins);
router.put("/admins/:id", isSuperAdmin, updateAdminPermissions);
router.delete("/admins/:id", isSuperAdmin, deleteAdmin);

// Category routes (protected by products permission)
router.get("/categories", getAllCategories);
router.post("/categories", requirePermission("products"), createCategory);
router.put("/categories/:id", requirePermission("products"), updateCategory);
router.delete("/categories/:id", requirePermission("products"), deleteCategory);

export default router;

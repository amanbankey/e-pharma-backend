import User from "../models/User.js";
import Product from "../adminModels/Product.js";
import Order from "../adminModels/Order.js";

export const getDashboardStats = async (req, res) => {
  try {
    const validOrderMatch = {
      $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }],
    };

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueAgg,
      statusCounts,
      recentOrders,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(validOrderMatch),
      Order.aggregate([
        { $match: validOrderMatch },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: validOrderMatch },
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),
      Order.find(validOrderMatch)
        .populate("user", "fullName email phone city state address")
        .sort({ createdAt: -1 })
        .limit(8),
      Order.distinct("user", {
        ...validOrderMatch,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const statusBreakdown = {};
    statusCounts.forEach((s) => {
      statusBreakdown[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
        activeUsers: activeUsers.length,
        statusBreakdown,
      },
      recentOrders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await Order.deleteMany({ user: req.params.id });

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {
      $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }],
    };
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate("user", "fullName email phone city state address")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "fullName email phone city state address"
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending", "confirmed", "processing", "packed", "shipped",
      "out_for_delivery", "delivered", "cancelled", "returned", "refunded",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const update = { orderStatus: status };
    if (status === "delivered") update.deliveredAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderDeliveryDate = async (req, res) => {
  try {
    const { expectedDeliveryDate } = req.body;

    if (!expectedDeliveryDate) {
      return res.status(400).json({ success: false, message: "Expected delivery date is required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { expectedDeliveryDate: new Date(expectedDeliveryDate) },
      { new: true }
    ).populate("user", "fullName email phone city state address");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Delivery date updated", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

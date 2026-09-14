import Order from "../adminModels/Order.js";

const dateFormats = {
  daily: "%Y-%m-%d",
  weekly: "%Y-W%V",
  monthly: "%Y-%m",
  yearly: "%Y",
};

const rangeStart = (period) => {
  const now = new Date();
  if (period === "daily") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (period === "weekly") return new Date(now.getTime() - 26 * 7 * 24 * 60 * 60 * 1000);
  if (period === "monthly") return new Date(now.getFullYear() - 1, now.getMonth(), 1);
  return new Date(now.getFullYear() - 5, 0, 1);
};

export const getSalesReport = async (req, res) => {
  try {
    const period = ["daily", "weekly", "monthly", "yearly"].includes(req.query.period)
      ? req.query.period
      : "monthly";

    const orderMatch = {
      $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }],
    };

    const data = await Order.aggregate([
      {
        $match: {
          ...orderMatch,
          orderDate: { $gte: rangeStart(period) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormats[period], date: "$orderDate" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      period,
      data: data.map((d) => ({ label: d._id, revenue: d.revenue, orders: d.orders })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }] } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          unitsSold: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({ success: true, products: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderStatusBreakdown = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }] } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    const breakdown = {};
    data.forEach((d) => {
      breakdown[d._id] = d.count;
    });

    res.status(200).json({ success: true, breakdown });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

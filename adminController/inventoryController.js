import Product from "../adminModels/Product.js";

export const getInventorySummary = async (req, res) => {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const products = await Product.find({ isActive: true });

    let totalStock = 0;
    let reservedStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let expired = 0;
    let expiringSoon = 0;

    products.forEach((p) => {
      const available = Math.max(p.totalStock - p.reservedStock, 0);
      totalStock += p.totalStock;
      reservedStock += p.reservedStock;

      if (available === 0) outOfStock += 1;
      else if (available <= p.lowStockThreshold) lowStock += 1;

      if (p.expiryDate) {
        if (p.expiryDate < now) expired += 1;
        else if (p.expiryDate <= soon) expiringSoon += 1;
      }
    });

    res.status(200).json({
      success: true,
      summary: {
        totalStock,
        availableStock: totalStock - reservedStock,
        reservedStock,
        lowStock,
        outOfStock,
        expired,
        expiringSoon,
        totalProducts: products.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getInventoryList = async (req, res) => {
  try {
    const { filter } = req.query;
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let products = await Product.find({ isActive: true }).sort({ name: 1 });

    if (filter === "low") {
      products = products.filter((p) => {
        const available = p.totalStock - p.reservedStock;
        return available > 0 && available <= p.lowStockThreshold;
      });
    } else if (filter === "out") {
      products = products.filter((p) => p.totalStock - p.reservedStock <= 0);
    } else if (filter === "expired") {
      products = products.filter((p) => p.expiryDate && p.expiryDate < now);
    } else if (filter === "expiring") {
      products = products.filter((p) => p.expiryDate && p.expiryDate >= now && p.expiryDate <= soon);
    }

    res.status(200).json({ success: true, products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { totalStock, reservedStock, lowStockThreshold, expiryDate } = req.body;

    const update = {};
    if (totalStock !== undefined) update.totalStock = totalStock;
    if (reservedStock !== undefined) update.reservedStock = reservedStock;
    if (lowStockThreshold !== undefined) update.lowStockThreshold = lowStockThreshold;
    if (expiryDate !== undefined) update.expiryDate = expiryDate;

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Stock updated", product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

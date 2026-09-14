import Product from "../adminModels/Product.js";
import {
  uploadImageToCloudinary,
  extractPublicId,
  deleteImageFromCloudinary,
} from "../utils/imageUploader.js";

export const getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      composition,
      category,
      price,
      mrp,
      unit,
      images,
      stock,
      totalStock,
      lowStockThreshold,
      expiryDate,
      prescriptionRequired,
      manufacturer,
    } = req.body;

    if (!name || !category || !price || !mrp) {
      return res.status(404).json({
        message: "Please input valid details!",
        success: false,
      });
    }

    const product = await Product.create({
      name,
      description,
      composition,
      category,
      price,
      mrp,
      unit,
      images: Array.isArray(images) ? images : [],
      totalStock: totalStock !== undefined ? Number(totalStock) : (stock !== undefined ? Number(stock) : 0),
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 20,
      expiryDate: expiryDate || null,
      prescriptionRequired: Boolean(prescriptionRequired),
      manufacturer: manufacturer || "",
    });

    res.status(200).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadProductImage = async (req, res) => {
  try {
    const file = req.files?.image || req.files?.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const uploaded = await uploadImageToCloudinary(file, "epharma-products");
    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    });
  } catch (error) {
    console.error("Product image upload error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to upload image" });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { imageUrl, publicId: directPublicId } = req.body;
    const publicId = directPublicId || extractPublicId(imageUrl);

    if (!publicId) {
      return res.status(400).json({ success: false, message: "Valid imageUrl or publicId is required" });
    }

    await deleteImageFromCloudinary(publicId);
    return res.status(200).json({
      success: true,
      message: "Image deleted from Cloudinary successfully",
    });
  } catch (error) {
    console.error("Product image delete error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete image" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Clean up images from Cloudinary if any
    if (Array.isArray(product.images) && product.images.length > 0) {
      for (const imgUrl of product.images) {
        const publicId = extractPublicId(imgUrl);
        if (publicId) {
          try {
            await deleteImageFromCloudinary(publicId);
          } catch (cloudErr) {
            console.warn("Failed to delete Cloudinary image:", publicId, cloudErr.message);
          }
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import jwt from "jsonwebtoken"
import dotenv from "dotenv";

dotenv.config();

export const auth = async (req, res, next) => {
  try {

    const token = req.cookies?.token ||  req.body?.token ||  req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    const decode = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Expired token",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route for admins only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified",
    });
  }
};


export const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.adminToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin token is missing",
      });
    }

    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    const decode = await jwt.verify(token, secret);

    if (decode.type !== "admin") {
      return res.status(401).json({ success: false, message: "Invalid admin token" });
    }

    req.admin = decode;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Expired or invalid admin token",
    });
  }
};

export const isSuperAdmin = async (req, res, next) => {
  if (req.admin?.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "This is a protected route for the super admin only",
    });
  }
  next();
};

export const requirePermission = (section) => (req, res, next) => {
  if (req.admin?.role === "superadmin") return next();
  if (req.admin?.permissions?.includes(section)) return next();
  return res.status(403).json({
    success: false,
    message: `You don't have access to ${section}`,
  });
};

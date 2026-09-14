import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import fileUpload from "express-fileupload";

import { connect } from "./config/database.js";
import { auth } from "./middlewares/auth.js";
import { cloudinaryConnect } from "./config/cloudinary.js";

import adminRoute from "./adminRoutes/adminRoute.js";
import adminAuthRoute from "./adminRoutes/adminAuthRoute.js";

import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import { razorpayWebhook } from "./controllers/paymentController.js";

dotenv.config();

const app = express();

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
    process.env.ADMIN_FRONTEND_URL,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
app.use(express.json());
app.use(cookieParser());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
    createParentPath: true,
  })
);

cloudinaryConnect();

import { getAllCategories } from "./adminController/adminCategoryController.js";

app.use("/api", userRoute);
app.use("/api/products", productRoute);
app.use("/api/payments", paymentRoute);
app.get("/api/categories", getAllCategories);
app.use("/api/admin/auth", adminAuthRoute);
app.use("/api/admin", adminRoute);


app.get("/", (req, res) => {
  res.send("Vernal Rx Backend is running!");
});

app.get("/protected-ping", auth, (req, res) => {
  res.send(`Welcome ${req.user.email}`);
});

const startServer = async () => {
  await connect();

  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running`);
  });
};

startServer();

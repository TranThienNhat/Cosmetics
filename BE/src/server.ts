import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import brandRoutes from "./routes/brandRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import userRoutes from "./routes/userRoutes";
import couponRoutes from "./routes/couponRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import blogRoutes from "./routes/blogRoutes";
import supplierRoutes from "./routes/supplierRoutes";
import purchaseRoutes from "./routes/purchaseRoutes";
import aiRoutes from "./routes/aiRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

import fs from "fs";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  credentials: true,
}));
app.use(express.json());

// Serve static files (uploaded images)
app.use("/uploads", express.static(uploadsDir));

// --- ROUTES ---
// 1. Auth (Đăng ký, Đăng nhập)
app.use("/api/auth", authRoutes);

// 2. Catalog (Sản phẩm, Danh mục, Thương hiệu)
app.use("/api/products", productRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);

// 3. Shopping (Giỏ hàng, Đặt hàng, Mã giảm giá)
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);

// 4. Social (Đánh giá)
app.use("/api/reviews", reviewRoutes);

// 5. Admin (Quản lý người dùng, Dashboard)
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

//6. Blog
app.use("/api/blogs", blogRoutes);

//7. Supplier
app.use("/api/suppliers", supplierRoutes);

//8. Purchase receipts
app.use("/api/purchase-receipts", purchaseRoutes);

//9. AI & ML Analytics
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

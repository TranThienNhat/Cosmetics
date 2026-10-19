import { Router } from "express";
import {
  createReview,
  getProductReviews,
  deleteReview,
  getAllReviews,
} from "../controllers/reviewController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

// --- DÀNH CHO KHÁCH HÀNG (FRONTEND) ---

// 1. Gửi đánh giá mới (Cần đăng nhập)
router.post("/", authenticate, createReview);

// 2. Lấy đánh giá theo ID sản phẩm (Dùng cho logic component)
router.get("/product/:productId", getProductReviews);

// --- DÀNH CHO QUẢN TRỊ VIÊN (ADMIN DASHBOARD) ---

// 3. Lấy tất cả đánh giá để quản lý (Chỉ Admin)
router.get("/admin/all", authenticate, authorize("admin"), getAllReviews);

// 4. Xóa đánh giá (Admin xóa hoặc User xóa đánh giá của chính mình)
router.delete("/:id", authenticate, deleteReview);

export default router;
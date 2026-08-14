import { Router } from "express";
import {
  createReview,
  getProductReviews,
  deleteReview,
  toggleApproveReview,
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

// 4. Lấy tất cả đánh giá để quản lý (Chỉ Admin)
router.get("/admin/all", authenticate, authorize("admin"), getAllReviews);

// 5. Duyệt hoặc ẩn đánh giá (Chỉ Admin)
router.put("/:id/approve", authenticate, authorize("admin"), toggleApproveReview);

// 6. Xóa đánh giá (Admin xóa hoặc User xóa đánh giá của chính mình)
router.delete("/:id", authenticate, deleteReview);

export default router;
import { Router } from "express";
import { BlogController } from "../controllers/blogController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import { uploadBlog } from "../middlewares/uploadMiddleware";
import { compressProductsImages } from "../middlewares/compressImage";

const router = Router();

// --- Public Routes ---

// Lấy danh sách bài viết (Có phân trang)
router.get("/", BlogController.index);
router.get("/:id", BlogController.show);

// --- Admin Routes (Protected) ---

// Tạo bài viết mới
// Sử dụng key 'cover_image' cho Multer để khớp với database
router.post(
  "/",
  authenticate,
  compressProductsImages, // Middleware nén ảnh nếu có  
  uploadBlog.single("cover_image"), 
  BlogController.create
);

// Cập nhật bài viết
router.put(
  "/:id",
  authenticate,
  compressProductsImages, // Middleware nén ảnh nếu có
  uploadBlog.single("cover_image"),
  BlogController.update
);

// Xóa bài viết
router.delete(
  "/:id", 
  authenticate,
  BlogController.remove
);

export default router;
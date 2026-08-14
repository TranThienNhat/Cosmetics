import { Router } from "express";
import { index, create, update, remove } from "../controllers/brandController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import { uploadBrand } from "../middlewares/uploadMiddleware";
import { compressProductsImages } from "../middlewares/compressImage";

const router = Router();

// Lấy danh sách: Ai cũng xem được (Public)
router.get("/", index);

// Tạo mới: Phải là Admin và xử lý 1 file ảnh với key là 'image'
router.post(
  "/", 
  authenticate, 
  requireAdmin, 
  compressProductsImages, // Middleware nén ảnh nếu có  
  uploadBrand.single("image"), // Multer phải đứng sau Auth
  create
);

// Cập nhật: Phải là Admin và xử lý 1 file ảnh nếu có (Optional)
router.put(
  "/:id", 
  authenticate, 
  requireAdmin, 
  compressProductsImages, // Middleware nén ảnh nếu có  
  uploadBrand.single("image"), 
  update
);

// Xóa: Phải là Admin
router.delete("/:id", authenticate, requireAdmin, remove);

export default router;
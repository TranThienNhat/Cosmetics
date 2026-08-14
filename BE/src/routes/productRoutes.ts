import { Router } from "express";
import {
  index,
  show,
  create,
  update,
  remove,
  allVariants,
  addVariant,
} from "../controllers/productController";
import { authenticate, checkRoleForProduct, requireAdmin } from "../middlewares/authMiddleware";
import { uploadProduct } from "../middlewares/uploadMiddleware";
import { compressProductsImages } from "../middlewares/compressImage";

const router = Router();

// --- Public Routes ---
router.get("/", checkRoleForProduct, index);  
router.get("/purchase/all-variants", allVariants);
router.get("/:id", checkRoleForProduct, show);
// --- Protected Routes (Chỉ dành cho Admin) ---

/**
 * TẠO MỚI SẢN PHẨM
 * - authenticate: Kiểm tra token
 * - requireAdmin: Kiểm tra quyền admin
 * - uploadProduct.array("images", 10): Nhận tối đa 10 file với key là "images"
 */
router.post(
  "/",
  authenticate,
  compressProductsImages,
  uploadProduct.array("images", 10),
  create,
);

/**
 * CẬP NHẬT SẢN PHẨM
 * Tương tự như tạo mới, cho phép gửi kèm ảnh mới để thay thế gallery cũ
 */
router.put(
  "/:id/variants",
  authenticate,
  
  uploadProduct.array("images", 10),
  addVariant,
);

router.put(
  "/:id",
  authenticate,
  compressProductsImages,
  uploadProduct.array("images", 10),
  update,
);

/**
 * XÓA SẢN PHẨM
 */
router.delete("/:id", authenticate,  remove);

export default router;

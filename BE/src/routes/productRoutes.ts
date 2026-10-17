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
import { authenticate, checkRoleForProduct, authorize } from "../middlewares/authMiddleware";
import { uploadProduct } from "../middlewares/uploadMiddleware";
import { compressProductsImages } from "../middlewares/compressImage";

const router = Router();

// --- Public Routes ---
router.get("/", checkRoleForProduct, index);  
router.get("/purchase/all-variants", allVariants);
router.get("/:id", checkRoleForProduct, show);

// --- Protected Routes (Dành cho Admin & Staff) ---

/**
 * TẠO MỚI SẢN PHẨM
 */
router.post(
  "/",
  authenticate,
  authorize("admin", "staff"),
  uploadProduct.array("images", 10),
  compressProductsImages,
  create,
);

/**
 * CẬP NHẬT BIẾN THỂ / SẢN PHẨM
 */
router.put(
  "/:id/variants",
  authenticate,
  authorize("admin", "staff"),
  uploadProduct.array("images", 10),
  compressProductsImages,
  addVariant,
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "staff"),
  uploadProduct.array("images", 10),
  compressProductsImages,
  update,
);

/**
 * XÓA SẢN PHẨM
 */
router.delete("/:id", authenticate, authorize("admin", "staff"), remove);

export default router;

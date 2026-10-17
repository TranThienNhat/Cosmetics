import { Router } from "express";
import { BlogController } from "../controllers/blogController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { uploadBlog } from "../middlewares/uploadMiddleware";
import { compressProductsImages } from "../middlewares/compressImage";

const router = Router();

// --- Public Routes ---
router.get("/", BlogController.index);
router.get("/:id", BlogController.show);

// --- Admin & Staff Routes (Protected) ---
router.post(
  "/",
  authenticate,
  authorize("admin", "staff"),
  uploadBlog.single("cover_image"), 
  compressProductsImages,
  BlogController.create
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "staff"),
  uploadBlog.single("cover_image"),
  compressProductsImages,
  BlogController.update
);

router.delete(
  "/:id", 
  authenticate,
  authorize("admin", "staff"),
  BlogController.remove
);

export default router;
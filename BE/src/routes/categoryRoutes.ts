import { Router } from "express";
import { index, create, update, remove } from "../controllers/categoryController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import { uploadCategory } from "../middlewares/uploadMiddleware";
import { compressProductsImages } from "../middlewares/compressImage";

const router = Router();

router.get("/", index);
router.post("/", authenticate,compressProductsImages,  uploadCategory.single("image"), create);
router.put("/:id", authenticate, compressProductsImages,  uploadCategory.single("image"), update);
router.delete("/:id", authenticate,  remove);

export default router;
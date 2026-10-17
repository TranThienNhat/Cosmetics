import { Router } from "express";
import { index, create, update, remove } from "../controllers/categoryController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { uploadCategory } from "../middlewares/uploadMiddleware";
import { compressProductsImages } from "../middlewares/compressImage";

const router = Router();

router.get("/", index);
router.post("/", authenticate, authorize("admin", "staff"), uploadCategory.single("image"), compressProductsImages, create);
router.put("/:id", authenticate, authorize("admin", "staff"), uploadCategory.single("image"), compressProductsImages, update);
router.delete("/:id", authenticate, authorize("admin", "staff"), remove);

export default router;
import { Router } from "express";
import { index, create, update, remove } from "../controllers/categoryController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", index);
router.post("/", authenticate, authorize("admin", "staff"), create);
router.put("/:id", authenticate, authorize("admin", "staff"), update);
router.delete("/:id", authenticate, authorize("admin", "staff"), remove);

export default router;
import { Router } from "express";
import { PurchaseController } from "../controllers/purchaseController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

// --- Quản lý Phiếu Nhập (Yêu cầu quyền Admin) ---
router.get("/all", authenticate, PurchaseController.index);
router.get("/:id", authenticate, PurchaseController.show);
router.post("/", authenticate, PurchaseController.create);
router.put("/:id", authenticate, PurchaseController.update);
router.delete("/:id", authenticate, PurchaseController.remove);

export default router;
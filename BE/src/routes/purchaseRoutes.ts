import { Router } from "express";
import { PurchaseController } from "../controllers/purchaseController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

// --- Quản lý Phiếu Nhập (Admin và Staff) ---
router.get("/all", authenticate, authorize("admin", "staff"), PurchaseController.index);
router.get("/:id", authenticate, authorize("admin", "staff"), PurchaseController.show);
router.post("/", authenticate, authorize("admin", "staff"), PurchaseController.create);
router.put("/:id", authenticate, authorize("admin", "staff"), PurchaseController.update);
router.delete("/:id", authenticate, authorize("admin", "staff"), PurchaseController.remove);

export default router;
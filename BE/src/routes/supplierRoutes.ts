import { Router } from "express";
import { SupplierController } from "../controllers/supplierController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

// Chỉ Admin mới được quản lý Supplier
router.get("/", authenticate, requireAdmin, SupplierController.index);
router.get("/:id", authenticate, requireAdmin, SupplierController.show);
router.post("/", authenticate, requireAdmin, SupplierController.create);
router.put("/:id", authenticate, requireAdmin, SupplierController.update);
router.delete("/:id", authenticate, requireAdmin, SupplierController.remove);

export default router;
import { Router } from "express";
import { SupplierController } from "../controllers/supplierController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

// Chỉ Admin mới được quản lý Supplier
router.get("/", authenticate,  SupplierController.index);
router.get("/:id", authenticate,  SupplierController.show);
router.post("/", authenticate,  SupplierController.create);
router.put("/:id", authenticate,  SupplierController.update);
router.delete("/:id", authenticate,  SupplierController.remove);

export default router;
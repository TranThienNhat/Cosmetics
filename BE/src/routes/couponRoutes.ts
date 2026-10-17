import { Router } from "express";
import {
  validateCoupon,
  getAvailableCoupons,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

// Public routes
router.post("/validate", validateCoupon);
router.get("/available", getAvailableCoupons);

// Admin routes
router.post("/", authenticate, requireAdmin, createCoupon);
router.get("/", authenticate, requireAdmin, getAllCoupons);
router.put("/:id", authenticate, requireAdmin, updateCoupon);
router.delete("/:id", authenticate, requireAdmin, deleteCoupon);

export default router;

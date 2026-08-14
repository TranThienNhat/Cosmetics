import { Router } from "express";
import {
  validateCoupon,
  getAvailableCoupons,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

// Public routes
router.post("/validate", validateCoupon);
router.get("/available", getAvailableCoupons);

// Admin routes
router.post("/", authenticate, createCoupon);
router.get("/", authenticate, getAllCoupons);
router.put("/:id", authenticate, updateCoupon);
router.delete("/:id", authenticate, deleteCoupon);

export default router;

import { Router } from "express";
import {
  checkout,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

// User routes
router.post("/checkout", authenticate, checkout);
router.get("/my-orders", authenticate, getMyOrders);

// Admin routes
router.get("/", authenticate, getAllOrders);
router.put("/:id", authenticate, updateOrderStatus);

export default router;

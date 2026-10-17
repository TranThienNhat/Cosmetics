import { Router } from "express";
import {
  checkout,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  handleMomoIpn,
  confirmMomoReturn,
  checkMomoStatus,
  repayMomo,
  switchToCod,
} from "../controllers/orderController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

// MoMo Webhook & Callbacks (Public endpoints)
router.post("/momo-ipn", handleMomoIpn);
router.post("/momo-return-confirm", confirmMomoReturn);
router.get("/check-momo-status/:orderCode", checkMomoStatus);

// User routes
router.post("/checkout", authenticate, checkout);
router.get("/my-orders", authenticate, getMyOrders);
router.post("/:id/repay-momo", authenticate, repayMomo);
router.post("/:id/switch-to-cod", authenticate, switchToCod);

// Admin & Staff routes
router.get("/", authenticate, authorize("admin", "staff"), getAllOrders);
router.put("/:id", authenticate, updateOrderStatus);

export default router;


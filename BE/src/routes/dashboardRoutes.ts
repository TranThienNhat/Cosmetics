import { Router } from "express";
import {
  getFilteredDashboardStats,
} from "../controllers/dashboardController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

// Admin dashboard routes
router.get("/stats", authenticate, requireAdmin, getFilteredDashboardStats);

export default router;

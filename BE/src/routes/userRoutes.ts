import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";

const router = Router();

// Admin routes
router.get("/", authenticate, requireAdmin, getAllUsers);
router.get("/:id", authenticate, requireAdmin, getUserById);
router.put("/:id", authenticate, requireAdmin, updateUser);
router.delete("/:id", authenticate, requireAdmin, deleteUser);

export default router;

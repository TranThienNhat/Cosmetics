import { Router } from "express";
import {
  addToCart,
  getCart,
  removeItem,
  updateItemQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
} from "../controllers/cartController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticate, getCart);
router.post("/add", authenticate, addToCart);

router.post("/coupon/apply", authenticate, applyCoupon);
router.delete("/coupon", authenticate, removeCoupon);
router.delete("/clear", authenticate, clearCart);

router.put("/:variantId", authenticate, updateItemQuantity);
router.delete("/:variantId", authenticate, removeItem);


export default router;

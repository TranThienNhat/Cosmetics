import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/addressController";

const router = Router();

// Tất cả các tuyến đường địa chỉ đều yêu cầu người dùng phải đăng nhập
router.use(authenticate);

router.get("/", getMyAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.patch("/:id/default", setDefaultAddress);
router.delete("/:id", deleteAddress);

export default router;

import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import Coupon from "../models/CouponModel";
import { IUser } from "../interfaces/User";

interface AuthRequest extends Request {
  user?: IUser;
}

export const validateCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const { code, orderValue } = req.body;

    if (!code || !orderValue) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Thiếu mã giảm giá hoặc giá trị đơn hàng" });
    }

    const validation = await Coupon.validateCoupon(code, parseFloat(orderValue), authReq.user?.id);

    if (validation.isValid) {
      return res.json({ success: true, message: validation.message, discount: validation.discount, coupon: validation.coupon });
    } else {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: validation.message });
    }
  } catch (error) {
    console.error("Validate coupon error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const getAvailableCoupons = async (req: Request, res: Response): Promise<Response> => {
  try {
    const value = req.query.orderValue ? parseFloat(req.query.orderValue as string) : 0;
    const coupons = await Coupon.getAvailableCoupons(value);
    return res.json({ success: true, coupons });
  } catch (error) {
    console.error("Get available coupons error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const createCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || authReq.user.role !== "admin") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Không có quyền truy cập" });
    }

    const { code, type, value, min_order_value, max_discount_value, total_limit, start_date, end_date } = req.body;

    if (!code || !type || value == null) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const existingCoupon = await Coupon.findByCode(code);
    if (existingCoupon) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Mã giảm giá đã tồn tại" });

    const couponId = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      min_order_value,
      max_discount_value,
      total_limit,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      is_active: 1,
      used_count: 0,
    });

    return res.status(HTTP_STATUS.CREATED).json({ success: true, message: "Tạo mã giảm giá thành công", couponId });
  } catch (error) {
    console.error("Create coupon error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const getAllCoupons = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || authReq.user.role !== "admin") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Không có quyền truy cập" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const coupons = await Coupon.findAll({ limit, offset });
    const total = await Coupon.count();

    return res.json({ success: true, coupons, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Get all coupons error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const updateCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || authReq.user.role !== "admin") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Không có quyền truy cập" });
    }

    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.used_count;
    delete updateData.created_at;

    await Coupon.update(parseInt(id), updateData);
    return res.json({ success: true, message: "Cập nhật mã giảm giá thành công" });
  } catch (error) {
    console.error("Update coupon error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || authReq.user.role !== "admin") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Không có quyền truy cập" });
    }

    await Coupon.delete(parseInt(req.params.id));
    return res.json({ success: true, message: "Xóa mã giảm giá thành công" });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};


import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import Cart from "../models/CartModel";
import { IUser } from "../interfaces/User";

interface AuthRequest extends Request {
  user?: IUser;
}

const getIdentity = (req: Request) => {
  const authReq = req as AuthRequest;
  return {
    userId: authReq.user?.id,
    sessionId: req.headers["x-session-id"] as string,
  };
};

export const getCart = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, sessionId } = getIdentity(req);
    if (!userId && !sessionId) return res.json({ items: [], total: 0 });

    const cart = await Cart.findCart(userId, sessionId);
    if (!cart) return res.json({ items: [], total: 0, subtotal: 0, discount: 0 });

    const cartData = await Cart.getCartWithCoupon(cart.id!);
    return res.json({ id: cart.id, ...cartData });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const addToCart = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { variantId, quantity } = req.body;
    const { userId, sessionId } = getIdentity(req);

    if (!variantId || isNaN(parseInt(variantId))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Variant ID không hợp lệ" });
    }

    if (!userId && !sessionId) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Thiếu Session ID" });

    let cart = await Cart.findCart(userId, sessionId);
    if (!cart) {
      const cartId = await Cart.create({ user_id: userId || null, session_id: userId ? null : sessionId });
      cart = { id: cartId } as any;
    }

    await Cart.addItem(cart!.id!, parseInt(variantId), parseInt(quantity) || 1);
    return res.json({ message: "Đã thêm vào giỏ" });
  } catch (error: any) {
    console.error("Add to cart error:", error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message || "Lỗi server" });
  }
};

export const updateItemQuantity = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;
    const { userId, sessionId } = getIdentity(req);

    const cart = await Cart.findCart(userId, sessionId);
    if (!cart) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy giỏ hàng" });

    await Cart.updateItemQuantity(cart.id!, parseInt(variantId), parseInt(quantity));
    return res.json({ message: "Đã cập nhật số lượng" });
  } catch (error: any) {
    console.error("Update quantity error:", error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message || "Lỗi server" });
  }
};

export const applyCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { couponCode } = req.body;
    const { userId, sessionId } = getIdentity(req);

    if (!couponCode) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Thiếu mã giảm giá" });

    const cart = await Cart.findCart(userId, sessionId);
    if (!cart) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy giỏ hàng" });

    const result = await Cart.applyCoupon(cart.id!, couponCode, userId);
    return res.json({ success: true, message: "Áp dụng mã giảm giá thành công", ...result });
  } catch (error: any) {
    console.error("Apply coupon error:", error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message || "Lỗi server" });
  }
};

export const removeCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const cart = await Cart.findCart(userId, sessionId);
    if (!cart) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy giỏ hàng" });

    await Cart.removeCoupon(cart.id!);
    return res.json({ success: true, message: "Đã xóa mã giảm giá" });
  } catch (error) {
    console.error("Remove coupon error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const clearCart = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const cart = await Cart.findCart(userId, sessionId);
    if (!cart) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy giỏ hàng" });

    await Cart.clearCart(cart.id!);
    return res.json({ message: "Đã xóa tất cả sản phẩm trong giỏ hàng" });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const removeItem = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { variantId } = req.params; // Lấy từ URL
    const { userId, sessionId } = getIdentity(req);

    const cart = await Cart.findCart(userId, sessionId);
    if (cart) {
      await Cart.removeItem(cart.id!, parseInt(variantId));
    }

    return res.json({ message: "Đã xóa sản phẩm" });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

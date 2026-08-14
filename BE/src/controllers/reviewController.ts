import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import Review from "../models/ReviewModel";
import Order from "../models/OrderModel";
import Product from "../models/ProductModel";

// 1. Tạo đánh giá mới
export const createReview = async (req: Request, res: Response) => {
  try {
    const { variant_id, order_id, rating, comment } = req.body; // Nhận variant_id
    const userId = (req as any).user.id;

    // 1. Ép kiểu
    const vId = parseInt(variant_id);
    const oId = parseInt(order_id);
    const star = parseInt(rating);

    if (isNaN(vId) || isNaN(oId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Thiếu thông tin phiên bản hoặc đơn hàng" });
    }

    // 2. TÌM PRODUCT_ID TỪ VARIANT_ID (Đỡ phải lấy ở Order)
    const [variant]: any = await (Review as any).db.query(
      "SELECT product_id FROM product_variants WHERE id = ?",
      [vId]
    );

    if (!variant || variant.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy sản phẩm này nàng ơi!" });
    }
    const pId = variant[0].product_id;

    // 3. Kiểm tra đơn hàng (Phải completed mới được đánh giá)
    const order = await Order.findById(oId);
    if (!order || order.user_id !== userId || order.status !== 'completed') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Đơn hàng phải hoàn tất mới đánh giá được nhé!" });
    }

    // 4. Kiểm tra trùng lặp
    const [existing]: any = await (Review as any).db.query(
      "SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?",
      [userId, pId, oId]
    );
    
    if (existing && existing.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Nàng đã gửi đánh giá cho sản phẩm này rồi ✨" });
    }

    // 5. Lưu đánh giá thành công
    await Review.create({
      user_id: userId,
      product_id: pId, // Lưu ID sản phẩm gốc
      order_id: oId,
      rating: star,
      comment: comment?.trim() || "Sản phẩm tuyệt vời!",
      is_approved: 1 
    });

    return res.json({ success: true, message: "Cảm ơn nàng đã để lại đánh giá ✨" });
  } catch (error) {
    console.error("Review Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi hệ thống rồi nàng ạ!" });
  }
};

// 2. Lấy danh sách đánh giá theo ID sản phẩm (Dành cho hiển thị tại trang chi tiết)
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.getByProductId(parseInt(productId));
    
    return res.json({ success: true, data: reviews });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Không thể tải đánh giá sản phẩm." });
  }
};

// 4. Quản lý: Lấy toàn bộ đánh giá (Dành cho Admin)
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT r.*, u.name as user_name, p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `;
    const [rows] = await (Review as any).db.query(sql);
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

// 5. Quản lý: Duyệt hoặc ẩn đánh giá (Dành cho Admin)
export const toggleApproveReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body; // 0 hoặc 1

    await Review.update(parseInt(id), { is_approved });
    return res.json({ message: "Cập nhật trạng thái đánh giá thành công." });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi cập nhật." });
  }
};

// 6. Xóa đánh giá
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Review.delete(parseInt(id));
    return res.json({ message: "Đã xóa đánh giá." });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi xóa đánh giá." });
  }
};

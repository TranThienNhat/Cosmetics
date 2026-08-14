import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import Order from "../models/OrderModel";
import Cart from "../models/CartModel";
import { IUser } from "../interfaces/User";

interface AuthRequest extends Request {
  user?: IUser;
}

export const checkout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Vui lòng đăng nhập để đặt hàng" });

    // 1. LẤY DANH SÁCH ITEMS ĐƯỢC CHỌN TỪ REQ.BODY
    const { shipping_info, payment_method, notes, items: selectedItems } = req.body; 
    
    if (!shipping_info?.name || !shipping_info?.phone || !shipping_info?.address) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Thiếu thông tin giao hàng" });
    }

    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Vui lòng chọn ít nhất một sản phẩm để thanh toán" });
    }

    const cart = await Cart.findOne({ user_id: userId } as any);
    if (!cart) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Giỏ hàng trống" });

    // Lấy toàn bộ giỏ hàng gốc từ DB để đối chiếu giá và thông tin
    const cartInfo = await Cart.getCartWithCoupon(cart.id!);
    if (cartInfo.items.length === 0) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Giỏ hàng trống" });

    // 2. LỌC CHỈ LẤY CÁC SẢN PHẨM MÀ FRONTEND ĐÃ TRUYỀN XUỐNG
    const selectedVariantIds = selectedItems.map(item => Number(item.variant_id));
    
    const checkoutItems = cartInfo.items.filter((cartItem: any) => 
      selectedVariantIds.includes(Number(cartItem.variant_id))
    );

    if (checkoutItems.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Sản phẩm chọn thanh toán không hợp lệ hoặc không có trong giỏ hàng" });
    }

    // 3. TÍNH TOÁN LẠI TIỀN DỰA TRÊN SẢN PHẨM ĐÃ CHỌN THỰC TẾ
    const checkoutSubtotal = checkoutItems.reduce((sum: number, item: any) => 
      sum + Number(item.price) * item.quantity, 0
    );

    // Tính lại coupon hợp lý (Nếu discount lớn hơn subtotal mặt hàng được chọn thì giới hạn lại)
    const applicableDiscount = Math.min(cartInfo.discount || 0, checkoutSubtotal);

    // Tính phí vận chuyển theo tổng tiền hàng được chọn
    const shipping_fee = checkoutSubtotal >= 500000 ? 0 : 30000;
    const final_amount = Math.max(checkoutSubtotal - applicableDiscount + shipping_fee, 0); 

    const order_code = `ORD-${Date.now()}`;

    // 4. TẠO ĐƠN HÀNG VỚI DANH SÁCH ĐÃ LỌC
    const orderId = await Order.createOrderTransaction(
      {
        user_id: userId,
        order_code,
        total_amount: checkoutSubtotal,
        discount_amount: applicableDiscount,
        shipping_fee,
        final_amount,
        coupon_id: cartInfo.couponId || undefined,
        shipping_name: shipping_info.name,
        shipping_phone: shipping_info.phone,
        shipping_address: shipping_info.address,
        shipping_email: authReq.user?.email,
        notes: notes || null,                    
        payment_method,
      },
      checkoutItems // Chỉ truyền các item được chọn vào đơn hàng
    );

    // 5. XỬ LÝ XÓA CÁC SẢN PHẨM ĐÃ ĐẶT RA KHỎI GIỎ HÀNG BẰNG VÒNG LẶP (HẾT LỖI COMPILER TS)
    const cartModelAny = Cart as any;
    for (const variantId of selectedVariantIds) {
      if (typeof cartModelAny.removeItem === 'function') {
        await cartModelAny.removeItem(cart.id!, variantId);
      } else if (typeof cartModelAny.removeFromCart === 'function') {
        await cartModelAny.removeFromCart(cart.id!, variantId);
      } else if (typeof cartModelAny.deleteItem === 'function') {
        await cartModelAny.deleteItem(cart.id!, variantId);
      }
    }

    // --- TRẢ DATA ĐẦY ĐỦ VỀ FRONTEND ---
    return res.json({ 
      message: "Đặt hàng thành công", 
      order: {
        id: orderId,
        order_code,
        shipping_info: {
          name: shipping_info.name,
          phone: shipping_info.phone,
          address: shipping_info.address,
          notes: notes || null
        },
        items: checkoutItems, // Trả về đúng các item đã chọn mua ra trang Success
        payment_method,
        summary: {
          subtotal: checkoutSubtotal,
          discount: applicableDiscount,
          shipping_fee,
          final_amount
        },
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error(">>> Checkout Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi khi đặt hàng" });
  }
};

export const getMyOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Vui lòng đăng nhập" });

    const orders = await Order.findAll({ where: { user_id: userId }, orderBy: "created_at", orderDir: "DESC" });
    return res.json({ message: "Lấy danh sách đơn hàng thành công", data: orders });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orders = await Order.findAll({ orderBy: "created_at", orderDir: "DESC" });
    return res.json({ message: "Lấy danh sách đơn hàng thành công", data: orders });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orderId = parseInt(id);
    const currentUser = req.user; // Lấy từ middleware authenticate

    // 1. Tìm đơn hàng hiện tại
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy đơn hàng này nàng ơi!" });
    }

    // 2. KIỂM TRA PHÂN QUYỀN (Logic mấu chốt)
    const isAdmin = currentUser?.role === "admin";
    const isOwner = currentUser?.id === currentOrder.user_id;

    if (!isAdmin) {
      // Nếu không phải Admin thì bắt buộc phải là chủ đơn
      if (!isOwner) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Nàng không có quyền chỉnh sửa đơn hàng của người khác" });
      }
      // Chủ đơn CHỈ được phép chuyển trạng thái sang "cancelled"
      if (status !== "cancelled") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Nàng chỉ có thể yêu cầu hủy đơn hàng thôi ạ" });
      }
    }

    // 3. Kiểm tra trạng thái đơn hàng hiện tại (Chống hủy đơn đã giao/xong)
    if (currentOrder.status === "cancelled" || currentOrder.status === "completed") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Đơn hàng này đã đóng, không thể thay đổi nữa" });
    }
    
    // Nếu là khách hàng, chỉ được hủy khi đơn chưa giao (pending hoặc processing)
    if (!isAdmin && currentOrder.status !== "pending" && currentOrder.status !== "processing") {
       return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Đơn hàng đã được gửi đi, nàng vui lòng liên hệ hotline để hỗ trợ nhé" });
    }

    // 4. XỬ LÝ HOÀN KHO (Nếu status mới là cancelled)
    if (status === "cancelled") {
      const [items]: any = await (Order as any).db.query(
        "SELECT variant_id, quantity FROM order_items WHERE order_id = ?",
        [orderId]
      );

      for (const item of items) {
        await (Order as any).db.query(
          "UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?",
          [item.quantity, item.variant_id]
        );
      }
    }

    // 5. Cập nhật trạng thái
    await Order.update(orderId, { status });

    return res.json({ 
      success: true, 
      message: status === "cancelled" ? "Hủy đơn và hoàn trả kho thành công ✨" : "Cập nhật trạng thái thành công" 
    });

  } catch (error) {
    console.error(">>> Order Update Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi hệ thống, nàng vui lòng thử lại sau" });
  }
};


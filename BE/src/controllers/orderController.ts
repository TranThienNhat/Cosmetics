import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import Order from "../models/OrderModel";
import Cart from "../models/CartModel";
import AddressModel from "../models/AddressModel";
import { IUser } from "../interfaces/User";
import momoService from "../services/momoService";

interface AuthRequest extends Request {
  user?: IUser;
}

export const checkout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Vui lòng đăng nhập để đặt hàng" });

    // 1. LẤY THÔNG TIN GIAO HÀNG (Hỗ trợ linh hoạt cả shipping_info và shipping_address)
    const {
      shipping_info: reqShippingInfo,
      shipping_address: reqShippingAddress,
      payment_method,
      notes,
      items: selectedItems,
      save_address,
    } = req.body; 
    
    const shipping = reqShippingInfo || reqShippingAddress;
    const shippingName = shipping?.name || shipping?.recipient_name;
    const shippingPhone = shipping?.phone;
    const shippingAddr = shipping?.address || shipping?.address_line;

    if (!shippingName || !shippingPhone || !shippingAddr) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Thiếu thông tin giao hàng (vui lòng cung cấp đầy đủ tên, số điện thoại và địa chỉ nhận hàng)",
      });
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
        shipping_name: shippingName,
        shipping_phone: shippingPhone,
        shipping_address: shippingAddr,
        shipping_email: shipping?.email || authReq.user?.email,
        notes: notes || null,                    
        payment_method: payment_method || "cod",
      },
      checkoutItems // Chỉ truyền các item được chọn vào đơn hàng
    );

    // 5. TỰ ĐỘNG LƯU ĐỊA CHỈ NẾU ĐƯỢC YÊU CẦU HOẶC NẾU NGƯỜI DÙNG CHƯA CÓ ĐỊA CHỈ NÀO
    if (userId) {
      try {
        const existingAddresses = await AddressModel.findByUserId(userId);
        const alreadyExists = existingAddresses.some(
          (a) => a.address_line === shippingAddr && a.phone === shippingPhone
        );

        if ((save_address || existingAddresses.length === 0) && !alreadyExists) {
          await AddressModel.createAddress({
            user_id: userId,
            recipient_name: shippingName,
            phone: shippingPhone,
            address_line: shipping.address_line ? String(shipping.address_line).trim() : shippingAddr,
            province: shipping.province ? String(shipping.province).trim() : null,
            ward: shipping.ward ? String(shipping.ward).trim() : null,
            is_default: existingAddresses.length === 0,
          });
        }
      } catch (addrErr) {
        console.warn("Không thể tự động lưu sổ địa chỉ:", addrErr);
      }
    }

    // 6. XỬ LÝ XÓA CÁC SẢN PHẨM ĐÃ ĐẶT RA KHỎI GIỎ HÀNG BẰNG VÒNG LẶP (HẾT LỖI COMPILER TS)
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

    // 7. XỬ LÝ THANH TOÁN MOMO NẾU ĐƯỢC CHỌN
    let momoPaymentData: any = null;
    if (payment_method === "momo") {
      let clientOrigin = "http://localhost:5173";
      if (req.headers.origin) {
        clientOrigin = req.headers.origin as string;
      } else if (req.headers.referer) {
        try {
          clientOrigin = new URL(req.headers.referer as string).origin;
        } catch {
          clientOrigin = "http://localhost:5173";
        }
      }

      const host = req.get("host") || "localhost:3000";
      const protocol = req.protocol || "http";
      const ipnUrl = `${protocol}://${host}/api/orders/momo-ipn`;
      const redirectUrl = `${clientOrigin}/checkout/momo-return`;

      try {
        momoPaymentData = await momoService.createPayment({
          orderId: order_code,
          amount: Math.round(final_amount),
          orderInfo: `Thanh toán đơn hàng ${order_code} qua Thẻ ATM tại Linh Cosmetics`,
          redirectUrl,
          ipnUrl,
        });
      } catch (momoErr: any) {
        console.error(">>> MoMo Create Payment Error:", momoErr);
      }
    }

    // --- TRẢ DATA ĐẦY ĐỦ VỀ FRONTEND ---
    return res.json({ 
      message: payment_method === "momo" ? "Khởi tạo thanh toán Thẻ ATM (MoMo) thành công" : "Đặt hàng thành công", 
      order: {
        id: orderId,
        order_code,
        shipping_info: {
          name: shippingName,
          phone: shippingPhone,
          address: shippingAddr,
          notes: notes || null
        },
        items: checkoutItems, // Trả về đúng các item đã chọn mua ra trang Success
        payment_method: payment_method || "cod",
        payment_status: "unpaid",
        summary: {
          subtotal: checkoutSubtotal,
          discount: applicableDiscount,
          shipping_fee,
          final_amount
        },
        created_at: new Date()
      },
      payUrl: momoPaymentData?.payUrl,
      qrCodeUrl: momoPaymentData?.qrCodeUrl,
      deeplink: momoPaymentData?.deeplink,
      isSimulated: momoPaymentData?.isSimulated
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
    // Đồng bộ: Đơn đã hủy không được để payment_status là unpaid
    orders.forEach((o: any) => {
      if (o.status === "cancelled" && (!o.payment_status || o.payment_status === "unpaid")) {
        o.payment_status = "cancelled";
      }
    });
    return res.json({ message: "Lấy danh sách đơn hàng thành công", data: orders });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orders = await Order.findAll({ orderBy: "created_at", orderDir: "DESC" });
    orders.forEach((o: any) => {
      if (o.status === "cancelled" && (!o.payment_status || o.payment_status === "unpaid")) {
        o.payment_status = "cancelled";
      }
    });
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

    // 4. XỬ LÝ HOÀN KHO & CẬP NHẬT TRẠNG THÁI THANH TOÁN (Nếu status mới là cancelled)
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

      // Khi hủy đơn: nếu đã thanh toán thì chuyển thành refunded, nếu chưa thì chuyển thành cancelled
      const newPaymentStatus = currentOrder.payment_status === "paid" ? "refunded" : "cancelled";
      await (Order as any).db.query(
        "UPDATE orders SET payment_status = ? WHERE id = ?",
        [newPaymentStatus, orderId]
      );
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

/**
 * Xử lý IPN (Instant Payment Notification) từ máy chủ MoMo
 */
export const handleMomoIpn = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      orderId,
      resultCode,
      transId,
      message: momoMsg,
    } = req.body;

    console.log(">>> Nhận MoMo IPN Callback:", { orderId, resultCode, transId, momoMsg });

    if (orderId && Number(resultCode) === 0) {
      await Order.updatePaymentInfo(
        String(orderId),
        "paid",
        String(transId || `MOMO_${Date.now()}`),
        "processing"
      );
      console.log(`Đã cập nhật đơn hàng ${orderId} sang trạng thái đã thanh toán MoMo.`);
    }

    return res.status(HTTP_STATUS.OK).json({ message: "IPN received successfully", resultCode: 0 });
  } catch (error) {
    console.error(">>> Lỗi xử lý MoMo IPN:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "IPN processing error" });
  }
};

/**
 * Xác nhận kết quả thanh toán khi người dùng được chuyển hướng về trang web
 */
export const confirmMomoReturn = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { orderId, resultCode, transId } = req.body;

    if (!orderId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Thiếu mã đơn hàng" });
    }

    const order = await Order.findByOrderCode(String(orderId));
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const isSuccess = Number(resultCode) === 0;

    if (isSuccess) {
      await Order.updatePaymentInfo(
        String(orderId),
        "paid",
        String(transId || order.momo_trans_id || `MOMO_${Date.now()}`),
        "processing"
      );
    }

    const updatedOrder = await Order.findByOrderCode(String(orderId));

    return res.json({
      success: isSuccess,
      message: isSuccess ? "Thanh toán Thẻ ATM (MoMo) thành công!" : "Giao dịch Thẻ ATM (MoMo) không thành công hoặc người dùng đã hủy.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(">>> Lỗi xác nhận MoMo Return:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Lỗi hệ thống khi xác nhận thanh toán" });
  }
};

/**
 * Kiểm tra trạng thái thanh toán MoMo của đơn hàng
 */
export const checkMomoStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { orderCode } = req.params;
    const order = await Order.findByOrderCode(orderCode);

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy đơn hàng" });
    }

    const paymentStatus = (order.status === "cancelled" && (!order.payment_status || order.payment_status === "unpaid")) 
      ? "cancelled" 
      : order.payment_status;

    return res.json({
      order_code: order.order_code,
      payment_method: order.payment_method,
      payment_status: paymentStatus,
      status: order.status,
      final_amount: order.final_amount,
      momo_trans_id: order.momo_trans_id,
    });
  } catch (error) {
    console.error(">>> Lỗi kiểm tra trạng thái đơn:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

/**
 * Khởi tạo lại liên kết thanh toán MoMo cho đơn hàng chưa hoàn tất thanh toán
 */
export const repayMomo = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const orderId = parseInt(id);
    const currentUser = authReq.user;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy đơn hàng" });
    }

    const isAdmin = currentUser?.role === "admin";
    const isOwner = currentUser?.id === order.user_id;
    if (!isAdmin && !isOwner) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Nàng không có quyền thanh toán đơn hàng này" });
    }

    if (order.payment_status === "paid") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Đơn hàng này đã được thanh toán thành công rồi nhé" });
    }

    if (order.status === "cancelled") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        message: "Đơn hàng này đã bị hủy. Nàng vui lòng bấm 'Mua lại đơn này' để tạo đơn mới nhé!",
        isCancelled: true
      });
    }

    if (order.status === "completed") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Đơn hàng này đã hoàn tất" });
    }

    let clientOrigin = "http://localhost:5173";
    if (req.headers.origin) {
      clientOrigin = req.headers.origin as string;
    } else if (req.headers.referer) {
      try {
        clientOrigin = new URL(req.headers.referer as string).origin;
      } catch {
        clientOrigin = "http://localhost:5173";
      }
    }

    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const ipnUrl = `${protocol}://${host}/api/orders/momo-ipn`;
    const redirectUrl = `${clientOrigin}/checkout/momo-return`;

    const momoPaymentData = await momoService.createPayment({
      orderId: order.order_code,
      amount: Math.round(Number(order.final_amount)),
      orderInfo: `Thanh toán lại đơn hàng ${order.order_code} qua Thẻ ATM tại Linh Cosmetics`,
      redirectUrl,
      ipnUrl,
    });

    // Cập nhật phương thức sang MoMo nếu trước đó chưa phải
    await (Order as any).db.query(
      "UPDATE orders SET payment_method = 'momo', payment_status = 'unpaid' WHERE id = ?",
      [orderId]
    );

    return res.json({
      success: true,
      message: "Khởi tạo thanh toán Thẻ ATM (MoMo) thành công",
      order_code: order.order_code,
      payUrl: momoPaymentData.payUrl,
      qrCodeUrl: momoPaymentData.qrCodeUrl,
      deeplink: momoPaymentData.deeplink,
      isSimulated: momoPaymentData.isSimulated
    });
  } catch (error) {
    console.error(">>> Repay MoMo Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi khi khởi tạo lại thanh toán MoMo" });
  }
};

/**
 * Chuyển phương thức thanh toán sang Tiền mặt khi nhận hàng (COD)
 */
export const switchToCod = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const orderId = parseInt(id);
    const currentUser = authReq.user;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy đơn hàng" });
    }

    const isAdmin = currentUser?.role === "admin";
    const isOwner = currentUser?.id === order.user_id;
    if (!isAdmin && !isOwner) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Nàng không có quyền thao tác đơn hàng này" });
    }

    if (order.payment_status === "paid") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Đơn hàng này đã thanh toán rồi, không thể đổi sang COD" });
    }

    if (order.status === "cancelled") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Đơn hàng này đã bị hủy, không thể thay đổi" });
    }

    await (Order as any).db.query(
      "UPDATE orders SET payment_method = 'cod', payment_status = 'unpaid' WHERE id = ?",
      [orderId]
    );

    return res.json({
      success: true,
      message: "Đã chuyển sang thanh toán Tiền mặt khi nhận hàng (COD) thành công!",
      order: { ...order, payment_method: "cod", payment_status: "unpaid" }
    });
  } catch (error) {
    console.error(">>> Switch to COD Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi hệ thống khi chuyển phương thức thanh toán" });
  }
};




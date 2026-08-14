import { BaseModel } from "../core/BaseModel";
import { ICoupon, ICouponValidation } from "../interfaces/Coupon";

class CouponModel extends BaseModel<ICoupon> {
  constructor() {
    super("coupons");
  }

  async findByCode(code: string): Promise<ICoupon | null> {
    return this.findOne({ code } as any);
  }

  // Validate coupon, kiểm tra cả per-user usage qua coupon_user
  async validateCoupon(
    code: string,
    orderValue: number,
    userId?: number
  ): Promise<ICouponValidation> {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      return { isValid: false, message: "Mã giảm giá không tồn tại" };
    }

    if (!coupon.is_active) {
      return { isValid: false, message: "Mã giảm giá không hoạt động" };
    }

    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return { isValid: false, message: "Mã giảm giá chưa có hiệu lực" };
    }

    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return { isValid: false, message: "Mã giảm giá đã hết hạn" };
    }

    // Kiểm tra tổng lượt dùng toàn sàn
    if (coupon.total_limit != null && (coupon.used_count ?? 0) >= coupon.total_limit) {
      return { isValid: false, message: "Mã giảm giá đã hết lượt sử dụng" };
    }

    // Kiểm tra user đã dùng mã này chưa (UNIQUE constraint coupon_user)
    if (userId && coupon.id) {
      const [used]: any = await this.db.query(
        `SELECT id FROM coupon_user WHERE user_id = ? AND coupon_id = ?`,
        [userId, coupon.id]
      );
      if (used.length > 0) {
        return { isValid: false, message: "Bạn đã sử dụng mã giảm giá này rồi" };
      }
    }

    if (coupon.min_order_value && orderValue < coupon.min_order_value) {
      return {
        isValid: false,
        message: `Đơn hàng tối thiểu ${coupon.min_order_value.toLocaleString()}đ để sử dụng mã này`,
      };
    }

    let discount = 0;
    if (coupon.type === "percentage") {
      discount = (orderValue * coupon.value) / 100;
      if (coupon.max_discount_value && discount > coupon.max_discount_value) {
        discount = coupon.max_discount_value;
      }
    } else {
      discount = coupon.value;
    }

    if (discount > orderValue) discount = orderValue;

    return {
      isValid: true,
      discount,
      coupon,
      message: `Giảm ${discount.toLocaleString()}đ`,
    };
  }

  async incrementUsage(couponId: number) {
    await this.db.query(
      "UPDATE coupons SET used_count = used_count + 1 WHERE id = ?",
      [couponId]
    );
  }

  // Ghi nhận user đã dùng coupon (insert vào coupon_user)
  async recordUsage(couponId: number, userId: number, orderId: number) {
    await this.db.query(
      `INSERT INTO coupon_user (coupon_id, user_id, order_id) VALUES (?, ?, ?)`,
      [couponId, userId, orderId]
    );
  }

  async getAvailableCoupons(orderValue: number) {
    const sql = `
      SELECT * FROM coupons 
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
        AND (total_limit IS NULL OR used_count < total_limit)
        AND (min_order_value IS NULL OR min_order_value <= ?)
      ORDER BY value DESC
    `;
    const [rows] = await this.db.query(sql, [orderValue]);
    return rows as ICoupon[];
  }
}

export default new CouponModel();

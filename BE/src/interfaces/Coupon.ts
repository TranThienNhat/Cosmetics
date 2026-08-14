export interface ICoupon {
  id?: number;
  code: string;
  type: "percentage" | "fixed_amount";
  value: number;
  min_order_value?: number;
  max_discount_value?: number;
  total_limit?: number;
  used_count?: number;
  start_date?: Date;
  end_date?: Date;
  is_active?: number; // 1 = active, 0 = inactive
  created_at?: Date;
}

export interface ICouponValidation {
  isValid: boolean;
  message?: string;
  discount?: number;
  coupon?: ICoupon;
}

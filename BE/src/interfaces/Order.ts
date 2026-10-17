export interface IOrder {
  id?: number;
  user_id?: number;
  order_code: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  total_amount: number;
  shipping_fee: number;
  notes?: string;
  discount_amount?: number;
  final_amount: number;
  coupon_id?: number;
  payment_method?: "cod" | "momo" | string;
  payment_status?: "unpaid" | "paid" | "refunded" | "cancelled";
  momo_trans_id?: string;
  status?: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  created_at?: Date;
}

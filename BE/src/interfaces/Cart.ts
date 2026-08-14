export interface ICart {
  id?: number;
  user_id?: number | null;
  session_id?: string | null;
  coupon_id?: number | null;
  created_at?: Date;
}

export interface ICartItem {
  id?: number;
  cart_id: number;
  variant_id: number;
  quantity: number;
}

export interface IReview {
  id?: number;
  user_id: number;
  product_id: number;
  order_id?: number;
  rating: number;
  comment: string;
  is_approved: number;
  created_at?: Date | string;
}
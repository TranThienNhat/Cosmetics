export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status: "active" | "hidden";
  category_id?: number;
  brand_id?: number;
  category_name?: string;
  brand_name?: string;
  // Computed from variants
  min_price?: number;
  max_price?: number;
  total_stock?: number;
  variants: ProductVariant[];
  galleries: Gallery[];
}

export interface Gallery {
  id: number;
  product_id: number;
  image_url: string;
  is_main?: number;
  sort_order?: number;
}

export interface CartItem {
  id: number;
  variant_id: number;
  product_id: number;
  name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  stock_quantity: number;
  slug: string;
  status: string;
  // image from gallery join (optional)
  image_url?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin" | "staff";
  is_active?: number | boolean;
  created_at?: string;
}

export interface Category {
  id?: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  image_url:string;
  description: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  order_id?: number;
  rating: number;
  comment: string;
  is_approved: number;
  user_name: string;
  created_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed_amount";
  value: number;
  min_order_value?: number;
  max_discount_value?: number;
  total_limit?: number;
  used_count: number;
  start_date?: string;
  end_date?: string;
  is_active: number;
}

export interface Order {
  id: number;
  user_id: number;
  order_code: string;
  total_amount: number;
  discount_amount: number;
  shipping_fee?: number;
  final_amount: number;
  coupon_id?: number;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  notes?: string;
  payment_method?: "cod" | "momo" | string;
  payment_status?: "unpaid" | "paid" | "refunded";
  momo_trans_id?: string;
  status: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  variant_id: number;
  name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiError {
  message: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CheckoutData {
  name: string;
  phone: string;
  address: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  is_default: boolean | number;
  created_at?: string;
  updated_at?: string;
}


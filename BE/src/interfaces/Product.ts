export interface IProduct {
  id?: number;
  category_id: number;
  brand_id?: number;
  name: string;
  slug: string;
  description?: string;
  status?: "active" | "hidden";
}

export interface IProductVariant {
  id?: number;
  product_id?: number;
  variant_name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

export interface IProductGallery {
  id?: number;
  product_id: number;
  image_url: string;
  is_main: number;
  sort_order: number;
}
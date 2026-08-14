export interface ICategory {
  id?: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}
export interface IBlog {
  id?: number;
  title: string;
  slug: string;
  cover_image?: string;
  content: string;
  author_id?: number;
  created_at?: Date | string;
}
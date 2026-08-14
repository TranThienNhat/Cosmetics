export interface ISupplier {
  id?: number;
  name: string;
  contact_name?: string; // Thêm mới
  address?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive'; // Thêm mới
  note?: string; // Thêm mới
  created_at?: Date;
  updated_at?: Date;
}
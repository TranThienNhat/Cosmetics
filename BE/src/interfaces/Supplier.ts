export interface ISupplier {
  id?: number;
  name: string;
  contact_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}
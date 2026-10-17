export interface IUserAddress {
  id?: number;
  user_id: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  is_default?: boolean | number;
  created_at?: Date;
  updated_at?: Date;
}

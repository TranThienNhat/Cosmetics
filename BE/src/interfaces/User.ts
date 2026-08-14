export type UserRole = "user" | "admin" | "staff";

export interface IUser {
  id?: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean | number;
  created_at?: Date;
}

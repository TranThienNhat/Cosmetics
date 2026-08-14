export interface IPurchaseReceipt {
  id?: number;
  supplier_id: number;
  user_id: number;
  created_at?: Date;
  note?: string;
  details?: IPurchaseDetail[];
}

export interface IPurchaseDetail {
  id?: number;
  receipt_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
}
import pool from "../config/db";
import { BaseModel } from "../core/BaseModel";
import { IPurchaseReceipt, IPurchaseDetail } from "../interfaces/Purchase";

class PurchaseModel extends BaseModel<IPurchaseReceipt> {
  constructor() {
    super("purchase_receipts");
  }

  async findWithDetails(id: number) {
    const [rows] = await pool.query(`
      SELECT r.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', d.id,
                 'variant_id', d.variant_id,
                 'quantity', d.quantity,
                 'unit_price', d.unit_price
               )
             ) as details
      FROM purchase_receipts r
      LEFT JOIN purchase_receipt_details d ON r.id = d.receipt_id
      WHERE r.id = ?
      GROUP BY r.id
    `, [id]);
    return (rows as any)[0];
  }
}

class PurchaseDetailModel extends BaseModel<IPurchaseDetail> {
  constructor() { super("purchase_receipt_details"); }
}

export const Purchase = new PurchaseModel();
export const PurchaseDetail = new PurchaseDetailModel();
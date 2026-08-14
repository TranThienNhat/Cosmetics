import { BaseModel } from "../core/BaseModel";
import pool from "../config/db";

class ReviewModel extends BaseModel<any> {
  constructor() {
    super("reviews");
  }

  async getByProductId(productId: number) {
    const sql = `
      SELECT r.*, u.name as user_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
    `;
    const [rows] = await this.db.query(sql, [productId]);
    return rows;
  }
}

export default new ReviewModel();
import { BaseModel } from "../core/BaseModel";
import { IGallery } from "../interfaces/Gallery";

class GalleryModel extends BaseModel<IGallery> {
  constructor() {
    super("product_galleries");
  }

  async deleteByProductId(productId: number) {
    const sql = `DELETE FROM ${this.tableName} WHERE product_id = ?`;
    await this.db.query(sql, [productId]);
  }
}

export default new GalleryModel();

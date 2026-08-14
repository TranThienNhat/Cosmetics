import { BaseModel } from "../core/BaseModel";
import { IProduct, IProductVariant } from "../interfaces/Product";
import { IGallery } from "../interfaces/Gallery";

class ProductModel extends BaseModel<IProduct> {
  constructor() {
    super("products");
  }

  // 1. Lấy danh sách kèm ảnh chính và giá min/max
  async findAll(options: any = {}): Promise<any[]> {
    let sql = `
      SELECT p.*, 
             MIN(pv.price) as min_price,
             MAX(pv.price) as max_price,
             SUM(pv.stock_quantity) as total_stock,
             c.name as category_name,
             b.name as brand_name,
             (SELECT image_url FROM product_galleries WHERE product_id = p.id AND is_main = 1 LIMIT 1) as thumb_image
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.deleted_at IS NULL
    `;
    const values: any[] = [];

    if (options.where) {
      Object.keys(options.where).forEach((key) => {
        if (options.where[key] !== undefined && options.where[key] !== null) {
          sql += ` AND p.${key} = ?`;
          values.push(options.where[key]);
        }
      });
    }

    if (options.search) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const term = `%${options.search}%`;
      values.push(term, term);
    }

    sql += ` GROUP BY p.id`;

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      sql += ` HAVING 1=1`;
      if (options.minPrice !== undefined) {
        sql += ` AND min_price >= ?`;
        values.push(options.minPrice);
      }
      if (options.maxPrice !== undefined) {
        sql += ` AND max_price <= ?`;
        values.push(options.maxPrice);
      }
    }

    if (options.orderBy) {
      sql += ` ORDER BY p.${options.orderBy} ${options.orderDir || "ASC"}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset) sql += ` OFFSET ${Number(options.offset)}`;
    }

    const [rows] = await this.db.query(sql, values);
    return rows as any[];
  }

  // 2. Đếm số lượng sản phẩm (Fix SQL Syntax)
  async count(options: any = {}): Promise<number> {
    let sql = `SELECT COUNT(DISTINCT p.id) as total FROM products p WHERE 1=1`;
    const values: any[] = [];

    if (options.where) {
      Object.keys(options.where).forEach((key) => {
        if (options.where[key] !== undefined && options.where[key] !== null) {
          sql += ` AND p.${key} = ?`;
          values.push(options.where[key]);
        }
      });
    }

    if (options.search) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const term = `%${options.search}%`;
      values.push(term, term);
    }

    const [rows]: any = await this.db.query(sql, values);
    return rows[0]?.total || 0;
  }

  // 3. Lấy chi tiết Full Variant + Gallery
  async findWithVariants(id: number | string): Promise<any | null> {
    const [products]: any = await this.db.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [id]
    );
    if (!products.length) return null;

    const [variants] = await this.db.query(`SELECT * FROM product_variants WHERE product_id = ?`, [id]);
    const [galleries] = await this.db.query(`SELECT * FROM product_galleries WHERE product_id = ? ORDER BY sort_order ASC`, [id]);

    return { ...products[0], variants, galleries };
  }

  // ==========================================
  // 🔥 CÂU QUERY BỔ SUNG DÀNH RIÊNG CHO AI
  // ==========================================
  async getProductsForAI(): Promise<any[]> {
    const sql = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.description,
        c.name AS category_name,
        b.name AS brand_name,
        b.description AS brand_description,
        pv.id AS variant_id,
        pv.sku,
        pv.variant_name,
        pv.price,
        pv.stock_quantity
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active' AND p.deleted_at IS NULL;
    `;

    const [rows]: any = await this.db.query(sql);
    
    // Khởi tạo một Map để gom nhóm dữ liệu dạng cấu trúc cây (Nested JSON)
    const productMap: { [key: number]: any } = {};

    rows.forEach((row: any) => {
      if (!productMap[row.product_id]) {
        productMap[row.product_id] = {
          id: row.product_id,
          name: row.product_name,
          category: row.category_name,
          brand: {
            name: row.brand_name,
            description: row.brand_description
          },
          description: row.description,
          variants: []
        };
      }

      if (row.variant_id) {
        productMap[row.product_id].variants.push({
          id: row.variant_id,
          sku: row.sku,
          name: row.variant_name,
          price: parseFloat(row.price),
          stock: row.stock_quantity
        });
      }
    });

    return Object.values(productMap);
  }
}

// --- PRODUCT VARIANT MODEL ---
class ProductVariantModel extends BaseModel<IProductVariant> {
  constructor() { super("product_variants"); }

  async findByProductId(productId: number): Promise<any[]> {
    const [rows] = await this.db.query(`SELECT * FROM product_variants WHERE product_id = ?`, [productId]);
    return rows as any[];
  }

  async delete(id: number | string): Promise<boolean> {
    const [result]: any = await this.db.query(`DELETE FROM product_variants WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  async deleteByProductId(productId: number): Promise<void> {
    await this.db.query(`DELETE FROM product_variants WHERE product_id = ?`, [productId]);
  }
}

// --- GALLERY MODEL ---
class GalleryModel extends BaseModel<IGallery> {
  constructor() { super("product_galleries"); }

  async findAllByProductId(productId: number): Promise<any[]> {
    const [rows] = await this.db.query(`SELECT * FROM product_galleries WHERE product_id = ?`, [productId]);
    return rows as any[];
  }

  async deleteByProductId(productId: number): Promise<void> {
    await this.db.query(`DELETE FROM product_galleries WHERE product_id = ?`, [productId]);
  }
}

export const ProductVariant = new ProductVariantModel();
export const Gallery = new GalleryModel();
export default new ProductModel();
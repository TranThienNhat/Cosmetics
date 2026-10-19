import { BaseModel } from "../core/BaseModel";
import { IOrder } from "../interfaces/Order";
import pool from "../config/db";

class OrderModel extends BaseModel<IOrder> {
  constructor() {
    super("orders");
    this.ensureSchema();
  }

  private async ensureSchema() {
    try {
      await pool.query(
        "ALTER TABLE orders MODIFY COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid'"
      );
    } catch (e: any) {
      // Schema may already be modified or constrained
    }

    try {
      const [res]: any = await pool.query(
        "UPDATE orders SET payment_status = 'cancelled' WHERE status = 'cancelled' AND (payment_status IS NULL OR payment_status = 'unpaid')"
      );
      if (res?.affectedRows > 0) {
        console.log(`Đã đồng bộ ${res.affectedRows} đơn hàng đã hủy sang payment_status = 'cancelled'`);
      }
    } catch (e: any) {
      console.warn("Lỗi đồng bộ payment_status đơn hủy:", e.message);
    }
  }

async findAll(options: any = {}) {
    let values: any[] = [];
    
    // Câu lệnh SQL "linh hồn" của hệ thống
    let sql = `
      SELECT o.*,
             COALESCE(
               JSON_ARRAYAGG(
                 IF(oi.id IS NOT NULL,
                   JSON_OBJECT(
                     'id', oi.id,
                     'product_id', pv.product_id,    -- Lấy ID sản phẩm gốc để Review
                     'variant_id', oi.variant_id,
                     'name', p.name,
                     'variant_name', pv.variant_name,
                     'price', oi.price,
                     'quantity', oi.quantity,
                     'image_url', (
                        SELECT image_url 
                        FROM product_galleries 
                        WHERE product_id = p.id 
                        ORDER BY is_main DESC, id ASC 
                        LIMIT 1
                      ),
                     -- Kiểm tra xem món này trong đơn này đã được nàng Review chưa
                     'is_reviewed', (
                        SELECT COUNT(*) 
                        FROM reviews 
                        WHERE reviews.order_id = o.id 
                        AND reviews.product_id = pv.product_id
                      ) > 0
                   ),
                   NULL
                 )
               ),
               JSON_ARRAY()
             ) as items_json
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
    `;

    // 1. Xử lý điều kiện WHERE (Ví dụ: lọc theo user_id)
    if (options.where) {
      const conditions = Object.keys(options.where).map((key) => {
        values.push(options.where[key]);
        return `o.${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    // 2. BẮT BUỘC PHẢI CÓ GROUP BY: Để mỗi đơn hàng chỉ là 1 dòng dữ liệu
    sql += ` GROUP BY o.id`;

    // 3. Xử lý Sắp xếp
    if (options.orderBy) {
      const direction = options.orderDir || "DESC";
      sql += ` ORDER BY o.${options.orderBy} ${direction}`;
    } else {
      sql += ` ORDER BY o.created_at DESC`;
    }

    // 4. Xử lý Phân trang (Limit/Offset)
    if (options.limit) {
      sql += ` LIMIT ?`;
      values.push(Number(options.limit));
      if (options.offset) {
        sql += ` OFFSET ?`;
        values.push(Number(options.offset));
      }
    }

    try {
      const [rows]: any = await this.db.query(sql, values);

      // 5. PARSE DỮ LIỆU: Chuẩn hóa items thành mảng JSON cho Frontend
      return rows.map((row: any) => {
        let items: any[] = [];
        if (row.items_json) {
          try {
            const raw = typeof row.items_json === "string" ? JSON.parse(row.items_json) : row.items_json;
            if (Array.isArray(raw)) {
              items = raw.filter((item: any) => item && item.id !== null);
            }
          } catch (e) {
            console.error(`Lỗi Parse JSON cho đơn hàng ${row.id}:`, e);
            items = [];
          }
        }
        
        // Trả về dữ liệu sạch sẽ cho Controller
        return {
          ...row,
          items: items,
          items_json: undefined // Ẩn cột thô này đi cho nhẹ
        };
      });
    } catch (error) {
      console.error("Lỗi thực thi SQL tại OrderModel.findAll:", error);
      throw error;
    }
  }

  // --- SỬA LẠI HÀM NÀY ĐỂ KHỚP VỚI SCHEMA MỚI ---
  async createOrderTransaction(
    orderData: any, // Nhận data đầy đủ từ Controller
    items: any[]
  ) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert order với ĐẦY ĐỦ các cột kể cả payment_method, payment_status, momo_trans_id
      const sqlOrder = `
        INSERT INTO orders (
          user_id, order_code, shipping_name, shipping_phone, 
          shipping_address, notes, shipping_fee, total_amount, 
          discount_amount, final_amount, coupon_id, payment_method,
          payment_status, momo_trans_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [orderResult]: any = await connection.query(sqlOrder, [
        orderData.user_id,
        orderData.order_code,
        orderData.shipping_name,
        orderData.shipping_phone,
        orderData.shipping_address,
        orderData.notes || null, // Lưu ghi chú
        orderData.shipping_fee,   // Lưu phí vận chuyển
        orderData.total_amount,
        orderData.discount_amount || 0,
        orderData.final_amount,
        orderData.coupon_id || null,
        orderData.payment_method || 'cod',
        orderData.payment_status || 'unpaid',
        orderData.momo_trans_id || null,
        orderData.status || 'pending'
      ]);
      
      const orderId = orderResult.insertId;

      // 2. Insert order_items (snapshot giá) & trừ tồn kho
      const sqlItem = `INSERT INTO order_items (order_id, variant_id, price, quantity) VALUES (?, ?, ?, ?)`;
      const sqlUpdateStock = `UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?`;

      for (const item of items) {
        // Lưu variant_id và giá tại thời điểm mua
        await connection.query(sqlItem, [
          orderId, 
          item.variant_id, 
          item.price, 
          item.quantity
        ]);

        // Cập nhật kho hàng
        await connection.query(sqlUpdateStock, [
          item.quantity, 
          item.variant_id
        ]);
      }

      // 3. Ghi nhận coupon usage nếu có (Schema: coupon_user)
      if (orderData.coupon_id && orderData.user_id) {
        await connection.query(
          `INSERT INTO coupon_user (coupon_id, user_id, order_id) VALUES (?, ?, ?)`,
          [orderData.coupon_id, orderData.user_id, orderId]
        );
        await connection.query(
          `UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`,
          [orderData.coupon_id]
        );
      }

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error; // Ném lỗi để Controller bắt được
    } finally {
      connection.release();
    }
  }

  async findByOrderCode(orderCode: string) {
    const list = await this.findAll({ where: { order_code: orderCode }, limit: 1 });
    return list.length > 0 ? list[0] : null;
  }

  async updatePaymentInfo(orderCode: string, paymentStatus: "unpaid" | "paid" | "refunded" | "cancelled", momoTransId?: string, orderStatus?: string) {
    const fields: string[] = ["payment_status = ?"];
    const values: any[] = [paymentStatus];

    if (momoTransId) {
      fields.push("momo_trans_id = ?");
      values.push(momoTransId);
    }

    if (orderStatus) {
      fields.push("status = ?");
      values.push(orderStatus);
    }

    values.push(orderCode);
    const sql = `UPDATE orders SET ${fields.join(", ")} WHERE order_code = ?`;
    const [result]: any = await pool.query(sql, values);
    return result.affectedRows > 0;
  }
}

export default new OrderModel();
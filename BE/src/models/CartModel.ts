import { BaseModel } from "../core/BaseModel";
import { ICart } from "../interfaces/Cart";

class CartModel extends BaseModel<ICart> {
  constructor() {
    super("carts");
  }

  async findCart(userId?: number, sessionId?: string) {
    if (userId) return this.findOne({ user_id: userId } as any);
    if (sessionId) return this.findOne({ session_id: sessionId } as any);
    return null;
  }

  // Lấy items trong giỏ, join với product_variants và products
  async getCartItems(cartId: number) {
    const sql = `
      SELECT ci.id, ci.variant_id, ci.quantity, pv.variant_name, pv.price, pv.stock_quantity, pv.image_url,
             p.id as product_id, p.name, p.slug, p.status,
             (SELECT image_url FROM product_galleries WHERE product_id = p.id ORDER BY is_main DESC, sort_order ASC LIMIT 1) as image_url
      FROM cart_items ci
      JOIN product_variants pv ON ci.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE ci.cart_id = ? AND p.status != 'hidden'
    `;
    const [rows] = await this.db.query(sql, [cartId]);
    return rows as any[];
  }

  async addItem(cartId: number, variantId: number, quantity: number) {
    if (!cartId || !variantId || !quantity) {
      throw new Error("Missing required parameters: cartId, variantId, quantity");
    }

    const [variantCheck]: any[] = await this.db.query(
      `SELECT pv.id, pv.stock_quantity, p.status 
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.id 
       WHERE pv.id = ?`,
      [variantId]
    );

    if (!variantCheck.length) throw new Error(`Variant ID ${variantId} không tồn tại`);

    const variant = variantCheck[0];
    if (variant.status === "hidden") throw new Error("Sản phẩm không còn bán");
    if (variant.stock_quantity < quantity) throw new Error(`Không đủ hàng. Còn: ${variant.stock_quantity}`);

    const [existing]: any[] = await this.db.query(
      "SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ?",
      [cartId, variantId]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + quantity;
      if (newQty > variant.stock_quantity) {
        throw new Error(`Không đủ hàng. Còn: ${variant.stock_quantity}, yêu cầu: ${newQty}`);
      }
      await this.db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [newQty, existing[0].id]);
    } else {
      await this.db.query(
        "INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)",
        [cartId, variantId, quantity]
      );
    }
  }

  async updateItemQuantity(cartId: number, variantId: number, quantity: number) {
    if (!cartId || !variantId || quantity < 1) throw new Error("Dữ liệu không hợp lệ");

    const [variantCheck]: any[] = await this.db.query(
      "SELECT stock_quantity FROM product_variants WHERE id = ?",
      [variantId]
    );
    if (!variantCheck.length) throw new Error("Variant không tồn tại");
    if (variantCheck[0].stock_quantity < quantity) {
      throw new Error(`Không đủ hàng. Còn: ${variantCheck[0].stock_quantity}`);
    }

    await this.db.query(
      "UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND variant_id = ?",
      [quantity, cartId, variantId]
    );
  }

  async removeItem(cartId: number, variantId: number) {
    await this.db.query(
      "DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?",
      [cartId, variantId]
    );
  }

  // Áp dụng coupon: lưu coupon_id vào carts
  async applyCoupon(cartId: number, couponCode: string, userId?: number) {
    const items = await this.getCartItems(cartId);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const CouponModel = require("./CouponModel").default;
    const validation = await CouponModel.validateCoupon(couponCode, subtotal, userId);

    if (!validation.isValid) throw new Error(validation.message);

    await this.db.query(
      "UPDATE carts SET coupon_id = ? WHERE id = ?",
      [validation.coupon.id, cartId]
    );

    return {
      subtotal,
      discount: validation.discount,
      total: subtotal - validation.discount,
      coupon: validation.coupon,
    };
  }

  async removeCoupon(cartId: number) {
    await this.db.query("UPDATE carts SET coupon_id = NULL WHERE id = ?", [cartId]);
  }

  async getCartWithCoupon(cartId: number) {
    const [cartInfo]: any[] = await this.db.query(
      `SELECT c.coupon_id, cp.code as coupon_code, cp.type as coupon_type, 
              cp.value as coupon_value, cp.max_discount_value
       FROM carts c
       LEFT JOIN coupons cp ON c.coupon_id = cp.id
       WHERE c.id = ?`,
      [cartId]
    );

    const items = await this.getCartItems(cartId);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const cart = cartInfo[0] || {};
    let discount = 0;

    if (cart.coupon_id) {
      if (cart.coupon_type === "percentage") {
        discount = (subtotal * cart.coupon_value) / 100;
        if (cart.max_discount_value && discount > cart.max_discount_value) {
          discount = cart.max_discount_value;
        }
      } else {
        discount = cart.coupon_value || 0;
      }
      if (discount > subtotal) discount = subtotal;
    }

    return {
      items,
      subtotal,
      discount,
      total: subtotal - discount,
      couponCode: cart.coupon_code || null,
      couponId: cart.coupon_id || null,
      itemCount: items.length,
    };
  }

  async clearCart(cartId: number) {
    await this.db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
    await this.db.query("UPDATE carts SET coupon_id = NULL WHERE id = ?", [cartId]);
  }
}

export default new CartModel();

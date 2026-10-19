import { BaseModel } from "../core/BaseModel";
import { IUserAddress } from "../interfaces/Address";

class AddressModel extends BaseModel<IUserAddress> {
  constructor() {
    super("user_addresses");
  }

  async findByUserId(userId: number): Promise<IUserAddress[]> {
    const [rows] = await this.db.query(
      `SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
      [userId]
    );
    return rows as IUserAddress[];
  }

  async findByIdAndUserId(id: number, userId: number): Promise<IUserAddress | null> {
    const [rows]: any = await this.db.query(
      `SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );
    return rows.length > 0 ? (rows[0] as IUserAddress) : null;
  }

  async createAddress(data: {
    user_id: number;
    recipient_name: string;
    phone: string;
    address_line: string;
    province?: string | null;
    ward?: string | null;
    is_default?: boolean | number;
  }): Promise<number> {
    const addresses = await this.findByUserId(data.user_id);
    const shouldBeDefault = Boolean(data.is_default) || addresses.length === 0;

    if (shouldBeDefault && addresses.length > 0) {
      await this.db.query(
        `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
        [data.user_id]
      );
    }

    const [result]: any = await this.db.query(
      `INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, province, ward, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.recipient_name,
        data.phone,
        data.address_line,
        data.province || null,
        data.ward || null,
        shouldBeDefault ? 1 : 0,
      ]
    );

    return result.insertId;
  }

  async updateAddress(
    id: number,
    userId: number,
    data: Partial<IUserAddress>
  ): Promise<boolean> {
    if (data.is_default) {
      await this.db.query(
        `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
        [userId]
      );
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (data.recipient_name !== undefined) {
      fields.push("recipient_name = ?");
      values.push(data.recipient_name);
    }
    if (data.phone !== undefined) {
      fields.push("phone = ?");
      values.push(data.phone);
    }
    if (data.address_line !== undefined) {
      fields.push("address_line = ?");
      values.push(data.address_line);
    }
    if (data.province !== undefined) {
      fields.push("province = ?");
      values.push(data.province);
    }
    if (data.ward !== undefined) {
      fields.push("ward = ?");
      values.push(data.ward);
    }
    if (data.is_default !== undefined) {
      fields.push("is_default = ?");
      values.push(data.is_default ? 1 : 0);
    }

    if (fields.length === 0) return true;

    values.push(id, userId);
    const [result]: any = await this.db.query(
      `UPDATE user_addresses SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  async setDefault(id: number, userId: number): Promise<boolean> {
    await this.db.query(
      `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
      [userId]
    );

    const [result]: any = await this.db.query(
      `UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return result.affectedRows > 0;
  }

  async deleteAddress(id: number, userId: number): Promise<boolean> {
    const target = await this.findByIdAndUserId(id, userId);
    if (!target) return false;

    const [result]: any = await this.db.query(
      `DELETE FROM user_addresses WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    // Nếu vừa xóa địa chỉ mặc định, set địa chỉ còn lại đầu tiên làm mặc định
    if (target.is_default) {
      const remaining = await this.findByUserId(userId);
      if (remaining.length > 0) {
        await this.db.query(
          `UPDATE user_addresses SET is_default = 1 WHERE id = ?`,
          [remaining[0].id]
        );
      }
    }

    return result.affectedRows > 0;
  }
}

export default new AddressModel();

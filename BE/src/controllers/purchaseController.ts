import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import pool from "../config/db";
import { Purchase } from "../models/PurchaseModel";

const parseItems = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      throw new Error("Định dạng danh sách hàng nhập không hợp lệ.");
    }
  }

  throw new Error("Danh sách hàng nhập không được để trống!");
};

const buildStockUpdateQuery = (
  deltaByVariant: Map<number, number>,
  priceByVariant: Map<number, number>,
) => {
  const variantIds = Array.from(deltaByVariant.keys());
  const stockCase = variantIds.map(() => "WHEN ? THEN ?").join(" ");
  const stockValues = variantIds.flatMap((variantId) => [
    variantId,
    deltaByVariant.get(variantId) || 0,
  ]);

  const priceVariantIds = variantIds.filter((variantId) => priceByVariant.has(variantId));
  const priceCase = priceVariantIds.map(() => "WHEN ? THEN ?").join(" ");
  const priceValues = priceVariantIds.flatMap((variantId) => [
    variantId,
    priceByVariant.get(variantId) || 0,
  ]);

  const priceSql = priceVariantIds.length > 0
    ? `, price = CASE id ${priceCase} ELSE price END`
    : "";

  return {
    sql: `
      UPDATE product_variants
      SET stock_quantity = GREATEST(stock_quantity + CASE id ${stockCase} ELSE 0 END, 0)
      ${priceSql}
      WHERE id IN (?)
    `,
    values: [...stockValues, ...priceValues, variantIds],
  };
};

export const PurchaseController = {
  // =====================================================================
  // 1. LẤY DANH SÁCH PHIẾU NHẬP (Phân trang & Tính tổng tiền)
  // =====================================================================
  index: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [items]: any = await pool.query(
        `
        SELECT 
          pr.*, 
          s.name as supplier_name,
          u.name as user_name,
          (SELECT SUM(quantity * unit_price) 
           FROM purchase_receipt_details 
           WHERE receipt_id = pr.id) as total_amount
        FROM purchase_receipts pr
        LEFT JOIN suppliers s ON pr.supplier_id = s.id
        LEFT JOIN users u ON pr.user_id = u.id
        ORDER BY pr.created_at DESC
        LIMIT ? OFFSET ?
      `,
        [limit, offset],
      );

      const [countResult]: any = await pool.query(
        "SELECT COUNT(*) as total FROM purchase_receipts",
      );
      const total = countResult[0].total;

      return res.json({
        success: true,
        data: items,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      console.error(">>> Lỗi INDEX phiếu nhập:", error);
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Lỗi lấy danh sách", error: error.message });
    }
  },

  // =====================================================================
  // 2. CHI TIẾT PHIẾU NHẬP
  // =====================================================================
  show: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Lấy dữ liệu phiếu từ Model kèm mảng details []
      const data = await Purchase.findWithDetails(Number(id));

      if (!data)
        return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Không tìm thấy phiếu nhập" });

      // Tính toán tổng tiền từ mảng chi tiết trước khi trả về (Hỗ trợ cả trường unit_price hoặc cost_price)
      const total_amount = data.details?.reduce((sum: number, item: any) => {
        const price = Number(item.unit_price) || Number(item.cost_price) || 0;
        return sum + (Number(item.quantity) || 0) * price;
      }, 0) || 0;

      return res.json({
        success: true,
        data: {
          ...data,
          total_amount: total_amount, // Trả về kèm theo để frontend render dễ dàng
        },
      });
    } catch (error: any) {
      console.error(">>> Lỗi SHOW chi tiết phiếu nhập:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  },

  // =====================================================================
  // 3. TẠO MỚI PHIẾU NHẬP (Cộng kho & Cập nhật giá bán tự động)
  // =====================================================================
  create: async (req: any, res: Response) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { supplier_id, note } = req.body;
      const items = parseItems(req.body.items);
      const user_id = req.user?.id || 1;

      // 1. Kiểm tra dữ liệu đầu vào nghiêm ngặt
      if (!supplier_id || isNaN(Number(supplier_id))) {
        throw new Error("Vui lòng chọn nhà cung cấp hợp lệ!");
      }
      if (items.length === 0) {
        throw new Error("Danh sách hàng nhập không được để trống!");
      }

      // 2. Chống lỗi dữ liệu rỗng mang giá trị 'undefined' khi gửi vào SQL
      const safeNote = note !== undefined && note !== "" ? note : null;

      // 3. Tạo phiếu nhập gốc
      const [result]: any = await connection.execute(
        "INSERT INTO purchase_receipts (supplier_id, user_id, note, created_at) VALUES (?, ?, ?, NOW())",
        [Number(supplier_id), Number(user_id), safeNote],
      );
      const receiptId = result.insertId;

      // 4. Duyệt mảng hàng nhập để xử lý chi tiết & kho
      for (const item of items) {
        const variantId = Number(item.product_variant_id || item.variant_id);
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || Number(item.cost_price) || 0;

        if (!variantId || isNaN(variantId)) {
          throw new Error("Có một dòng sản phẩm chưa được chọn đúng biến thể!");
        }
        if (quantity <= 0) {
          throw new Error("Số lượng nhập của các mặt hàng phải lớn hơn 0!");
        }

        // 4.1. Chèn dữ liệu vào bảng chi tiết phiếu nhập
        await connection.execute(
          "INSERT INTO purchase_receipt_details (receipt_id, variant_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
          [receiptId, variantId, quantity, unitPrice],
        );

        // 4.2. Cộng dồn số lượng kho + cập nhật luôn giá bán mới nhất vào bảng biến thể
        await connection.execute(
          "UPDATE product_variants SET stock_quantity = stock_quantity + ?, price = ? WHERE id = ?",
          [quantity, unitPrice, variantId],
        );
      }

      await connection.commit();
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Tạo phiếu nhập hàng thành công!",
        id: receiptId,
      });
    } catch (error: any) {
      await connection.rollback();
      console.error(">>> Lỗi CREATE phiếu nhập:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi tạo phiếu nhập.",
      });
    } finally {
      connection.release();
    }
  },

  // =====================================================================
  // 4. CHỈNH SỬA PHIẾU NHẬP (Hoàn tác kho cũ an toàn -> Lưu dữ liệu mới)
  // =====================================================================
  update: async (req: any, res: Response) => {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const { supplier_id, note } = req.body;

    try {
      const receiptId = Number(id);
      if (isNaN(receiptId) || receiptId <= 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID phiếu nhập không hợp lệ.",
        });
      }

      const items = parseItems(req.body.items);
      if (items.length === 0) {
        throw new Error("Danh sách sản phẩm không hợp lệ hoặc bị trống.");
      }
      if (!supplier_id || isNaN(Number(supplier_id))) {
        throw new Error("Vui lòng chọn nhà cung cấp hợp lệ!");
      }

      const detailRows: any[][] = [];
      const newQtyByVariant = new Map<number, number>();
      const priceByVariant = new Map<number, number>();

      for (const item of items) {
        const variantId = Number(item.product_variant_id || item.variant_id);
        const newQty = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || Number(item.cost_price) || 0;

        if (!variantId || isNaN(variantId)) {
          throw new Error("Phát hiện dòng hàng chưa được chọn sản phẩm/biến thể đúng cách!");
        }
        if (newQty <= 0) {
          throw new Error("Số lượng hàng nhập chỉnh sửa phải lớn hơn 0!");
        }

        detailRows.push([receiptId, variantId, newQty, unitPrice]);
        newQtyByVariant.set(variantId, (newQtyByVariant.get(variantId) || 0) + newQty);
        priceByVariant.set(variantId, unitPrice);
      }

      await connection.beginTransaction();

      const [receiptRows]: any = await connection.query(
        "SELECT id FROM purchase_receipts WHERE id = ? LIMIT 1",
        [receiptId],
      );
      if (receiptRows.length === 0) {
        await connection.rollback();
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy phiếu nhập.",
        });
      }

      // --- BƯỚC 1: LẤY CHI TIẾT CŨ ĐỂ SO SÁNH ---
      const [oldDetails]: any = await connection.query(
        "SELECT variant_id, quantity FROM purchase_receipt_details WHERE receipt_id = ?",
        [receiptId],
      );

      // Chuyển mảng cũ thành một Map để tra cứu nhanh theo variant_id
      const oldItemsMap = new Map<number, number>();
      for (const old of oldDetails) {
        const oldVariantId = Number(old.variant_id);
        oldItemsMap.set(
          oldVariantId,
          (oldItemsMap.get(oldVariantId) || 0) + Number(old.quantity),
        );
      }

      // --- BƯỚC 2: XÓA SẠCH CHI TIẾT CŨ ĐỂ CHUẨN BỊ GHI MỚI ---
      await connection.query(
        "DELETE FROM purchase_receipt_details WHERE receipt_id = ?",
        [receiptId],
      );

      // --- BƯỚC 3: CẬP NHẬT THÔNG TIN PHIẾU NHẬP CHÍNH ---
      const safeNote = note !== undefined && note !== "" ? note : null;
      await connection.query(
        "UPDATE purchase_receipts SET supplier_id = ?, note = ? WHERE id = ?",
        [Number(supplier_id), safeNote, receiptId],
      );

      // --- BƯỚC 4: THÊM CHI TIẾT MỚI & ĐIỀU CHỈNH KHO THEO CHÊNH LỆCH (DELTA) ---
      await connection.query(
        "INSERT INTO purchase_receipt_details (receipt_id, variant_id, quantity, unit_price) VALUES ?",
        [detailRows],
      );

      const deltaByVariant = new Map<number, number>();
      const variantIdsToUpdate = new Set<number>([
        ...oldItemsMap.keys(),
        ...newQtyByVariant.keys(),
      ]);

      for (const variantId of variantIdsToUpdate) {
        const oldQty = oldItemsMap.get(variantId) || 0;
        const newQty = newQtyByVariant.get(variantId) || 0;
        const deltaQty = newQty - oldQty;
        if (deltaQty !== 0 || priceByVariant.has(variantId)) {
          deltaByVariant.set(variantId, deltaQty);
        }
      }

      // --- BƯỚC 5: XỬ LÝ CÁC BIẾN THỂ BỊ XOÁ HẲN KHỎI PHIẾU NHẬP ---
      // Nếu sản phẩm có trong phiếu cũ nhưng không có trong danh sách sửa đổi, delta phía trên sẽ tự trừ tồn kho.
      if (deltaByVariant.size > 0) {
        const stockUpdate = buildStockUpdateQuery(deltaByVariant, priceByVariant);
        await connection.query(stockUpdate.sql, stockUpdate.values);
      }

      await connection.commit();
      return res.json({
        success: true,
        message: "Cập nhật phiếu nhập và tồn kho thành công!",
      });
    } catch (error: any) {
      await connection.rollback();
      console.error(">>> Lỗi UPDATE phiếu nhập:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi cập nhật phiếu nhập.",
      });
    } finally {
      connection.release();
    }
  },

  // =====================================================================
  // 5. XÓA PHIẾU NHẬP (Hoàn tác kho chống âm hoàn toàn)
  // =====================================================================
  remove: async (req: Request, res: Response) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { id } = req.params;

      // 1. Lấy thông tin các mặt hàng cũ trong phiếu nhập để hoàn trả kho
      const [details]: any = await connection.query(
        "SELECT variant_id, quantity FROM purchase_receipt_details WHERE receipt_id = ?",
        [id],
      );

      for (const item of details) {
        // Tích hợp GREATEST chống sập số lượng âm khi xóa phiếu cũ
        await connection.query(
          "UPDATE product_variants SET stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE id = ?",
          [item.quantity, item.variant_id],
        );
      }

      // 2. Thực hiện xóa phiếu chính
      // (Chi tiết trong purchase_receipt_details tự động sạch bản ghi nhờ ON DELETE CASCADE)
      await Purchase.delete(Number(id));

      await connection.commit();
      return res.json({ success: true, message: "Xóa phiếu nhập và hoàn tác kho thành công" });
    } catch (error: any) {
      await connection.rollback();
      console.error(">>> Lỗi REMOVE phiếu nhập:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    } finally {
      connection.release();
    }
  },
};

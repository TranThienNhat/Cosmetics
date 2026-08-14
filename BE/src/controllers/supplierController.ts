import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import { Supplier } from "../models/SupplierModel";
import { ISupplier } from "../interfaces/Supplier";

export const SupplierController = {
  // --- 1. LẤY DANH SÁCH (Hỗ trợ Search & Filter status) ---
  index: async (req: Request, res: Response) => {
    try {
      // 1. Lấy và chuẩn hóa các tham số từ query string
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const search = req.query.search as string;
      const status = req.query.status as string;

      // 2. Xây dựng điều kiện lọc (Where clause)
      // Lưu ý: Tùy vào BaseModel của bạn xử lý toán tử 'like' như thế nào
      // Ở đây giả định truyền trực tiếp object điều kiện phẳng
      const where: any = {};

      if (search) {
        // Nếu BaseModel của bạn hỗ trợ query thô hoặc LIKE
        where.name = { like: `%${search}%` };
      }

      if (status && status !== "all") {
        where.status = status;
      }

      // 3. Thực hiện truy vấn dữ liệu và đếm tổng số bản ghi đồng thời
      const [items, total] = await Promise.all([
        Supplier.findAll({
          where,
          limit,
          offset,
          orderBy: "id",
          orderDir: "DESC",
        }),
        Supplier.count(where),
      ]);

      // 4. Trả về kết quả khớp với cấu trúc frontend yêu cầu (res.data.data)
      return res.json({
        success: true,
        data: items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error(">>> Supplier Index Error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Không thể tải danh sách nhà cung cấp",
        error: error.message,
      });
    }
  },

  // --- 2. TẠO MỚI ---
  create: async (req: Request, res: Response) => {
    try {
      // Nhận thêm các trường mới từ req.body
      const {
        name,
        contact_name,
        address,
        phone,
        email,
        status,
        note,
      }: ISupplier = req.body;

      if (!name)
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: "Tên nhà cung cấp là bắt buộc" });

      if (email) {
        const existing = await Supplier.findOne({ email });
        if (existing)
          return res
            .status(HTTP_STATUS.BAD_REQUEST)
            .json({ message: "Email nhà cung cấp đã tồn tại!" });
      }

      // Lưu đầy đủ các trường mới
      const newId = await Supplier.create({
        name,
        contact_name,
        address,
        phone,
        email,
        status: status || "active", // Mặc định là active nếu không gửi
        note,
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json({ message: "Thêm nhà cung cấp thành công", id: newId });
    } catch (error: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  },

  // --- 3. CẬP NHẬT ---
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: Partial<ISupplier> = req.body;

      const current = await Supplier.findById(Number(id));
      if (!current)
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy nhà cung cấp" });

      // Kiểm tra trùng email nếu có thay đổi email
      if (data.email && data.email !== current.email) {
        const existing = await Supplier.findOne({ email: data.email });
        if (existing)
          return res
            .status(HTTP_STATUS.BAD_REQUEST)
            .json({ message: "Email này đã được sử dụng!" });
      }

      // Cập nhật bao gồm cả status, note, contact_name...
      await Supplier.update(Number(id), data);

      return res.json({ message: "Cập nhật thành công" });
    } catch (error: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  },

  // --- 4. CHI TIẾT ---
  show: async (req: Request, res: Response) => {
    try {
      const item = await Supplier.findById(Number(req.params.id));
      if (!item) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy" });
      return res.json(item);
    } catch (error: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  },

  // --- 5. XÓA ---
  remove: async (req: Request, res: Response) => {
    try {
      // Trước khi xóa có thể kiểm tra xem supplier có đang nằm trong phiếu nhập nào không
      // (MySQL sẽ tự báo lỗi nếu bạn có Ràng buộc khóa ngoại - Foreign Key)
      const success = await Supplier.delete(Number(req.params.id));
      if (!success)
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ message: "Không tìm thấy hoặc xóa thất bại" });

      return res.json({ message: "Xóa nhà cung cấp thành công" });
    } catch (error: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message:
          "Không thể xóa nhà cung cấp này (đã có dữ liệu nhập hàng liên quan)",
        error: error.message,
      });
    }
  },
};


import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import { Blog } from "../models/BlogModel";
import fs from "fs";
import path from "path";
import { IBlog } from "../interfaces/Blog";

// Helper xóa file ảnh
const deleteFile = (filePath: string | undefined | null) => {
  if (!filePath) return;
  try {
    const cleanedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(process.cwd(), cleanedPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (err) {
    console.error(">>> Lỗi xóa file ảnh blog:", err);
  }
};

export const BlogController = {
  // --- 1. LẤY DANH SÁCH (Có tìm kiếm & phân trang) ---
  index: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;

      // Giả sử BaseModel của bạn hỗ trợ search qua findAll hoặc bạn viết thêm
      const items = await Blog.findAll({
        where: search ? { title: search } as any : {}, // Tùy chỉnh logic search của bạn
        limit,
        offset,
        orderBy: "created_at",
        orderDir: "DESC"
      });
      
      const total = await Blog.count();

      return res.json({ 
        data: items, 
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
      });
    } catch (error: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server", error: error.message });
    }
  },

  // --- 2. TẠO MỚI (Xử lý ảnh & Author) ---
  create: async (req: any, res: Response) => {
    try {
      const { title, slug, content } = req.body;
      const file = req.file as Express.Multer.File;
      
      const author_id = req.user?.id; 

      const blogData: Partial<IBlog> = {
        title,
        slug: slug || `${Date.now()}`,
        content,
        author_id,
        cover_image: file ? `/uploads/blogs/${file.filename}` : null
      } as any;

      const newId = await Blog.create(blogData);
      return res.status(HTTP_STATUS.CREATED).json({ message: "Tạo bài viết thành công", id: newId });
    } catch (error: any) {
      if (req.file) deleteFile(`/uploads/blogs/${req.file.filename}`);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  },

  // --- 3. CẬP NHẬT (Xử lý ảnh cũ & Ghi đè) ---
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, slug, content } = req.body;
      const file = req.file as Express.Multer.File;

      // 1. Kiểm tra tồn tại
      const currentBlog = await Blog.findById(Number(id));
      if (!currentBlog) {
        if (file) deleteFile(`/uploads/blogs/${file.filename}`);
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Bài viết không tồn tại" });
      }

      const updateData: Partial<IBlog> = {
        title,
        slug,
        content
      };

      // 2. Nếu có file mới, xóa file cũ
      if (file) {
        if (currentBlog.cover_image) {
          deleteFile(currentBlog.cover_image);
        }
        updateData.cover_image = `/uploads/blogs/${file.filename}`;
      }

      await Blog.update(Number(id), updateData);
      return res.json({ message: "Cập nhật thành công" });
    } catch (error: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  },

  // --- 4. CHI TIẾT ---
  show: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (isNaN(Number(id))) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "ID bài viết không hợp lệ" });
      }
      const blog = await Blog.findById(Number(id));

      if (!blog) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy bài viết này" });
      }

      return res.json(blog);
    } catch (error: any) {
      console.error(">>> Error Blog Show:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi hệ thống", error: error.message });
    }
  },

  // --- 5. XÓA (Xóa cả ảnh vật lý) ---
  remove: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const blog = await Blog.findById(Number(id));
      
      if (!blog) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy bài viết" });

      // Xóa file ảnh trên ổ cứng
      if (blog.cover_image) {
        deleteFile(blog.cover_image);
      }

      await Blog.delete(Number(id));
      return res.json({ message: "Xóa bài viết thành công" });
    } catch (error: any) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
};

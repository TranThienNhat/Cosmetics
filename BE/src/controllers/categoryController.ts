import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import Category from "../models/CategoryModel";
import { createSlug } from "../utils/slug";

export const index = async (req: Request, res: Response) => {
  try {
    const categories = await Category.findAll({ orderBy: "id", orderDir: "ASC" });
    return res.json({ message: "Thành công", data: categories });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, slug, parent_id } = req.body;
    if (!name) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Tên danh mục là bắt buộc" });
    }

    const finalSlug = slug || createSlug(name);
    const exists = await Category.findOne({ slug: finalSlug });
    if (exists) {
      return res.status(HTTP_STATUS.CONFLICT).json({ message: "Slug đã tồn tại" });
    }

    const newId = await Category.create({
      name,
      slug: finalSlug,
      parent_id: parent_id === 'null' || !parent_id ? null : Number(parent_id),
    });

    return res.status(HTTP_STATUS.CREATED).json({ message: "Tạo danh mục thành công", id: newId });
  } catch (error) {
    console.error("Lỗi Create Category:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, parent_id } = req.body;
    const current = await Category.findById(id);
    if (!current) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy" });
    }

    const dataToUpdate: any = {
      name: name || current.name,
      slug: slug || (name ? createSlug(name) : current.slug),
      parent_id: parent_id === 'null' || !parent_id ? null : Number(parent_id),
    };

    await Category.update(id, dataToUpdate);
    return res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy" });

    // Kiểm tra danh mục con
    const childrenCount = await Category.count({ parent_id: Number(req.params.id) });
    if (childrenCount > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Vui lòng xóa danh mục con trước" });
    }

    if (await Category.delete(req.params.id)) {
      return res.json({ message: "Xóa thành công" });
    }
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Xóa thất bại" });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Danh mục đang chứa sản phẩm" });
  }
};

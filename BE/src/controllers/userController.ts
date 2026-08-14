import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import User from "../models/UserModel";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const users = await User.findAll({
      orderBy: "created_at",
      orderDir: "DESC",
    });

    // Remove password from response
    const safeUsers = users.map((user: any) => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    return res.json({
      message: "Lấy danh sách người dùng thành công",
      data: safeUsers,
    });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy người dùng" });
    }

    // Remove password from response
    const { password, ...safeUser } = user as any;

    return res.json({
      message: "Lấy thông tin người dùng thành công",
      data: safeUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, is_active } = req.body;

    const updated = await User.update(parseInt(id), {
      name,
      email,
      phone,
      role,
      is_active,
    });

    if (!updated) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy người dùng" });
    }

    // Remove password from response
    const { password, ...safeUser } = updated as any;

    return res.json({
      message: "Cập nhật người dùng thành công",
      data: safeUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await User.delete(parseInt(id));

    if (!deleted) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy người dùng" });
    }

    return res.json({
      message: "Xóa người dùng thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};


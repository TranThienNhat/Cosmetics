import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/httpStatus";
import AddressModel from "../models/AddressModel";
import { AuthRequest } from "../middlewares/authMiddleware";

export const getMyAddresses = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Vui lòng đăng nhập" });
    }

    const addresses = await AddressModel.findByUserId(userId);
    return res.json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    console.error("Get Addresses Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi lấy danh sách địa chỉ",
    });
  }
};

export const createAddress = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Vui lòng đăng nhập" });
    }

    const { recipient_name, phone, address_line, province, district, ward, is_default } = req.body;

    if (!recipient_name || !phone || !address_line) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Vui lòng nhập đầy đủ tên người nhận, số điện thoại và địa chỉ cụ thể",
      });
    }

    const newId = await AddressModel.createAddress({
      user_id: userId,
      recipient_name: recipient_name.trim(),
      phone: phone.trim(),
      address_line: address_line.trim(),
      province: province ? String(province).trim() : null,
      district: district ? String(district).trim() : null,
      ward: ward ? String(ward).trim() : null,
      is_default: Boolean(is_default),
    });

    const addresses = await AddressModel.findByUserId(userId);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Thêm địa chỉ mới thành công",
      addressId: newId,
      data: addresses,
    });
  } catch (error: any) {
    console.error("Create Address Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi thêm địa chỉ",
    });
  }
};

export const updateAddress = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Vui lòng đăng nhập" });
    }

    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "ID địa chỉ không hợp lệ" });
    }

    const { recipient_name, phone, address_line, province, district, ward, is_default } = req.body;

    const updated = await AddressModel.updateAddress(addressId, userId, {
      recipient_name,
      phone,
      address_line,
      province,
      district,
      ward,
      is_default,
    });

    if (!updated) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Không tìm thấy địa chỉ hoặc bạn không có quyền sửa",
      });
    }

    const addresses = await AddressModel.findByUserId(userId);
    return res.json({
      success: true,
      message: "Cập nhật địa chỉ thành công",
      data: addresses,
    });
  } catch (error: any) {
    console.error("Update Address Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi cập nhật địa chỉ",
    });
  }
};

export const setDefaultAddress = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Vui lòng đăng nhập" });
    }

    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "ID địa chỉ không hợp lệ" });
    }

    const success = await AddressModel.setDefault(addressId, userId);
    if (!success) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }

    const addresses = await AddressModel.findByUserId(userId);
    return res.json({
      success: true,
      message: "Đã đặt làm địa chỉ mặc định",
      data: addresses,
    });
  } catch (error: any) {
    console.error("Set Default Address Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi đổi địa chỉ mặc định",
    });
  }
};

export const deleteAddress = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Vui lòng đăng nhập" });
    }

    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "ID địa chỉ không hợp lệ" });
    }

    const deleted = await AddressModel.deleteAddress(addressId, userId);
    if (!deleted) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Không tìm thấy địa chỉ hoặc không có quyền xóa",
      });
    }

    const addresses = await AddressModel.findByUserId(userId);
    return res.json({
      success: true,
      message: "Đã xóa địa chỉ",
      data: addresses,
    });
  } catch (error: any) {
    console.error("Delete Address Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi xóa địa chỉ",
    });
  }
};

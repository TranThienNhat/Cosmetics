import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";

export const uploadSingle = (req: Request, res: Response): Response => {
  try {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Không có file được upload" });
    }

    // Tạo URL cho file - chỉ cần filename
    const fileUrl = `/uploads/${req.file.filename}`;

    console.log("File uploaded:", {
      originalPath: req.file.path,
      filename: req.file.filename,
      fileUrl,
    });

    return res.json({
      message: "Upload file thành công",
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi khi upload file" });
  }
};

export const uploadMultiple = (req: Request, res: Response): Response => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Không có file được upload" });
    }

    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: `/uploads/${file.filename}`,
      path: file.path,
    }));

    return res.json({
      message: "Upload files thành công",
      data: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi khi upload files" });
  }
};


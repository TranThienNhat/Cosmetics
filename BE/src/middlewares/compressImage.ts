import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import fs from "fs";

export const compressProductsImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let files: Express.Multer.File[] = [];

  if (req.file) {
    files.push(req.file);
  } else if (req.files) {
    if (Array.isArray(req.files)) {
      files = req.files;
    } else {
      files = Object.values(req.files).flat();
    }
  }
  
  // Nếu không có file nào được upload, bỏ qua và chuyển sang bước tiếp theo
  if (files.length === 0) {
    return next();
  }

  const COMPRESSION_THRESHOLD = 1 * 1024 * 1024; // Ngưỡng 1MB

  try {
    // Chạy nén song song tất cả các file trong request
    await Promise.all(
      files.map(async (file) => {
        if (file.size > COMPRESSION_THRESHOLD) {
          const tempPath = `${file.path}.tmp`;
          try {
            await sharp(file.path)
              .resize({ width: 1920, withoutEnlargement: true })
              .jpeg({ quality: 80, progressive: true })
              .toFile(tempPath);

            // Ghi đè file đã nén lên file gốc mà Multer vừa lưu
            await fs.promises.rename(tempPath, file.path);
          } catch (err) {
            console.error(`>>> Lỗi nén file ${file.filename}:`, err);
            // Thất bại thì dọn dẹp file tạm, vẫn giữ file gốc để tránh chết luồng của user
            await fs.promises.unlink(tempPath).catch(() => {});
          }
        }
      })
    );

    // Nén xong xuôi, gọi next() để chuyển sang Controller
    next();
  } catch (error) {
    console.error(">>> Lỗi hệ thống trong middleware nén ảnh:", error);
    // Vẫn cho next() để không làm sập ứng dụng, hoặc bạn có thể trả về lỗi tùy cấu hình
    next();
  }
};
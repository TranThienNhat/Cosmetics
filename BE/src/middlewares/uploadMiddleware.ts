import multer from "multer";
import path from "path";
import fs from "fs";

// Hàm tạo storage động dựa trên folder name
const createStorage = (folderName: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.resolve(process.cwd(), "uploads", folderName);
      // Tự động tạo folder nếu chưa tồn tại
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${folderName}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });
};

export const uploadBrand = multer({ 
  storage: createStorage("brands"),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const uploadProduct = multer({ 
  storage: createStorage("products"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadBlog= multer({ 
  storage: createStorage("blogs"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadCategory = multer({ storage: createStorage("categories"),
  limits: { fileSize: 2 * 1024 * 1024 },});
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../interfaces/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_123";

export interface AuthRequest extends Request {
  user?: IUser;
}

// 1. Middleware bắt buộc phải có Token (Ví dụ: Vào trang Profile, Đặt hàng...)
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ 
      code: "TOKEN_MISSING", 
      message: "Không có quyền truy cập (Thiếu Token)" 
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as IUser;
    req.user = decoded;
    next();
  } catch (error: any) {
    // Kiểm tra tự động nếu lỗi là do hết hạn token
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ 
        code: "TOKEN_EXPIRED", 
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." 
      });
      return;
    }
    
    res.status(401).json({ 
      code: "TOKEN_INVALID", 
      message: "Token không hợp lệ" 
    });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "admin") {
    res
      .status(403)
      .json({ message: "Bạn không có quyền thực hiện thao tác này" });
    return;
  }
  next();
};

// 2. Middleware phân quyền linh hoạt theo danh sách Roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Nàng không có quyền thực hiện thao tác này" });
    }
    next();
  };
};

// 3. Middleware kiểm tra quyền xem sản phẩm (Hỗ trợ khách vãng lai)
export const checkRoleForProduct = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  // Nếu không có token -> Khách vãng lai, xem hàng thường
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    (req as any).showAllProducts = false;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as IUser;
    req.user = decoded;

    // Admin hoặc Staff thì được xem cả hàng ẩn
    if (decoded.role === "admin" || decoded.role === "staff") {
      (req as any).showAllProducts = true;
    } else {
      (req as any).showAllProducts = false;
    }
    next();
  } catch (error: any) {
    // Nếu có gửi token nhưng token lại hết hạn -> Ép logout luôn để tránh xung đột dữ liệu
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ 
        code: "TOKEN_EXPIRED", 
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." 
      });
      return;
    }
    
    // Các lỗi token khác: Coi như khách vãng lai
    (req as any).showAllProducts = false;
    next();
  }
};
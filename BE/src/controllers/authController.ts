import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import User from "../models/UserModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IUser, UserRole } from "../interfaces/User";

// --- CONSTANTS ---
const JWT_SECRET = process.env.JWT_SECRET || "secret_key_123";

// --- HELPERS ---
const generateToken = (user: IUser) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// --- REGISTER ---
export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, email, password, phone } = req.body as IUser;

    if (!name || !email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "Vui lòng nhập tên, email và mật khẩu" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({ message: "Email này đã được sử dụng" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserId = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "user",
      is_active: true,
    });

    const userPayload: IUser = {
      id: newUserId,
      role: "user",
      name,
      email,
    };

    const token = generateToken(userPayload);

    return res.status(HTTP_STATUS.CREATED).json({
      message: "Đăng ký thành công",
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi hệ thống khi đăng ký" });
  }
};

// --- LOGIN ---
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    if (!Boolean(user.is_active)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Tài khoản đã bị khóa" });
    }

    const token = generateToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi hệ thống khi đăng nhập" });
  }
};


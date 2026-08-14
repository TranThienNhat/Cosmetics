import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthResponse } from "../types";
import api from "../utils/api";
import { message } from "antd";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Đọc trạng thái từ bộ nhớ
  const checkAuthStatus = () => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Lỗi phân tích dữ liệu user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();

    // Khi api.ts phát tín hiệu hết hạn, chỉ cần cập nhật state user về null một cách im lặng
    const handleExpiredEvent = () => {
      setUser(null);
    };

    window.addEventListener("auth:expired", handleExpiredEvent);
    window.addEventListener("storage", checkAuthStatus);
    
    return () => {
      window.removeEventListener("auth:expired", handleExpiredEvent);
      window.removeEventListener("storage", checkAuthStatus);
    };
  }, []); // Đứng im không lặp lại vô hạn

  // Hàm Đăng Nhập
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });

      const { token, user: userData } = response.data;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_data", JSON.stringify(userData));

      setUser(userData);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Đăng nhập thất bại";
      message.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm Đăng Ký
  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      await api.post("/auth/register", { name, email, password, phone });
      return await login(email, password);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại";
      message.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm Đăng Xuất Chủ Động
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
    message.success("Đăng xuất thành công!");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
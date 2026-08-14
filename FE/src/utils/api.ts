import { message } from "antd";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const STATIC_URL = import.meta.env.VITE_UPLOAD_URL || "http://localhost:3000/uploads";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

// Biến cờ hiệu dùng để khóa, đảm bảo thông báo chỉ chạy 1 lần duy nhất toàn hệ thống
let isRedirectingExpiredToken = false;

const getSessionId = (): string => {
  let sessionId = localStorage.getItem("x-session-id");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("x-session-id", sessionId);
  }
  return sessionId;
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      config.headers["x-session-id"] = getSessionId();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const code = error.response.data?.code;

      if (code === "TOKEN_EXPIRED") {
        // NẾU ĐÃ CÓ REQUEST TRƯỚC ĐÓ ĐANG XỬ LÝ HẾT HẠN -> CHẶN ĐỨNG REQUEST NÀY LẠI NGAY
        if (isRedirectingExpiredToken) {
          return new Promise(() => {}); 
        }

        // Bật khóa chốt chặn lên để các API chạy song song khác không lọt vào đây được nữa
        isRedirectingExpiredToken = true;

        // 1. Phát tín hiệu cho ProtectedRoute đóng băng màn hình
        window.dispatchEvent(new Event("auth:expired"));

        // 2. Xóa sạch dữ liệu trong LocalStorage
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");

        // 3. Hiển thị thông báo duy nhất
        message.warning("Phiên làm việc đã hết hạn. Hệ thống đang tự động đăng xuất...", 1.0)
          .then(() => {
            // Sau khi chuyển trang xong mới mở khóa cờ hiệu cho lần đăng nhập sau
            isRedirectingExpiredToken = false;
            window.location.href = "/login";
          });

        return new Promise(() => {}); 
      }
    }
    return Promise.reject(error);
  }
);

export default api;

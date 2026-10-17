# Quy Chuẩn Lập Trình & Quy Trình Dự Án (Project Rules)

## 1. Nguyên Tắc Tránh Quét Lại Dự Án
- Mọi thông tin về kiến trúc, database, endpoint, tài khoản test đã được ghi nhận trong `AGENTS.md` và Skill `cosmetics-dev`.
- Không thực hiện các lệnh đọc file hàng loạt hoặc liệt kê toàn bộ thư mục khi không cần thiết.

## 2. Quy Tắc Backend (Node.js / Express / TypeScript)
- Mọi route mới phải khai báo trong `BE/src/routes/` và mount vào `BE/src/server.ts`.
- Mọi truy vấn database sử dụng kết nối pool từ `BE/src/config/db.ts` với câu lệnh prepared statement (`?`).
- Kiểm tra quyền truy cập bằng middleware `authenticate` và `requireAdmin` từ `BE/src/middlewares/authMiddleware.ts`.
- Ảnh upload phải qua middleware `uploadProduct`/`uploadBrand`/`uploadBlog` và `compressProductsImages`.

## 3. Quy Tắc Frontend (React / Vite / TypeScript)
- Không dùng plain CSS tùy tiện, ưu tiên TailwindCSS kết hợp Ant Design 5 token đã cấu hình.
- Theme màu chủ đạo là `#e11d48` (Rose 600).
- Các trang mới cần đăng ký route trong `FE/src/App.tsx` và bọc trong đúng layout (`MainLayout` hoặc `AdminLayout`).
- Mọi lệnh gọi API phải qua instance `api` từ `FE/src/utils/api.ts`.

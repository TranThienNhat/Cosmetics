# Linh Cosmetics - Agent Instructions & Project Memory

Tệp này được nạp tự động vào ngữ cảnh của Agent khi làm việc trong dự án Linh Cosmetics.
Dự án đã có Skill mở rộng tại: [`.agents/skills/cosmetics-dev/SKILL.md`](file:///c:/Users/trant/Cosmetics/.agents/skills/cosmetics-dev/SKILL.md).

---

## ⚡ Bản Đồ Nhanh Toàn Bộ Dự Án (Project Cheat Sheet)

- **Frontend (`/FE`)**: React 18 + Vite + TypeScript + Ant Design 5 (Theme `#e11d48`) + TailwindCSS 3 + Recharts. Chạy tại: `http://localhost:5173`.
- **Backend (`/BE`)**: Express 5 + TypeScript + MySQL2 (kết nối TiDB Cloud với SSL) + Multer + Sharp nén ảnh WebP. Chạy tại: `http://localhost:3000` (API: `http://localhost:3000/api`).
- **Machine Learning (`/BE/ml_engine`)**: Python 3 (venv tại `BE/venv/`), Scikit-Learn (Random Forest dự báo doanh thu), Mlxtend (Apriori combo mua kèm), Pandas/NumPy (dự báo nhu cầu tồn kho DIL, phân tích xu hướng trending).
- **Cơ Sở Dữ Liệu**: MySQL 8.0 / TiDB Cloud Serverless (`mypham_db`).
- **MCP Server**: [`BE/mcp_server.py`](file:///c:/Users/trant/Cosmetics/BE/mcp_server.py) (Stdio JSON-RPC).

---

## 🔑 Tài Khoản Mặc Định (Mật khẩu: `123456`)
- **Admin**: `admin@gmail.com`, `v@gmail.com`
- **Nhân viên**: `staff@gmail.com`
- **Khách hàng**: `khachhang@gmail.com`, `mai@gmail.com`

---

## 🧭 Cấu Trúc File & Thư Mục Quan Trọng
- **Backend Server Entry**: [`BE/src/server.ts`](file:///c:/Users/trant/Cosmetics/BE/src/server.ts)
- **Database Pool Config**: [`BE/src/config/db.ts`](file:///c:/Users/trant/Cosmetics/BE/src/config/db.ts)
- **Backend Routes**: [`BE/src/routes/`](file:///c:/Users/trant/Cosmetics/BE/src/routes) (`auth`, `product`, `cart`, `order`, `analytics`, `ai`, `category`, `brand`, `coupon`, `dashboard`, `blog`, `supplier`, `purchase`, `review`, `user`).
- **Frontend App Router**: [`FE/src/App.tsx`](file:///c:/Users/trant/Cosmetics/FE/src/App.tsx)
- **Frontend API Client**: [`FE/src/utils/api.ts`](file:///c:/Users/trant/Cosmetics/FE/src/utils/api.ts) (Tự động kèm `Authorization: Bearer <token>` hoặc `x-session-id: <uuid>`).
- **Frontend Types**: [`FE/src/types/index.ts`](file:///c:/Users/trant/Cosmetics/FE/src/types/index.ts)
- **Schema & Init DB**: [`BE/db.sql`](file:///c:/Users/trant/Cosmetics/BE/db.sql)

---

## 🛠️ Lệnh Thực Thi Cơ Bản
- Chạy BE: `cd BE && npm run dev`
- Chạy FE: `cd FE && npm run dev`
- Cài đặt ML venv: `cd BE && .\setup_venv.bat`
- Build kiểm tra BE: `cd BE && npx tsc --noEmit`
- Build kiểm tra FE: `cd FE && npm run build`

---

## 📌 Quy Tắc Khi Sửa & Thêm Chức Năng
1. **Không cần đọc lại toàn bộ cấu trúc dự án**: Sử dụng bản đồ thư mục và tài liệu tham khảo trong [`.agents/skills/cosmetics-dev/references/`](file:///c:/Users/trant/Cosmetics/.agents/skills/cosmetics-dev/references/).
2. **Luôn giữ chuẩn phân quyền**:
   - Khách: Xem danh mục, xem sản phẩm, đánh giá (sau đăng nhập), thêm giỏ hàng.
   - Staff: Quản lý danh mục, đơn hàng, blog, phiếu nhập kho.
   - Admin: Toàn quyền truy cập Dashboard, AI Forecast, phân quyền user, cấu hình coupon, nhà cung cấp.
3. **Giữ nhất quán Styling**: Tone màu chính `#e11d48`, định dạng tiền tệ `formatPrice(...)`, responsive mobile/desktop.
4. **Kiểm tra biên dịch**: Luôn xác nhận không có lỗi TypeScript trước khi báo hoàn thành.

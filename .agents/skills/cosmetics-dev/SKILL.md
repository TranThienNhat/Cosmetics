---
name: cosmetics-dev
description: >-
  Essential developer runbook and knowledge base for the Linh Cosmetics full-stack application
  (React 18 + Vite frontend, Express + TypeScript backend, Python Machine Learning Engine,
  and MySQL/TiDB database). Use this skill whenever building, modifying, refactoring,
  debugging, or answering questions about features, APIs, database, ML models, or UI
  in this codebase to avoid re-reading or scanning the repository.
---

# Linh Cosmetics Developer Skill & Cheatsheet

Kỹ năng này cung cấp toàn bộ kiến thức cô đọng, cấu trúc dự án, sơ đồ dữ liệu, API và quy trình phát triển cho **Linh Cosmetics** mà không cần phải quét lại toàn bộ mã nguồn.

---

## 1. Bản Đồ Tài Liệu Chi Tiết (Quick References)

Để xem chi tiết từng thành phần mà không tốn token ngữ cảnh, tham khảo các tài liệu chuyên sâu:

- 🏛️ [Kiến Trúc & Luồng Dữ Liệu](./references/architecture.md): Mô hình BE/FE/ML/DB, xử lý session & JWT, Docker.
- 🗄️ [Sơ Đồ Cơ Sở Dữ Liệu](./references/database_schema.md): 15+ bảng MySQL/TiDB, quan hệ khóa ngoại, tài khoản mẫu.
- 🌐 [Danh Sách Tuyến Đường API](./references/api_routes.md): Chi tiết mọi endpoint REST, tham số và phân quyền.
- 🤖 [Hướng Dẫn ML Engine](./references/ml_engine.md): Random Forest, Apriori, Demand Forecasting, Trend Analysis, Python venv.
- 🎨 [Hướng Dẫn Phát Triển Frontend](./references/frontend_guide.md): Cấu trúc router React, Ant Design theme, Recharts.

---

## 2. Thông Tin Cốt Lõi Dự Án (Cheat Sheet)

### 2.1 Công Nghệ Sử Dụng
- **Frontend**: React 18, Vite 5, TypeScript, Ant Design 5 (Theme `#e11d48`), TailwindCSS 3, Recharts, Lucide Icons.
- **Backend**: Node.js, Express 5, TypeScript, `mysql2/promise` (hỗ trợ TiDB SSL), Multer + Sharp (nén ảnh WebP/JPEG).
- **AI & ML**: Python 3.9+, Scikit-Learn (Random Forest), Mlxtend (Apriori), Pandas, NumPy, PyMySQL.
- **Cơ Sở Dữ Liệu**: MySQL 8.0 / TiDB Cloud Serverless (`mypham_db`).
- **MCP Server**: `BE/mcp_server.py` (cung cấp tool qua Stdio JSON-RPC).

### 2.2 Tài Khoản Mẫu (Mật khẩu: `123456`)
- **Admin**: `admin@gmail.com` | `v@gmail.com`
- **Nhân viên (Staff)**: `staff@gmail.com`
- **Khách hàng (User)**: `khachhang@gmail.com` | `mai@gmail.com`

### 2.3 Cổng & URL Mặc Định
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000` (API base: `http://localhost:3000/api`)
- **Ảnh tĩnh (Uploads)**: `http://localhost:3000/uploads`

---

## 3. Lệnh Phát Triển Thường Dùng (Dev Commands)

### Khởi động nhanh Backend & Frontend:
```powershell
# Chạy Backend (Terminal 1)
cd BE
npm run dev

# Chạy Frontend (Terminal 2)
cd FE
npm run dev
```

### Thiết lập môi trường Machine Learning (Python):
```powershell
cd BE
.\setup_venv.bat
# Hoặc thủ công:
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
```

### Chạy thử độc lập các script Machine Learning:
```powershell
cd BE
python ml_engine/revenue_forecasting.py 30
python ml_engine/demand_forecasting.py
python ml_engine/frequently_bought_together.py
python ml_engine/trend_analysis.py
```

### Khởi tạo & Seed dữ liệu cơ sở dữ liệu:
```powershell
cd BE
npm run db:init   # Chạy tệp init-db.js
npm run db:seed   # Chạy tệp seed.js
```

### Khởi chạy Docker Compose (Môi trường hoàn chỉnh):
```powershell
docker compose up --build -d
```

---

## 4. Quy Trình Làm Việc Khi Chỉnh Sửa Mã Nguồn

### 4.1 Khi sửa đổi hoặc thêm API Backend:
1. Thêm/sửa Controller trong [`BE/src/controllers/`](file:///c:/Users/trant/Cosmetics/BE/src/controllers).
2. Đăng ký route tương ứng trong [`BE/src/routes/`](file:///c:/Users/trant/Cosmetics/BE/src/routes).
3. Đảm bảo gắn đúng middleware phân quyền (`authenticate`, `requireAdmin`, hoặc `checkRoleForProduct`).
4. Nếu thay đổi cấu trúc dữ liệu trả về, cập nhật interface trong `BE/src/interfaces/` và `FE/src/types/index.ts`.

### 4.2 Khi sửa đổi Giao diện Frontend:
1. Tuân thủ bảng màu thương hiệu: Primary `#e11d48` (Rose 600), background `#f8fafc` hoặc `#ffffff`.
2. Định dạng tiền tệ luôn dùng `formatPrice(...)` từ `FE/src/utils/helpers.ts`.
3. Kiểm tra phân quyền trang trong `FE/src/App.tsx` (kiểm tra `allowedRoles={["admin"]}` hoặc `["admin", "staff"]`).
4. Gọi API thông qua instance `api` từ `FE/src/utils/api.ts` để tự động kèm token và session id.

### 4.3 Khi sửa đổi hoặc bổ sung Mô hình ML:
1. Viết logic tính toán trong `BE/ml_engine/<script>.py`.
2. Luôn xuất kết quả dạng JSON qua `print(json.dumps(...))` với cờ UTF-8.
3. Trong `BE/src/controllers/analyticsController.ts`, tích hợp hàm `runPythonScript(...)` và đặt key cache phù hợp (TTL 3 phút).
4. Thêm tool tương ứng vào `BE/mcp_server.py` nếu cần tương tác thông qua MCP.

---

## 5. Kiểm Tra & Xác Minh (Verification Checklist)

Trước khi hoàn tất bất kỳ chỉnh sửa nào:
- [ ] Backend biên dịch thành công: `cd BE && npx tsc --noEmit`
- [ ] Frontend build thành công: `cd FE && npm run build` (hoặc `npx tsc --noEmit`)
- [ ] API trả về đúng định dạng JSON chuẩn: `{ success: true, data: ... }`
- [ ] Giao diện responsive trên cả Desktop và Mobile, không vỡ layout Ant Design

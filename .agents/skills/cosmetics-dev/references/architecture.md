# Kiến Trúc Hệ Thống Linh Cosmetics (Architecture Reference)

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Linh Cosmetics là nền tảng thương mại điện tử mỹ phẩm cao cấp tích hợp hệ thống Trí tuệ Nhân tạo & Machine Learning (Dự báo doanh thu Random Forest, dự báo nhu cầu tồn kho DIL, khai phá luật kết hợp Apriori, phân tích xu hướng và chatbot tư vấn làm đẹp).

```
                      +---------------------------------------+
                      |       Frontend (React 18 + Vite)      |
                      |  Ant Design 5 + TailwindCSS + Recharts|
                      +-------------------+-------------------+
                                          |
                                          | REST API (Axios, JWT, x-session-id)
                                          v
                      +---------------------------------------+
                      |       Backend (Express + TypeScript)  |
                      |  Multer + Sharp, JWT, CORS, Routing   |
                      +---------+-------------------+---------+
                                |                   |
                 Child Process  |                   | mysql2 / TiDB Driver
            (execFile / Stdio)  |                   |
                                v                   v
          +-----------------------+   +-------------------------------+
          |  Python 3 ML Engine   |   |   MySQL 8.0 / TiDB Cloud DB   |
          |  (Scikit-Learn, Pandas|   |   (mypham_db - 15+ Tables)    |
          |   Apriori / Mlxtend)  |   +-------------------------------+
          +-----------------------+
```

---

## 2. Các Thành Phần Chính

### 2.1 Backend (Thư mục `/BE`)
- **Ngôn ngữ & Runtime**: Node.js, TypeScript (`ts-node`, `nodemon`).
- **Framework**: Express 5.
- **Cơ sở dữ liệu**: MySQL 8.0 hoặc TiDB Cloud (qua thư viện `mysql2/promise` có hỗ trợ SSL TLSv1.2).
- **Xử lý tập tin / Ảnh**: `multer` lưu vào thư mục `/BE/uploads`, middleware `sharp` nén ảnh tự động sang định dạng WebP/JPEG tối ưu.
- **Xác thực & Bảo mật**: `bcrypt` (mã hóa mật khẩu 10 salt rounds), `jsonwebtoken` (JWT token hạn 7 ngày).
- **Giao tiếp ML Engine**: `child_process.execFile` gọi các script Python trong `BE/ml_engine/` với caching in-memory TTL 3 phút để giảm tải CPU.
- **Cổng mặc định**: `3000` (Endpoint gốc: `http://localhost:3000/api`).

### 2.2 Frontend (Thư mục `/FE`)
- **Ngôn ngữ & Bundler**: React 18, Vite 5, TypeScript.
- **UI & Styling**: Ant Design 5 (cấu hình theme token màu hồng/đỏ mỹ phẩm `#e11d48`), TailwindCSS 3, Lucide Icons, `@ant-design/icons`.
- **Quản lý Routing**: `react-router-dom` v6 với các route công khai và phân quyền bảo vệ `ProtectedRoute` (Roles: `admin`, `staff`, `user`).
- **Quản lý Trạng thái**: React Context (`AuthContext` quản lý tài khoản & token; `CartContext` quản lý giỏ hàng).
- **Biểu đồ & Analytics**: `recharts` (AreaChart, BarChart, PieChart) hiển thị dự báo AI và báo cáo thống kê.
- **Cổng mặc định**: `5173` (Truy cập: `http://localhost:5173`).

### 2.3 Machine Learning Engine (Thư mục `/BE/ml_engine`)
- **Ngôn ngữ & Môi trường**: Python 3.9+ trong Virtual Environment `BE/venv/`.
- **Thư viện chính**: `scikit-learn`, `pandas`, `numpy`, `mlxtend`, `pymysql`, `python-dotenv`.
- **Mô hình chính**:
  1. `revenue_forecasting.py`: Random Forest Regressor dự báo doanh thu tương lai 7, 14, 30, 60 ngày kèm dải tin cậy 90%.
  2. `demand_forecasting.py`: Dự báo tốc độ tiêu thụ (Burn Rate), Days of Inventory (DIL), đề xuất nhập kho thông minh.
  3. `frequently_bought_together.py`: Khai phá luật kết hợp Apriori tìm combo mua kèm thường xuyên và đề xuất ưu đãi combo.
  4. `trend_analysis.py`: Momentum score, nhận định tăng trưởng ngành hàng & thương hiệu hot trending.
  5. `seed_data.py`: Khởi tạo dữ liệu mẫu mô phỏng đơn hàng lịch sử để huấn luyện mô hình.

### 2.4 Model Context Protocol (MCP Server: `BE/mcp_server.py`)
- Cung cấp các tool truy vấn dữ liệu và AI model qua Stdio JSON-RPC:
  - `get_store_metrics`
  - `predict_revenue_ml`
  - `get_inventory_health`
  - `get_fbt_combos`
  - `search_products_knowledge`
  - `run_ml_retrain`

---

## 3. Quy Ước Xác Thực & Phiên Làm Việc

1. **Người dùng đã đăng nhập**:
   - Token JWT được gửi trong header: `Authorization: Bearer <auth_token>`.
   - Lưu trữ ở client: `localStorage.getItem("auth_token")` và `localStorage.getItem("user_data")`.
2. **Khách vãng lai (Guest)**:
   - Header: `x-session-id: <uuid>`.
   - Tự động sinh bởi `FE/src/utils/api.ts` nếu chưa có token, cho phép khách thêm giỏ hàng trước khi đăng nhập.
3. **Xử lý Token hết hạn**:
   - Backend trả mã lỗi: `{ code: "TOKEN_EXPIRED", message: "..." }` với HTTP 401.
   - Axios interceptor của Frontend tự động kích hoạt sự kiện `auth:expired`, xóa LocalStorage và chuyển hướng tới `/login`.

---

## 4. Cấu Trúc Thư Mục Tổng Thể

```text
Cosmetics/
├── BE/                           # Node.js + Express Backend
│   ├── ml_engine/                # Python Machine Learning scripts
│   │   ├── db_helper.py
│   │   ├── revenue_forecasting.py
│   │   ├── demand_forecasting.py
│   │   ├── frequently_bought_together.py
│   │   └── trend_analysis.py
│   ├── src/
│   │   ├── config/               # DB (mysql2 pool, TiDB SSL), AI SDKs (Gemini, DeepSeek, OpenAI)
│   │   ├── constants/            # HTTP status, messages
│   │   ├── controllers/          # 16 Controllers xử lý logic nghiệp vụ
│   │   ├── interfaces/           # TypeScript interfaces (User, Product, Order...)
│   │   ├── middlewares/          # Auth, Multer upload, Sharp compression
│   │   ├── models/               # Model database queries
│   │   ├── routes/               # 15 Route files đăng ký endpoint
│   │   └── server.ts             # Điểm khởi chạy Express server
│   ├── uploads/                  # Thư mục chứa hình ảnh sản phẩm/bài viết
│   ├── db.sql                    # File khởi tạo database và schema
│   ├── seed.js                   # Seed dữ liệu ban đầu
│   └── setup_venv.bat            # Script tạo Python venv tự động trên Windows
├── FE/                           # React Frontend
│   ├── src/
│   │   ├── components/           # Components dùng chung (Header, Footer, Layout, Guards)
│   │   ├── config/               # Theme token Ant Design
│   │   ├── contexts/             # AuthContext, CartContext
│   │   ├── pages/                # Các trang người dùng (Home, Products, Cart, Checkout...)
│   │   │   └── admin/            # 13 Trang quản trị Admin & Staff
│   │   ├── types/                # TypeScript data models
│   │   ├── utils/                # api.ts (Axios instance), helpers (formatCurrency, dates)
│   │   ├── App.tsx               # Cấu hình Routing toàn bộ ứng dụng
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml            # Docker container hóa (MySQL, BE, FE Nginx)
└── DEPLOYMENT_GUIDE.md           # Hướng dẫn triển khai Vercel, Render, Docker
```

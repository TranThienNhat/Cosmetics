# 🚀 Hướng Dẫn Triển Khai Hệ Thống (Vercel & Render & Docker)

Hệ thống bao gồm:
- **Frontend (FE)**: React + Vite + Ant Design + TailwindCSS + Recharts -> **Triển khai lên Vercel**
- **Backend (BE)**: Express + TypeScript + Python Machine Learning Engine (Scikit-Learn, Apriori) -> **Triển khai lên Render (Docker Web Service)**
- **Database**: MySQL 8.0 (Có thể dùng Aiven / PlanetScale / Render Managed MySQL / Supabase MySQL / Railway)

---

## 🌟 PHẦN 1: TRIỂN KHAI BACKEND LÊN RENDER

### Bước 1: Chuẩn bị Cơ sở dữ liệu MySQL
1. Tạo một cơ sở dữ liệu MySQL miễn phí trên [Aiven.io](https://aiven.io), [TiDB Cloud](https://tidbcloud.com), hoặc [Railway.app](https://railway.app).
2. Import tệp `BE/db.sql` vào cơ sở dữ liệu vừa tạo để khởi tạo toàn bộ bảng.

### Bước 2: Tạo Web Service trên Render
1. Đăng nhập vào [Render.com](https://render.com).
2. Chọn **New +** -> **Web Service**.
3. Kết nối với Git Repository của bạn.
4. Thiết lập cấu hình:
   - **Name**: `cosmetics-backend`
   - **Region**: `Singapore` (để tối ưu tốc độ tại Việt Nam)
   - **Language / Environment**: `Docker`
   - **Dockerfile Path**: `./BE/Dockerfile`
   - **Docker Context**: `./BE`
   - **Instance Type**: `Free`

### Bước 3: Cấu hình Biến Môi Trường (Environment Variables) trên Render
Thêm các biến môi trường sau trong tab **Environment**:
| Key | Value ví dụ | Ghi chú |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Bắt buộc |
| `PORT` | `3000` | Cổng backend |
| `DB_HOST` | `your-db-host.com` | Host MySQL từ cloud |
| `DB_PORT` | `3306` | Port MySQL |
| `DB_USER` | `your_db_username` | Tên người dùng MySQL |
| `DB_PASSWORD` | `your_db_password` | Mật khẩu MySQL |
| `DB_NAME` | `mypham_db` | Tên cơ sở dữ liệu |
| `JWT_SECRET` | `your_very_secure_secret_key_2026` | Khóa JWT |
| `CORS_ORIGIN` | `*` (hoặc domain Vercel của bạn) | Cho phép Frontend gọi API |
| `DEEPSEEK_API_KEY` | `sk-...` | (Tùy chọn) |
| `GEMINI_API_KEY` | `AIza...` | (Tùy chọn) |

5. Bấm **Create Web Service**. Render sẽ tự động build Docker image (gồm Node.js + Python ML dependencies) và khởi chạy.
6. Lưu lại URL backend của bạn (ví dụ: `https://cosmetics-backend.onrender.com`).

---

## ⚡ PHẦN 2: TRIỂN KHAI FRONTEND LÊN VERCEL

### Bước 1: Import Project lên Vercel
1. Đăng nhập vào [Vercel.com](https://vercel.com).
2. Chọn **Add New...** -> **Project**.
3. Chọn Git Repository của dự án.
4. Thiết lập cấu hình:
   - **Root Directory**: Chọn thư mục `FE` (Bấm `Edit` -> chọn thư mục `FE`).
   - **Framework Preset**: `Vite` (Vercel tự động nhận diện).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Bước 2: Cấu hình Biến Môi Trường trên Vercel
Trong mục **Environment Variables**, thêm các biến sau:
| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://cosmetics-backend.onrender.com/api` |
| `VITE_API_BASE_URL` | `https://cosmetics-backend.onrender.com` |
| `VITE_UPLOAD_URL` | `https://cosmetics-backend.onrender.com/uploads` |

*(Thay `https://cosmetics-backend.onrender.com` bằng URL thực tế từ Render của bạn)*

### Bước 3: Deploy
1. Bấm **Deploy**.
2. Tệp [FE/vercel.json](file:///c:/Users/ADMIN/Cosmetics/FE/vercel.json) đã được thiết lập sẵn quy tắc SPA Rewrites để khi reload bất kỳ trang nào (`/admin/ai-forecast`, `/cart`, `/products/1`) đều không bị lỗi `404 Not Found`.

---

## 🐳 PHẦN 3: KHỞI CHẠY TẤT CẢ QUA DOCKER COMPOSE (LOCAL)

Để chạy trọn bộ (MySQL + Backend + Frontend) trên máy cá nhân chỉ bằng 1 câu lệnh:

```bash
docker compose up --build -d
```

- **Frontend**: `http://localhost:80`
- **Backend API**: `http://localhost:3000`
- **MySQL DB**: `localhost:3306`

---

## 💻 PHẦN 4: KHỞI CHẠY BẰNG TAY (DEVELOPMENT MODE)

### 1. Khởi động Backend:
```bash
cd BE
npm install
npm run dev
```

### 2. Khởi động Frontend:
```bash
cd FE
npm install
npm run dev
```
Truy cập giao diện tại: `http://localhost:5173`.

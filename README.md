# 💄 Linh Cosmetics - E-Commerce & AI Forecasting Platform

Nền tảng thương mại điện tử mỹ phẩm cao cấp tích hợp hệ thống **Trí tuệ Nhân tạo & Machine Learning** (Dự báo doanh thu Random Forest, dự báo nhu cầu bán hàng, tối ưu tồn kho chuỗi cung ứng, khai phá luật mua kèm Apriori và phân tích xu hướng thị trường).

---

## 🌟 Tính Năng Nổi Bật

### 🤖 1. Hệ thống AI & Machine Learning
- **Dự báo Doanh thu (Random Forest Regressor)**: Dự báo doanh thu 7 - 60 ngày tới với mô hình Machine Learning Ensemble kết hợp đặc trưng chuỗi thời gian (Autoregressive Lags, Rolling Means) và dải tin cậy 90% (Confidence Intervals).
- **Dự báo Nhu cầu Mỹ phẩm (Demand Forecasting)**: Ước tính tốc độ tiêu thụ (Burn Rate) từng sản phẩm, tính toán số ngày còn lại đến khi hết hàng (DIL) và tự động đề xuất số lượng cần nhập thêm vào kho.
- **Gợi ý Món Mua Kèm (Frequently Bought Together / Apriori)**: Khai phá các cặp sản phẩm thường xuyên được mua cùng nhau, hiển thị combo tiết kiệm -10% trên trang chi tiết sản phẩm và gợi ý thông minh trong giỏ hàng.
- **Phân Tích Xu Hướng (Trend & Momentum Analysis)**: Bảng xếp hạng sản phẩm Hot Trending (> +30% tăng trưởng), phân bổ thị phần danh mục & thương hiệu kèm nhận định chiến lược kinh doanh.
- **Trợ lý AI Tư vấn Làm đẹp**: Hỗ trợ khách hàng tìm kiếm mỹ phẩm thông minh kết hợp DeepSeek, OpenAI GPT và Google Gemini.

### 🛍️ 2. Mua Sắm & Bán Hàng Trực Tuyến
- Danh mục sản phẩm, biến thể (màu sắc, dung tích), thương hiệu chính hãng.
- Giỏ hàng thông minh, áp dụng mã giảm giá (Coupon), thanh toán đơn hàng.
- Hệ thống đánh giá & xếp hạng sản phẩm (Reviews).
- Bài viết tin tức & Blog làm đẹp.

### 🏢 3. Quản Trị Hệ Thống (Admin Panel)
- Dashboard thống kê tổng quan doanh thu, đơn hàng, tỷ lệ hủy.
- Trung tâm Phân tích & Dự báo AI 4 tab trực quan với Recharts.
- Quản lý sản phẩm, danh mục, thương hiệu, nhà cung cấp, mã giảm giá.
- Quản lý nhập hàng kho (Purchase Receipts) liên kết trực tiếp với đề xuất AI.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, Vite, TypeScript, Ant Design 5, TailwindCSS, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, Multer, Sharp.
- **Machine Learning Engine**: Python 3, Scikit-Learn, Pandas, NumPy, Mlxtend (Apriori), PyMySQL.
- **Cơ Sở Dữ Liệu**: MySQL 8.0.
- **DevOps & Triển khai**: Docker, Docker Compose, Nginx, Vercel, Render.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Sử dụng Docker Compose (Khuyên dùng)
```bash
docker compose up --build -d
```
- **Frontend**: `http://localhost:80`
- **Backend API**: `http://localhost:3000`
- **MySQL**: `localhost:3306`

### Cách 2: Khởi chạy Development thông thường

#### 1. Backend:
```bash
cd BE
npm install
# Cài đặt thư viện Python ML:
pip install -r requirements.txt
npm run dev
```

#### 2. Frontend:
```bash
cd FE
npm install
npm run dev
```
Truy cập: `http://localhost:5173`.

---

## 📖 Hướng Dẫn Triển Khai (Vercel & Render)
Xem chi tiết tại tệp [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

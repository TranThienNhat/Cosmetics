# Hướng Dẫn ML Engine (Machine Learning & AI Engine Reference)

Thư mục: [`BE/ml_engine/`](file:///c:/Users/trant/Cosmetics/BE/ml_engine)  
MCP Server: [`BE/mcp_server.py`](file:///c:/Users/trant/Cosmetics/BE/mcp_server.py)

---

## 1. Môi Trường & Cài Đặt (Python Virtual Environment)

Môi trường Python ML được cách ly trong thư mục `BE/venv/`.

### Thiết lập nhanh:
- **Windows**: Chạy tệp `BE/setup_venv.bat` hoặc:
  ```powershell
  cd BE
  python -m venv venv
  .\venv\Scripts\pip install -r requirements.txt
  ```
- **Tập tin `requirements.txt`**:
  ```text
  scikit-learn>=1.3.0
  pandas>=2.0.0
  numpy>=1.24.0
  mlxtend>=0.22.0
  pymysql>=1.1.0
  python-dotenv>=1.0.0
  cryptography>=41.0.0
  ```

---

## 2. Cơ Chế Kết Nối Cơ Sở Dữ Liệu (`db_helper.py`)
Mọi script Python đều dùng chung hàm `get_db_connection()` từ `db_helper.py`:
- Đọc biến môi trường từ `BE/.env`.
- Tự động nhận diện host TiDB Cloud (`tidbcloud.com`) và kích hoạt kết nối SSL/TLS.
- Trả về `pymysql.cursors.DictCursor` (dữ liệu trả về dưới dạng dictionary).

---

## 3. Các Mô Hình Machine Learning

### 3.1 Dự Báo Doanh Thu (`revenue_forecasting.py`)
- **Thuật toán**: Random Forest Regressor kết hợp chuỗi thời gian (Time-series Feature Engineering).
- **Đặc trưng (Features)**:
  - Lags: Doanh thu trễ 1 ngày, 3 ngày, 7 ngày, 14 ngày.
  - Rolling Stats: Trung bình động (Rolling Mean 7 ngày, 14 ngày), Độ lệch chuẩn (Rolling Std).
  - Yếu tố lịch: Ngày trong tuần (Day of week), Ngày trong tháng, Cuối tuần (Is weekend), Tháng trong năm.
- **Đầu ra**:
  - Doanh thu dự báo từng ngày cho `N` ngày tới (`7`, `14`, `30`, hoặc `60` ngày).
  - Dải tin cậy 90% (Upper Bound, Lower Bound) để ước tính rủi ro thị trường.
  - Các chỉ số đánh giá mô hình: R2 Score, MAE (Mean Absolute Error), RMSE.
- **Lệnh chạy thử độc lập**:
  ```powershell
  cd BE
  python ml_engine/revenue_forecasting.py 30
  ```

### 3.2 Dự Báo Nhu Cầu & Tối Ưu Tồn Kho (`demand_forecasting.py`)
- **Mục tiêu**: Hỗ trợ thủ kho và quản lý ra quyết định đặt hàng thông minh, tránh đứt hàng hoặc tồn kho quá mức.
- **Công thức & Chỉ số**:
  - **Tốc độ tiêu thụ (Burn Rate / Daily Velocity)**: Trung bình số lượng bán mỗi ngày trong 30-90 ngày qua.
  - **Số ngày còn lại đến khi hết hàng (DIL - Days of Inventory Left)**:
    $$\text{DIL} = \frac{\text{Tồn kho hiện tại}}{\text{Tốc độ bán hàng ngày}}$$
  - **Trạng thái cảnh báo**:
    - `critical` (DIL < 7 ngày): Báo động đỏ, cần nhập gấp.
    - `warning` (7 <= DIL <= 15 ngày): Cảnh báo sắp hết.
    - `healthy` (15 < DIL <= 45 ngày): Mức tồn kho lý tưởng.
    - `overstock` (DIL > 45 ngày): Tồn đọng vốn.
  - **Đề xuất nhập hàng (Suggested Reorder Quantity)**: Tính toán số lượng cần nhập dựa trên Lead Time (thời gian giao hàng của NCC) và Buffer an toàn 30 ngày.
- **Lệnh chạy thử độc lập**:
  ```powershell
  cd BE
  python ml_engine/demand_forecasting.py
  ```

### 3.3 Khai Phá Luật Kết Hợp Mua Kèm (`frequently_bought_together.py`)
- **Thuật toán**: Apriori & Association Rules từ thư viện `mlxtend`.
- **Chỉ số khai phá**:
  - **Support**: Tỷ lệ giao dịch chứa cả hai món A và B trên tổng đơn.
  - **Confidence**: Xác suất mua món B khi đã mua món A.
  - **Lift**: Độ mạnh của mối tương quan giữa A và B (Lift > 1 biểu thị tương quan thuận mạnh).
- **Ứng dụng trên giao diện**:
  - Gợi ý Combo Tiết Kiệm -10% trên trang chi tiết sản phẩm (`ProductDetailPage`).
  - Gợi ý sản phẩm kèm theo trên trang Giỏ hàng (`CartPage`).
- **Lệnh chạy thử độc lập**:
  ```powershell
  cd BE
  python ml_engine/frequently_bought_together.py
  ```

### 3.4 Phân Tích Xu Hướng & Động Lực Thị Trường (`trend_analysis.py`)
- **Chỉ số Momentum**: Đo lường tốc độ tăng trưởng doanh số so với kỳ trước.
- **Tiêu chuẩn Hot Trending**: Sản phẩm có mức tăng trưởng doanh số $> +30\%$.
- **Thị phần**: Tính toán phần trăm doanh số theo từng danh mục và từng thương hiệu.
- **Chiến lược đề xuất**: Tự động sinh nhận định kinh doanh dạng văn bản tiếng Việt cho Admin.
- **Lệnh chạy thử độc lập**:
  ```powershell
  cd BE
  python ml_engine/trend_analysis.py
  ```

---

## 4. Cơ Chế Gọi Từ Express Backend (`analyticsController.ts`)
1. Hàm `runPythonScript(scriptName, args)` gọi bằng `child_process.execFile`.
2. Truyền cờ môi trường `PYTHONIOENCODING=utf-8` để đảm bảo tiếng Việt không bị lỗi font encoding.
3. Bộ nhớ đệm In-memory (`cache` với TTL 3 phút): Tránh việc spawn tiến trình Python liên tục khi nhiều người dùng tải lại trang cùng lúc.
4. Endpoint `POST /api/analytics/retrain`: Xóa sạch bộ đệm cache và kích hoạt chạy lại các mô hình ML để cập nhật dữ liệu mới nhất.

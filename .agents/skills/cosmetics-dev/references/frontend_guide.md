# Hướng Dẫn Phát Triển Frontend (Frontend Guide Reference)

Thư mục: [`FE/`](file:///c:/Users/trant/Cosmetics/FE)  
Framework: React 18, Vite 5, TypeScript, Ant Design 5, TailwindCSS 3.

---

## 1. Cấu Trúc Tuyến Đường & Trang (Pages & Routes)

### 1.1 Khách Hàng & Công Khai (`MainLayout`)
- `/`: Trang chủ (`HomePage.tsx`) - Banner, danh mục nổi bật, sản phẩm hot, khuyến mãi.
- `/products`: Trang danh sách sản phẩm (`ProductsPage.tsx`) - Bộ lọc nâng cao theo danh mục, thương hiệu, khoảng giá, sắp xếp.
- `/products/:id`: Chi tiết sản phẩm (`ProductDetailPage.tsx`) - Chọn biến thể, xem ảnh gallery, combo Apriori gợi ý, đánh giá review.
- `/cart`: Giỏ hàng (`CartPage.tsx`) - Danh sách món, thay đổi số lượng, áp mã coupon, gợi ý mua kèm.
- `/checkout`: Thanh toán (`CheckoutPage.tsx`) - Nhập thông tin giao hàng, xem tổng tiền và giảm giá.
- `/checkout/success`: Trang thông báo đặt hàng thành công (`CheckoutSuccessPage.tsx`).
- `/orders`: Lịch sử đơn hàng cá nhân (`OrdersPage.tsx`) - Theo dõi trạng thái đơn hàng.
- `/blogs` & `/blogs/:id`: Danh sách và chi tiết tin tức (`BlogListPage.tsx`, `BlogDetailPage.tsx`).
- `/brands`: Danh sách thương hiệu (`BrandsPage.tsx`).
- `/about`, `/contact`: Trang giới thiệu và liên hệ.
- `/login`, `/register`: Đăng nhập và đăng ký tài khoản.

### 1.2 Bảng Quản Trị Quản Lý (`AdminLayout`)
Bảo vệ bằng `ProtectedRoute`:
- **Chung (Admin & Staff đều có quyền)**:
  - `/admin/orders`: Quản lý & cập nhật trạng thái đơn đặt hàng.
  - `/admin/categories`: Thêm, sửa, xóa danh mục sản phẩm.
  - `/admin/blogs`: Quản lý bài viết blog mỹ phẩm.
  - `/admin/purchases`: Danh sách phiếu nhập hàng từ nhà cung cấp.
  - `/admin/purchase/create` & `/admin/purchase/edit/:id`: Lập và chỉnh sửa phiếu nhập kho.
- **Dành riêng cho Admin (`role === 'admin'`)**:
  - `/admin`: Dashboard thống kê doanh thu, đơn hàng, khách hàng.
  - `/admin/ai-forecast`: Trung tâm Phân tích & Dự báo AI 4 tab (Doanh thu Random Forest, Nhu cầu kho DIL, Combo Apriori, Xu hướng Trending).
  - `/admin/products`: Danh sách sản phẩm, quản lý kho biến thể.
  - `/admin/products/create` & `/admin/products/:id/edit`: Thêm/sửa sản phẩm và tải ảnh gallery.
  - `/admin/brands`: Quản lý thương hiệu.
  - `/admin/coupons`: Quản lý chương trình khuyến mãi và mã coupon.
  - `/admin/suppliers`: Quản lý danh sách nhà cung cấp.
  - `/admin/users`: Quản lý người dùng và phân quyền (`admin`, `staff`, `user`).

---

## 2. Hệ Thống Design & Styling

### 2.1 Bảng Màu Thương Hiệu (Design Tokens)
Cấu hình trong `FE/src/config/theme.ts`:
- **Màu chủ đạo (Primary)**: `#e11d48` (Rose 600 - tone hoa hồng sang trọng).
- **Màu phụ (Secondary / Pink Light)**: `#fff1f2` (Rose 50), `#ffe4e6` (Rose 100).
- **Màu chữ & Nền**:
  - Text chính: `#0f172a` (Slate 900)
  - Text phụ: `#64748b` (Slate 500)
  - Border: `#f1f5f9` / `#e2e8f0`
- **Typography**: Phông chữ Inter / Sans-serif hiện đại.

### 2.2 Quy Chuẩn UI Component
- Các nút tương tác quan trọng, thẻ sản phẩm, icon cần có hiệu ứng hover mượt mà (`transition-all duration-300`, `hover:shadow-md`, `hover:-translate-y-0.5`).
- Định dạng tiền tệ: Dùng hàm tiện ích `formatPrice(amount)` hoặc `formatCurrency(amount)` trong `FE/src/utils/helpers.ts` để hiển thị định dạng `150.000 ₫`.

---

## 3. Quản Lý Gọi API (`FE/src/utils/api.ts`)

- **Axios Instance**: Được cấu hình sẵn `baseURL` từ biến môi trường `VITE_API_URL` (fallback `http://localhost:3000/api`).
- **Tự động gắn Header**:
  - Nếu đã có `auth_token`: Tự động gắn `Authorization: Bearer <auth_token>`.
  - Nếu chưa đăng nhập: Tự động gắn `x-session-id: <uuid>` (lưu trong `localStorage`) để đồng bộ giỏ hàng vãng lai.
- **Xử lý hết hạn phiên**:
  - Bắt lỗi HTTP 401 với mã `TOKEN_EXPIRED`.
  - Hiển thị thông báo `message.warning`, xóa token trong LocalStorage và tự động chuyển về `/login`.

---

## 4. Biểu Đồ & Trực Quan Hóa (Recharts)

- Trang `AiForecastPage.tsx` và `DashboardPage.tsx` sử dụng thư viện `recharts`:
  - `AreaChart` với dải vùng `confidence_interval` cho dự báo doanh thu.
  - `BarChart` cho so sánh tồn kho vs ngưỡng an toàn, phân bổ doanh số.
  - `PieChart` cho tỷ trọng danh mục và thị phần thương hiệu.
- Đảm bảo luôn bọc biểu đồ trong `<ResponsiveContainer width="100%" height={...}>` để giao diện co giãn tốt trên mọi kích thước màn hình.

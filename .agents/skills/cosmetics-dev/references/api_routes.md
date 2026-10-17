# Danh Sách API Endpoints (API Routes Reference)

Tất cả các route đều bắt đầu bằng tiền tố `/api`.
Base URL mặc định: `http://localhost:3000/api`.

---

## 1. Xác Thực (Auth) - `/api/auth`
| Phương thức | Tuyến đường | Quyền | Mô tả | Body / Params |
|:---|:---|:---|:---|:---|
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản khách hàng mới | `{ name, email, password, phone }` |
| `POST` | `/api/auth/login` | Public | Đăng nhập hệ thống | `{ email, password }` -> Trả về `{ token, user }` |

---

## 2. Sản Phẩm & Biến Thể - `/api/products`
| Phương thức | Tuyến đường | Quyền | Mô tả | Ghi chú |
|:---|:---|:---|:---|:---|
| `GET` | `/api/products` | Public | Lấy danh sách sản phẩm (có lọc, phân trang) | Query: `keyword`, `category_id`, `brand_id`, `sort`, `min_price`, `max_price`, `page`, `limit` |
| `GET` | `/api/products/:id` | Public | Xem chi tiết sản phẩm kèm variants & galleries | Hỗ trợ tìm theo ID hoặc slug |
| `GET` | `/api/products/purchase/all-variants` | Public | Lấy toàn bộ biến thể phục vụ tạo phiếu nhập kho | Trả về id biến thể, tên sản phẩm, mã SKU |
| `POST` | `/api/products` | Admin | Thêm sản phẩm mới | Multipart FormData (`images` tối đa 10 ảnh, `variants` dạng JSON string) |
| `PUT` | `/api/products/:id` | Admin | Cập nhật thông tin sản phẩm và gallery ảnh | Multipart FormData |
| `PUT` | `/api/products/:id/variants` | Admin | Thêm/cập nhật biến thể sản phẩm | Multipart FormData |
| `DELETE` | `/api/products/:id` | Admin | Xóa mềm sản phẩm (`deleted_at`) | |

---

## 3. Danh Mục & Thương Hiệu - `/api/categories` & `/api/brands`
| Phương thức | Tuyến đường | Quyền | Mô tả | Body / Params |
|:---|:---|:---|:---|:---|
| `GET` | `/api/categories` | Public | Lấy cây danh mục sản phẩm | |
| `POST` | `/api/categories` | Admin | Thêm danh mục mới | Multipart: `name`, `slug`, `description`, `parent_id`, file `image` |
| `PUT` | `/api/categories/:id`| Admin | Cập nhật danh mục | Multipart: file `image` (nếu có) |
| `DELETE` | `/api/categories/:id`| Admin | Xóa danh mục | |
| `GET` | `/api/brands` | Public | Lấy danh sách thương hiệu | |
| `POST` | `/api/brands` | Admin | Thêm thương hiệu mới | Multipart: `name`, `slug`, `description`, file `image` |
| `PUT` | `/api/brands/:id` | Admin | Cập nhật thương hiệu | Multipart: file `image` (nếu có) |
| `DELETE` | `/api/brands/:id` | Admin | Xóa thương hiệu | |

---

## 4. Giỏ Hàng - `/api/cart`
Header: Phải có `Authorization: Bearer <token>` hoặc `x-session-id: <uuid>` (khách vãng lai).
| Phương thức | Tuyến đường | Quyền | Mô tả | Body / Params |
|:---|:---|:---|:---|:---|
| `GET` | `/api/cart` | Auth / Session | Lấy chi tiết giỏ hàng hiện tại | Kèm thông tin giảm giá nếu đã áp coupon |
| `POST` | `/api/cart/add` | Auth / Session | Thêm biến thể sản phẩm vào giỏ | `{ variantId, quantity }` |
| `PUT` | `/api/cart/:variantId` | Auth / Session | Cập nhật số lượng của biến thể trong giỏ | `{ quantity }` |
| `DELETE` | `/api/cart/:variantId` | Auth / Session | Xóa 1 biến thể khỏi giỏ | |
| `POST` | `/api/cart/coupon/apply` | Auth / Session | Áp dụng mã coupon vào giỏ hàng | `{ code }` |
| `DELETE` | `/api/cart/coupon` | Auth / Session | Hủy mã coupon đang áp dụng | |
| `DELETE` | `/api/cart/clear` | Auth / Session | Xóa sạch toàn bộ sản phẩm trong giỏ | |

---

## 5. Đơn Hàng & Thanh Toán - `/api/orders`
| Phương thức | Tuyến đường | Quyền | Mô tả | Body / Params |
|:---|:---|:---|:---|:---|
| `POST` | `/api/orders/checkout` | User (Token) | Đặt hàng từ giỏ hàng hiện tại | `{ shipping_name, shipping_phone, shipping_address, notes }` |
| `GET` | `/api/orders/my-orders` | User (Token) | Xem danh sách đơn hàng của tài khoản đang đăng nhập | |
| `GET` | `/api/orders` | Admin / Staff | Xem toàn bộ đơn hàng hệ thống | Query: `status`, `page`, `limit` |
| `PUT` | `/api/orders/:id` | Admin / Staff | Cập nhật trạng thái đơn hàng | `{ status: 'pending'\|'processing'\|'shipped'\|'completed'\|'cancelled' }` |

---

## 6. AI & Machine Learning Analytics - `/api/analytics` & `/api/ai`
| Phương thức | Tuyến đường | Quyền | Mô tả | Params & Cache |
|:---|:---|:---|:---|:---|
| `GET` | `/api/analytics/revenue-forecast` | Public / Admin | Dự báo doanh thu bằng Random Forest Regressor | Query `days=30` (hoặc 7, 14, 60). Cache in-memory 3 phút. |
| `GET` | `/api/analytics/demand-forecast` | Public / Admin | Dự báo nhu cầu bán hàng, DIL và gợi ý số lượng nhập | Cache in-memory 3 phút. |
| `GET` | `/api/analytics/frequently-bought-together` | Public | Lấy tất cả quy tắc combo mua kèm Apriori | |
| `GET` | `/api/analytics/frequently-bought-together/:productId` | Public | Lấy gợi ý combo mua kèm cho 1 sản phẩm cụ thể | Dùng hiển thị combo ưu đãi trên ProductDetailPage |
| `POST` | `/api/analytics/cart-recommendations` | Public | Gợi ý món nên mua thêm dựa trên danh sách ID trong giỏ | `{ product_ids: [1, 2] }` |
| `GET` | `/api/analytics/trends` | Public | Phân tích xu hướng hot trending & thị phần ngành hàng | |
| `POST` | `/api/analytics/retrain` | Admin | Làm mới cache và kích hoạt huấn luyện lại mô hình ML | |
| `POST` | `/api/ai/ask` | Public | Trợ lý tư vấn mỹ phẩm thông minh kết hợp Gemini/DeepSeek | `{ prompt, history? }` |

---

## 7. Quản Trị Hệ Thống Khác (Admin Panel)
- **Thống Kê Dashboard**: `GET /api/dashboard/stats` (Admin - Tổng doanh thu, đơn hàng, khách hàng, biểu đồ).
- **Mã Giảm Giá**:
  - `POST /api/coupons/validate` (Public - kiểm tra hợp lệ của mã).
  - `GET /api/coupons/available` (Public - lấy danh sách mã đang chạy).
  - `GET /api/coupons`, `POST /api/coupons`, `PUT /api/coupons/:id`, `DELETE /api/coupons/:id` (Admin).
- **Nhà Cung Cấp**: `GET/POST/PUT/DELETE /api/suppliers` (Admin).
- **Phiếu Nhập Kho**: `GET /api/purchase-receipts/all`, `GET/POST/PUT/DELETE /api/purchase-receipts/:id` (Admin/Staff).
- **Đánh Giá (Reviews)**:
  - `POST /api/reviews` (User đăng nhập - gửi đánh giá kèm sao 1-5).
  - `GET /api/reviews/product/:productId` (Public).
  - `GET /api/reviews/admin/all`, `PUT /api/reviews/:id/approve` (Admin duyệt/ẩn đánh giá).
  - `DELETE /api/reviews/:id` (Admin hoặc chủ đánh giá).
- **Bài Viết Blog**: `GET /api/blogs`, `GET /api/blogs/:id` (Public); `POST/PUT/DELETE /api/blogs` (Admin/Staff).
- **Người Dùng**: `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id` (Admin).

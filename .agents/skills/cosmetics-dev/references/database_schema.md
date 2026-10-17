# Sơ Đồ Cơ Sở Dữ Liệu MySQL / TiDB (Database Schema Reference)

Cơ sở dữ liệu: `mypham_db` (MySQL 8.0 / TiDB Cloud Serverless).
Tệp SQL gốc: [`BE/db.sql`](file:///c:/Users/trant/Cosmetics/BE/db.sql).

---

## 1. Danh Sách Tài Khoản Mặc Định (Mật khẩu: `123456`)

| ID | Họ và tên | Email | Mật khẩu (Hash Bcrypt) | Vai trò (`role`) | Số điện thoại |
|:---|:---|:---|:---|:---|:---|
| 1 | Admin Linh | `admin@gmail.com` | `$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2` | `admin` | `0901234567` |
| 2 | Từ Thế V | `v@gmail.com` | `$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2` | `admin` | `0909999999` |
| 3 | Nhân Viên Bán Hàng | `staff@gmail.com` | `$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2` | `staff` | `0902345678` |
| 4 | Khách Hàng Mẫu | `khachhang@gmail.com` | `$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2` | `user` | `0903456789` |
| 5 | Nguyễn Thị Mai | `mai@gmail.com` | `$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2` | `user` | `0904567890` |

---

## 2. Chi Tiết Các Bảng Dữ Liệu

### 2.1 Bảng `users` (Người dùng & Phân quyền)
- `id` (bigint, PK, AI)
- `name` (varchar 100, NOT NULL)
- `email` (varchar 100, NOT NULL, UNIQUE)
- `password` (varchar 255, NOT NULL)
- `phone` (varchar 20)
- `role` (enum: `'user'`, `'admin'`, `'staff'`, DEFAULT `'user'`)
- `is_active` (tinyint, DEFAULT 1)
- `created_at` (timestamp, DEFAULT CURRENT_TIMESTAMP)

### 2.2 Bảng `categories` (Danh mục sản phẩm)
- `id` (bigint, PK, AI)
- `parent_id` (bigint, FK -> `categories.id`, ON DELETE SET NULL)
- `name` (varchar 255, NOT NULL)
- `slug` (varchar 255, NOT NULL, UNIQUE)
- `description` (text)
- `image_url` (varchar 255)

### 2.3 Bảng `brands` (Thương hiệu mỹ phẩm)
- `id` (bigint, PK, AI)
- `name` (varchar 255, NOT NULL)
- `slug` (varchar 255, NOT NULL, UNIQUE)
- `image_url` (varchar 255)
- `description` (text)

### 2.4 Bảng `products` (Sản phẩm gốc)
- `id` (bigint, PK, AI)
- `category_id` (bigint, FK -> `categories.id`)
- `brand_id` (bigint, FK -> `brands.id`)
- `name` (varchar 255, NOT NULL)
- `slug` (varchar 255, NOT NULL, UNIQUE)
- `description` (text)
- `status` (enum: `'active'`, `'hidden'`, DEFAULT `'active'`)
- `created_at` (timestamp, DEFAULT CURRENT_TIMESTAMP)
- `deleted_at` (timestamp, DEFAULT NULL - dùng cho soft delete)

### 2.5 Bảng `product_variants` (Biến thể sản phẩm - Màu/Size/SKU)
- `id` (bigint, PK, AI)
- `product_id` (bigint, FK -> `products.id`, ON DELETE CASCADE)
- `sku` (varchar 100, UNIQUE)
- `variant_name` (varchar 255, ví dụ "50ml", "Tone 21 Sáng Tự Nhiên")
- `price` (decimal 15,2, NOT NULL)
- `stock_quantity` (int, DEFAULT 0)
- `image_url` (varchar 255)

### 2.6 Bảng `product_galleries` (Bộ sưu tập ảnh sản phẩm)
- `id` (bigint, PK, AI)
- `product_id` (bigint, FK -> `products.id`, ON DELETE CASCADE)
- `image_url` (varchar 255, NOT NULL)
- `is_main` (tinyint, DEFAULT 0)
- `sort_order` (int, DEFAULT 0)

### 2.7 Bảng `carts` & `cart_items` (Giỏ hàng)
- **`carts`**:
  - `id` (bigint, PK, AI)
  - `user_id` (bigint, FK -> `users.id`, NULL nếu là khách vãng lai)
  - `session_id` (varchar 100, dùng cho khách vãng lai dựa trên header `x-session-id`)
  - `coupon_id` (bigint, FK -> `coupons.id`)
  - `created_at` (timestamp)
- **`cart_items`**:
  - `id` (bigint, PK, AI)
  - `cart_id` (bigint, FK -> `carts.id`, ON DELETE CASCADE)
  - `variant_id` (bigint, FK -> `product_variants.id`)
  - `quantity` (int, DEFAULT 1)

### 2.8 Bảng `orders` & `order_items` (Đơn đặt hàng)
- **`orders`**:
  - `id` (bigint, PK, AI)
  - `user_id` (bigint, FK -> `users.id`)
  - `order_code` (varchar 50, UNIQUE)
  - `shipping_name`, `shipping_phone`, `shipping_address`, `notes`
  - `shipping_fee` (decimal 15,2)
  - `total_amount` (decimal 15,2)
  - `discount_amount` (decimal 15,2, DEFAULT 0)
  - `final_amount` (decimal 15,2)
  - `coupon_id` (bigint, FK -> `coupons.id`)
  - `status` (enum: `'pending'`, `'processing'`, `'shipped'`, `'completed'`, `'cancelled'`)
  - `created_at` (timestamp)
- **`order_items`**:
  - `id` (bigint, PK, AI)
  - `order_id` (bigint, FK -> `orders.id`, ON DELETE CASCADE)
  - `variant_id` (bigint)
  - `price` (decimal 15,2)
  - `quantity` (int)

### 2.9 Bảng `coupons` & `coupon_user` (Mã giảm giá)
- **`coupons`**:
  - `id` (bigint, PK, AI)
  - `code` (varchar 50, UNIQUE)
  - `type` (enum: `'percentage'`, `'fixed_amount'`)
  - `value` (decimal 15,2)
  - `min_order_value` (decimal 15,2, DEFAULT 0)
  - `max_discount_value` (decimal 15,2)
  - `start_date`, `end_date` (datetime)
  - `total_limit` (int)
  - `used_count` (int, DEFAULT 0)
  - `is_active` (tinyint, DEFAULT 1)
- **`coupon_user`**:
  - `id` (bigint, PK, AI)
  - `coupon_id`, `user_id`, `order_id`
  - UNIQUE(`user_id`, `coupon_id`) ngăn 1 người dùng dùng lặp 1 mã nếu là loại 1 lần.

### 2.10 Bảng `suppliers`, `purchase_receipts`, `purchase_receipt_details` (Nhập hàng & Nhà cung cấp)
- **`suppliers`**:
  - `id` (bigint, PK, AI)
  - `name`, `contact_name`, `address`, `phone`, `email`
  - `status` (varchar 20: `'active'`, `'inactive'`)
  - `note` (text)
- **`purchase_receipts`**:
  - `id` (bigint, PK, AI)
  - `supplier_id` (bigint, FK -> `suppliers.id`)
  - `user_id` (bigint, FK -> `users.id`, người lập phiếu)
  - `note` (text), `created_at`
- **`purchase_receipt_details`**:
  - `id` (bigint, PK, AI)
  - `receipt_id` (bigint, FK -> `purchase_receipts.id`, ON DELETE CASCADE)
  - `variant_id` (bigint, FK -> `product_variants.id`)
  - `quantity` (int)
  - `unit_price` (decimal 15,2, giá nhập từ nhà cung cấp)

### 2.11 Bảng `reviews` (Đánh giá)
- `id` (bigint, PK, AI)
- `user_id` (bigint, FK -> `users.id`)
- `product_id` (bigint, FK -> `products.id`)
- `order_id` (bigint, FK -> `orders.id`, NULLable)
- `rating` (tinyint, CHECK 1-5)
- `comment` (text)
- `is_approved` (tinyint, DEFAULT 0)

### 2.12 Bảng `blogs` (Tin tức & Bài viết)
- `id` (bigint, PK, AI)
- `title`, `slug`, `cover_image`, `content` (longtext)
- `author_id` (bigint, FK -> `users.id`, ON DELETE SET NULL)
- `created_at`

---

## 3. Quy Tắc Khi Thao Tác Cơ Sở Dữ Liệu
1. **TiDB Cloud vs Local MySQL**: Cấu hình tự động nhận diện TiDB qua `host` chứa `tidbcloud.com` và bật SSL `TLSv1.2` (`rejectUnauthorized: false`). Port mặc định TiDB là `4000`, MySQL là `3306`.
2. **Khi thêm/sửa cột**: Cần cập nhật đồng bộ trong `BE/db.sql`, interface TypeScript tương ứng trong `BE/src/interfaces/` và `FE/src/types/index.ts`.
3. **Soft Delete**: `products` có trường `deleted_at`. Khi truy vấn danh sách công khai luôn kèm điều kiện `deleted_at IS NULL AND status = 'active'`.

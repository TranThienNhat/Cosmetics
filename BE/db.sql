CREATE DATABASE IF NOT EXISTS `mypham_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `mypham_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `blogs`;
CREATE TABLE `blogs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `content` longtext NOT NULL,
  `author_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `blogs_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cart_id` bigint NOT NULL,
  `variant_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `cart_id` (`cart_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `coupon_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `carts_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `parent_id` bigint DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `coupon_user`;
CREATE TABLE `coupon_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_coupon` (`user_id`,`coupon_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `coupon_user_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  CONSTRAINT `coupon_user_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `type` enum('percentage','fixed_amount') NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `min_order_value` decimal(15,2) DEFAULT '0.00',
  `max_discount_value` decimal(15,2) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `total_limit` int DEFAULT NULL,
  `used_count` int DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `variant_id` bigint DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `order_code` varchar(50) NOT NULL,
  `shipping_name` varchar(255) NOT NULL,
  `shipping_phone` varchar(20) NOT NULL,
  `shipping_address` text NOT NULL,
  `notes` text,
  `shipping_fee` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) DEFAULT '0.00',
  `final_amount` decimal(15,2) NOT NULL,
  `coupon_id` bigint DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'cod',
  `payment_status` enum('unpaid','paid','refunded') DEFAULT 'unpaid',
  `momo_trans_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','processing','shipped','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `product_galleries`;
CREATE TABLE `product_galleries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `is_main` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_galleries_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE `product_variants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `variant_name` varchar(255) DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `stock_quantity` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint DEFAULT NULL,
  `brand_id` bigint DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `status` enum('active','hidden') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  KEY `brand_id` (`brand_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `purchase_receipt_details`;
CREATE TABLE `purchase_receipt_details` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `receipt_id` bigint NOT NULL,
  `variant_id` bigint NOT NULL COMMENT 'Liên kết đến biến thể cụ thể',
  `quantity` int NOT NULL,
  `unit_price` decimal(15,2) NOT NULL COMMENT 'Giá nhập',
  PRIMARY KEY (`id`),
  KEY `receipt_id` (`receipt_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `purchase_receipt_details_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `purchase_receipts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_receipt_details_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `purchase_receipts`;
CREATE TABLE `purchase_receipts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `supplier_id` bigint NOT NULL COMMENT 'Nhà cung cấp',
  `user_id` bigint NOT NULL COMMENT 'Người lập phiếu/Người nhập hàng',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `purchase_receipts_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `purchase_receipts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `order_id` bigint DEFAULT NULL,
  `rating` tinyint DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'Tên công ty/nhà cung cấp',
  `contact_name` varchar(255) DEFAULT NULL COMMENT 'Người đại diện liên hệ',
  `address` text COMMENT 'Địa chỉ kho/văn phòng',
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active' COMMENT 'active: Đang hợp tác, inactive: Tạm ngưng',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('user','admin', 'staff') DEFAULT 'user',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Bảng sổ địa chỉ nhận hàng của người dùng
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `recipient_name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `address_line` text NOT NULL,
  `province` varchar(100) DEFAULT NULL,
  `ward` varchar(100) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for chat_knowledge_base (AI Chat Memory & Model Fine-tuning Dataset)
-- ----------------------------
DROP TABLE IF EXISTS `chat_knowledge_base`;
CREATE TABLE `chat_knowledge_base` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_query` TEXT NOT NULL,
  `normalized_query` VARCHAR(500) NOT NULL,
  `intent` VARCHAR(100) DEFAULT 'BEAUTY_ADVICE',
  `response` MEDIUMTEXT NOT NULL,
  `suggested_products` JSON DEFAULT NULL,
  `quick_suggestions` JSON DEFAULT NULL,
  `source` VARCHAR(50) DEFAULT 'llm',
  `use_count` INT DEFAULT 1,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_norm_query` (`normalized_query`(255)),
  INDEX `idx_intent` (`intent`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- DỮ LIỆU KHỞI TẠO (SEED DATA) TỪ DUMP (ĐÃ CHUẨN HÓA TRƯỜNG THEO DB.SQL)
-- ============================================================

-- 1. Default sample accounts (Password: 123456)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `is_active`) VALUES
(1, 'Admin Linh', 'admin@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0901234567', 'admin', 1),
(2, 'Nhân Viên Bán Hàng', 'staff@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0902345678', 'staff', 1),
(3, 'Khách Hàng Mẫu', 'khachhang@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0903456789', 'user', 1),
(4, 'Nguyễn Thị Mai', 'mai@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0904567890', 'user', 1)
ON DUPLICATE KEY UPDATE `password`=VALUES(`password`), `role`=VALUES(`role`), `is_active`=1;

-- 2. Brands (Thương hiệu)
INSERT INTO `brands` (`id`, `name`, `slug`, `image_url`, `description`) VALUES
(2, 'L\'Occitane En Provence', 'loccitane-en-provence', '/uploads/brands/brands-1792338413551-361573984.png', 'Khởi nguồn từ những cánh đồng hoa bạt ngàn vùng Provence nước Pháp, L\'Occitane kiên định với triết lý tôn vinh nghệ thuật sống, gìn giữ vẻ đẹp nguyên bản của thiên nhiên thông qua các quy trình chưng cất tinh dầu truyền thống nghiêm ngặt. Hãng cam kết truy xuất nguồn gốc minh bạch của từng thành phần, hợp tác trực tiếp với nông dân địa phương để đảm bảo nguồn nguyên liệu đầu vào như hoa oải hương hay cúc trường sinh luôn đạt độ tinh khiết cao nhất, phục vụ cho quá trình điều chế các sản phẩm an toàn.\r\n\r\n\r\n\r\nMỗi lọ kem dưỡng hay tinh dầu ra đời từ phòng thí nghiệm của L\'Occitane đều chứa đựng câu chuyện về vùng đất Địa Trung Hải đầy nắng gió, các chiết xuất thực vật được giữ trọn vẹn dược tính để nuôi dưỡng làn da từ sâu bên trong. Thay vì chạy theo các xu hướng làm đẹp nhất thời, L\'Occitane tập trung vào trải nghiệm giác quan với kết cấu êm dịu và tầng hương thiên nhiên thư thái, biến quy trình chăm sóc cơ thể thành những phút giây tận hưởng cuộc sống đích thực.'),
(3, ' La Mer', 'la-mer', '/uploads/brands/brands-1792339115215-524262002.jpg', 'Được khai sinh từ hành trình tự chữa lành vết bỏng của Tiến sĩ Max Huber, La Mer đã trở thành huyền thoại trong giới làm đẹp thượng lưu nhờ quy trình lên men sinh học tỉ mỉ kéo dài nhiều tháng trời để tạo ra linh hồn của thương hiệu: Miracle Broth™. Sức hút của hãng không nằm ở các chiến dịch quảng bá rầm rộ, mà xuất phát từ khả năng biến đổi làn da ngoạn mục nhờ nguồn năng lượng tái tạo mạnh mẽ.\r\n\r\n\r\n\r\nCác sản phẩm của La Mer luôn được ví như liều thuốc phục hồi diệu kỳ cho làn da đang chịu tổn thương hoặc lão hóa, nhờ cơ chế cung cấp năng lượng tế bào, làm dịu các kích ứng bề mặt gần như tức thì. Sự xa xỉ của thương hiệu này được định nghĩa bằng thời gian cùng công sức bỏ ra cho việc nghiên cứu, đảm bảo mỗi hũ kem khi đến tay người dùng đều giữ nguyên vẹn hoạt tính sinh học như thời điểm vừa được chiết xuất từ phòng thí nghiệm.'),
(4, 'Dior', 'dior', '/uploads/brands/brands-1792340163565-900956147.png', 'Kế thừa tình yêu thiên nhiên bất tận của nhà sáng lập Christian Dior, thương hiệu này đã xây dựng hệ thống 7 khu vườn Dior Gardens độc quyền nhằm đảm bảo nguồn nguyên liệu hoa hồng Granville, hoa Longoza luôn đạt chất lượng tối ưu cho các nghiên cứu về tế bào gốc. Sự kết hợp giữa khoa học thực vật (floral science) và hiểu biết sâu sắc về cấu trúc da liễu cho phép Dior kiến tạo những giải pháp làm đẹp có khả năng đảo ngược các dấu hiệu lão hóa, đồng thời duy trì sự cân bằng sinh thái trên bề mặt da.\r\n\r\n\r\n\r\nMỗi dòng sản phẩm của Dior đều trải qua quá trình tinh chế công phu để đạt được kết cấu tinh tế, tan chảy trên da và để lại cảm giác mềm mại như những cánh hoa, đồng thời kích thích khả năng tự tái tạo của tế bào từ lớp trung bì. Hãng cũng chú trọng vào việc khôi phục độ đàn hồi và cấu trúc khuôn mặt, hướng đến việc gìn giữ nét thanh xuân bền vững thông qua các hoạt chất năng lượng cao, được chắt lọc từ những loài thực vật có sức sống kiên cường nhất.'),
(5, 'SK-II', 'sk-ii', '/uploads/brands/brands-1792340935288-567208054.png', 'Câu chuyện về SK-II bắt đầu từ một quan sát tình cờ tại nhà máy sản xuất rượu Sake, nơi những người thợ dù đã cao tuổi nhưng đôi bàn tay vẫn mềm mại và căng mịn lạ thường nhờ tiếp xúc thường xuyên với men rượu. Sau nhiều năm nghiên cứu hàng trăm chủng loại nấm men khác nhau, các nhà khoa học đã tìm ra Pitera™ - một chất lỏng trong suốt giàu vitamin, axit amin và khoáng chất có cấu trúc tương đồng kỳ lạ với các yếu tố giữ ẩm tự nhiên (NMF) của làn da con người.\r\n\r\n\r\n\r\nKhác với nhiều thương hiệu chạy theo các hoạt chất hóa học nồng độ cao, SK-II kiên trì với triết lý nuôi dưỡng nền tảng da khỏe mạnh thông qua việc cân bằng độ pH, điều hòa chu trình thay da tự nhiên. Các sản phẩm của hãng hướng tới vẻ đẹp “trong suốt như pha lê”, nơi làn da được thanh lọc, giảm thiểu các đốm nâu và duy trì độ ẩm ổn định bất chấp những tác động khắc nghiệt từ môi trường bên ngoài.'),
(6, 'La Prairie', 'la-prairie', '/uploads/brands/brands-1792341598857-269746762.svg', 'Bắt nguồn từ những phòng khám y tế danh tiếng bên bờ hồ Leman, La Prairie là thương hiệu tiên phong trong lĩnh vực liệu pháp tế bào nhằm kéo dài tuổi thọ và vẻ đẹp của làn da. Thương hiệu Thụy Sĩ này không ngần ngại khai thác những nguyên liệu quý hiếm, đắt đỏ bậc nhất hành tinh như trứng cá tầm (Caviar), vàng hay bạch kim để đưa vào các công thức phức hợp độc quyền, biến mỗi sản phẩm thành một kiệt tác của khoa học trẻ hóa.\r\n\r\nSự xa hoa của La Prairie cũng đi kèm với cam kết mạnh mẽ về khả năng nâng cơ, định hình lại các đường nét khuôn mặt, giải quyết các vấn đề lão hóa ở cấp độ tế bào mà ít sản phẩm thông thường nào chạm tới được. Bao bì của hãng cũng được thiết kế như những tác phẩm nghệ thuật đương đại, chứa đựng bên trong là kết tinh của công nghệ sinh học đỉnh cao, đem đến  trải nghiệm chăm sóc da ở đẳng cấp thượng thừa cho giới thượng lưu.')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `slug`=VALUES(`slug`), `image_url`=VALUES(`image_url`), `description`=VALUES(`description`);

-- 3. Categories (Danh mục sản phẩm)
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`) VALUES
(2, NULL, 'Kem dưỡng', 'kem-duong'),
(3, NULL, 'Dầu tắm', 'dau-tam'),
(4, NULL, 'Son dưỡng', 'son-duong'),
(5, NULL, 'Serum', 'serum'),
(6, NULL, 'Phấn trang điểm', 'phan-trang-diem'),
(7, NULL, 'Nước hoa', 'nuoc-hoa')
ON DUPLICATE KEY UPDATE `parent_id`=VALUES(`parent_id`), `name`=VALUES(`name`), `slug`=VALUES(`slug`);

-- 4. Products (Sản phẩm)
INSERT INTO `products` (`id`, `category_id`, `brand_id`, `name`, `slug`, `description`, `status`, `created_at`, `deleted_at`) VALUES
(4, 2, 2, 'Kem Dưỡng Da Cúc Trường Sinh', 'kem-duong-da-cuc-truong-sinh', 'Kem Dưỡng Da Cúc Trường Sinh L\'OCCITANE Immortelle Divine Youth Cream 50ML\r\n\r\n\r\n1. THÔNG TIN SẢN PHẨM\r\n\r\nThương hiệu: L\'Occitane\r\n\r\nXuất xứ: Pháp\r\n\r\nDung tích: 50ML\r\n\r\nNơi sản xuất: Pháp\r\n\r\nNgày sản xuất: Vui lòng xem trên bao bìa sản phẩm\r\n\r\nHạn sử dụng: 3 năm kể từ ngày sản xuất\r\n\r\nĐơn vị chịu trách nhiệm về hàng hóa: CÔNG TY CỔ PHẦN MỸ PHẨM LOCCITANE EN PROVINCE VIỆT NAM\r\n \r\n\r\n2. CÔNG DỤNG\r\n\r\nCúc Trường Sinh là loài hoa biểu tượng cho sắc đẹp, với sắc vàng rực rỡ được lưu giữ vẹn nguyên, không tàn phai ngay cả khi đã được thu hoạch. L\'Occitane đã khám phá khả năng ngăn ngừa lão hóa đến từ thiên nhiên của Cúc Trường Sinh, giúp làn da rạng rỡ, trông căng đầy sức sống. Với kết cấu kem mỏng nhẹ tựa len Cashmere, sau khi thoa kem sẽ nhanh chóng thấm trên da giúp dưỡng ẩm mịn màng. Sau một thời gian sử dụng sẽ cảm nhận rõ hiệu quả, đẩy lùi 7 dấu hiệu lão hóa như giảm nếp nhăn, cải thiện độ săn chắc và độ đàn hồi tự nhiên cho da, giúp làm mờ đốm nâu, có hiệu quả tương tự Retinol nhưng dịu nhẹ hơn.\r\n\r\nTHÀNH PHẦN NỔI BẬT:\r\n100% Tinh dầu dưỡng Cúc Trường Sinh hữu cơ: Hợp chất chống oxy hoá tự nhiên, giúp ngăn ngừa\r\nlão hóa và bảo vệ da trước tác động từ bên ngoài của môi trường.\r\nChiết xuất Cúc Trường Sinh cô đặc: Mang lại hiệu quả tương tự Retinol nhưng dịu nhẹ hơn, hỗ\r\ntrợ tái cấu trúc da, giúp làm mờ nếp nhăn. Giúp giảm đốm nâu xuất hiện trên da.\r\nChiết xuất Dầu Cúc Trường Sinh: Giàu thành phần Omega 9 & Omega 6 giúp củng cố hàng rào\r\nbảo vệ tự nhiên của da\r\nChiết xuất Nước: giúp bảo vệ da bằng cách bổ sung hoạt chất ngăn ngừa oxy hóa.\r\n\r\n3. ĐỐI TƯỢNG SỬ DỤNG\r\n\r\n- Dành cho mọi làn da', 'active', '2026-10-18 15:49:44', NULL),
(5, 3, 2, 'Dầu Tắm Hạnh Nhân', 'dau-tam-hanh-nhan', 'Dầu tắm Hạnh Nhân \r\n1. THÔNG TIN CHUNG \r\n\r\n- Đơn vị chịu trách nhiệm về hàng hóa: CÔNG TY CỔ PHẦN MỸ PHẨM LOCCITANE EN PROVINCE VIỆT NAM\r\n- Xuất xứ: Pháp\r\n- Thương hiêu: L\'Occitane\r\n- Dung tích: 500ml\r\n- Hạn sử dụng: 3 năm kể từ ngày sản xuất\r\n\r\nĐơn vị chịu trách nhiệm về hàng hóa là CÔNG TY CỔ PHẦN MỸ PHẨM LOCCITANE EN PROVINCE VIỆT NAM\r\n\r\n2. THÀNH PHẦN\r\nVITIS VINIFERA (GRAPE) SEED OIL - TIPA-LAURETH SULFATE - LAURETH-3 - CAPRYLIC/CAPRIC TRIGLYCERIDE - PARFUM/FRAGRANCE - COCAMIDE MEA - PROPYLENE GLYCOL - SORBITAN OLEATE - PRUNUS AMYGDALUS DULCIS (SWEET ALMOND) OIL - CITRUS AURANTIUM BERGAMIA (BERGAMOT) FRUIT OIL - HELIANTHUS ANNUUS (SUNFLOWER) SEED OIL - ROSMARINUS OFFICINALIS (ROSEMARY) LEAF EXTRACT - TOCOPHEROL - AQUA/WATER - LIMONENE - COUMARIN – LINALOOL\r\n\r\n3. ĐỐI TƯỢNG SỬ DỤNG\r\nMọi loại da\r\n\r\n4. CÔNG DỤNG\r\nSản phẩm có kết cấu dạng dầu, khi tiếp xúc với nước sẽ thành dạng sữa, giúp nhẹ nhàng làm sạch cơ thể, xoa dịu làn da. \r\n\r\n5. HƯỚNG DẪN SỬ DỤNG\r\n- Lấy một lượng vừa đủ dầu tắm ra tay hoặc bông tắm, nhẹ nhàng massage lên da dưới vòi nước. Cảm nhận kết cấu dầu mượt mà dần chuyển thành lớp bọt sữa mềm mịn. Sau đó, rửa sạch hoàn toàn với nước.\r\n- Có thể đổ trực tiếp dầu vào bồn tắm để tạo nên một làn nước ngâm thơm ngát, dưỡng da đầy thư giãn.\r\n- Kết hợp với Dầu Dưỡng Thể Hạnh Nhân (Almond Supple Skin Oil) và Kem Dưỡng Ẩm Da Hạnh Nhân (Almond Milk Concentrate) sau đó, hỗ trơ dưỡng da săn chắc và sáng mịn.', 'active', '2026-10-18 15:53:26', NULL),
(6, 2, 3, 'LA MER The Moisturizing Soft Cream - Kem dưỡng ẩm da thường, hỗn hợp', 'la-mer-the-moisturizing-soft-cream-kem-duong-am-da-thuong-hon-hop', 'Được bào chế với các quả cầu dưỡng ẩm siêu nhỏ và Miracle Broth™ giúp làm phẳng sự xuất hiện của các nếp nhăn và lỗ chân lông, đồng thời truyền cho làn da nguồn năng lượng tái tạo từ biển.\r\n\r\n- Cung cấp hydrat hoá sâu giúp chữa lành và mang lại ánh sáng khoẻ mạnh tự nhiên từ bên trong.\r\n\r\n- Làm mờ các khuyết điểm và nếp nhăn trên da.\r\n\r\n- Bảo vệ chống lại căng thẳng và ô nhiễm môi trường cho một vẻ rạng rỡ thuần khiết.\r\n\r\n- Kết cấu mềm mại, mịn màng tuyệt vời nhưng công dụng mạnh mẽ.\r\n\r\n- Dành cho làn da cần điều trị sự khô hạn, nếp nhăn và rãnh gấp, lỗ chân lông to.\r\n\r\nPhù hợp cho mọi loại da, da thường, da hỗn hợp và da khô.\r\n\r\nKhông chứa Paraben, Phthalates, Sulfates, Sulfites.', 'active', '2026-10-18 15:59:54', NULL),
(7, 4, 3, 'LA MER The Lip Volumizer - Son dưỡng làm dày môi', 'la-mer-the-lip-volumizer-son-duong-lam-day-moi', 'Một công thức không chỉ làm đầy và hoàn thiện đôi môi, mà còn giúp bảo vệ chống lại thiệt hại trong tương lai bởi vì làn da môi mỏng manh của chúng ta đặc biệt dễ bị tổn thương bởi các tác nhân gây hại từ môi trường.\r\n\r\nPhương pháp điều trị huyền thoại của La Mer Miracle Broth™ được bào chế với các chất chống oxy hóa giúp bảo vệ đôi môi, ngay lập tức làm đầy đặn và làm rõ các đường nét.\r\n\r\nNuôi dưỡng da môi bằng hydrat hoá chữa lành tự nhiên, mọi vấn đề như khô nẻ sẽ được giải quyết triệt để. \r\n\r\nThành phần nổi bật:\r\n\r\n- Miracle Broth™ - công thức với tảo biển giàu dinh dưỡng và các thành phần nguyên chất khác ngâm da trong khả năng chữa bệnh huyền thoại của biển, giúp hỗ trợ quá trình sửa chữa tự nhiên và độ ẩm cho da.\r\n\r\n- Lime Tea Concentrate: hỗn hợp chống oxy hóa tăng áp này giúp bảo vệ làn da mỏng manh chống lại tác hại của môi trường.\r\n\r\n- Phức hợp tái tạo làm đầy: công thức với các thành phần biển và khoáng chất giàu dinh dưỡng, phức hợp có nguồn gốc biển mạnh này hỗ trợ Collagen tự nhiên và mang lại vẻ trẻ trung đầy đặn.\r\n\r\n*Miracle Broth là \"thần dược\" độc quyền có trong tất cả sản phẩm của La Mer, được pha chế từ tảo biển thu hoạch bằng tay cùng với các chất dinh dưỡng và khoáng chất khác thông qua quá trình lên men tự nhiên. Hỗ trợ năm khía cạnh của sự chữa lành tự nhiên: độ ẩm, tái tạo, làm dịu, làm mịn và rạng rỡ giúp đưa làn da trở lại trạng thái khỏe mạnh nhất.', 'active', '2026-10-18 16:03:08', NULL),
(8, 5, 3, 'LA MER The Concentrate - Tinh chất phục hồi da kích ứng, giảm vết đỏ & mờ sẹo', 'la-mer-the-concentrate-tinh-chat-phuc-hoi-da-kich-ung-giam-vet-do-mo-seo', 'Việc tiếp xúc với các tác nhân gây căng thẳng từ môi trường mỗi ngày như ô nhiễm có thể gây ra viêm nhiễm - nguyên nhân gốc rễ của các dấu hiệu lão hóa da sớm, da dễ kích ứng mẫn cảm, phụ thuộc thời tiết...\r\n\r\nVới lợi ích xây dựng hàng rào và sức mạnh chống oxy hóa mới - The Concentrate là nguồn sức mạnh kép chống lại những gốc tự do và các tác nhân gây kích ứng hàng ngày này.\r\n\r\n- Giúp xây dựng lại và bảo vệ hàng rào tự nhiên của da.\r\n\r\n- Giúp trung hòa các gốc tự do và bảo vệ chống lại ô nhiễm.\r\n\r\nKhi sử dụng hàng ngày, làn da trở nên khỏe hơn, ổn định hơn và được làm dịu rõ rệt.\r\n\r\n*Chỉ sau 14 ngày, hàng rào tự nhiên của da đã được củng cố đáng kể.\r\n\r\n*Miracle Broth là \"thần dược\" độc quyền có trong tất cả sản phẩm của La Mer, được pha chế từ tảo biển thu hoạch bằng tay cùng với các chất dinh dưỡng và khoáng chất khác thông qua quá trình lên men tự nhiên. Hỗ trợ năm khía cạnh của sự chữa lành tự nhiên: độ ẩm, tái tạo, làm dịu, làm mịn và rạng rỡ giúp đưa làn da trở lại trạng thái khỏe mạnh nhất.\r\n\r\nSản xuất tại Nhật Bản', 'active', '2026-10-18 16:06:04', NULL),
(9, 6, 3, 'LA MER The Luminous Lifting Cushion Foundation SPF20 - Phấn nước trang điểm', 'la-mer-the-luminous-lifting-cushion-foundation-spf20-phan-nuoc-trang-diem', 'Phấn nước tạo một lớp màng bảo vệ mỏng giúp giữ ẩm cho da, tạo lớp nền bóng mượt mà không bết dính, mang lại vẻ ngoài rạng rỡ ngay lập tức đồng thời nuôi dưỡng làn da từ bên trong suốt cả ngày.\r\n\r\n- Chống lão hoá, bảo vệ khỏi ô nhiễm môi trường\r\n\r\n- Cung cấp độ ẩm cho cảm giác căng mọng và săn chắc hơn\r\n\r\n- Độ che phủ cực tốt che mọi khuyết điểm từ lỗ chân lông, nếp và rãnh nhăn, sẹo mụn, đến các đốm nâu tối màu... nhưng vẫn mỏng mịn tự nhiên không bị dày nền.\r\n\r\n- Khai thác công nghệ viên nang màu độc đáo giúp truyền tông màu da thật với các sắc tố khác nhau\r\n\r\n- Nâng cơ trẻ hoá da ngay lập tức\r\n\r\n- Độ căng bóng vừa phải, bền bỉ suốt cả ngày không gây khô, xuống tone, đổ dầu và không tạo rãnh nhăn\r\n\r\n- Titanium Dioxide 6,5%: Chất chống nắng bảo vệ da khỏi bức xạ UVA và UVB.\r\n\r\n- Với khả năng dưỡng ẩm phục hồi từ Miracle Broth và công nghệ viên nang màu, giúp da tăng độ sáng - cho vẻ ngoài tươi tắn, đầy đặn với cảm giác căng mọng, săn chắc.\r\n\r\nBao gồm: 1 vỏ có gương, 2 lõi phấn, và 2 bông đánh phấn.\r\n\r\nPhù hợp mọi loại da.\r\n\r\nSản xuất tại Hàn Quốc', 'active', '2026-10-18 16:10:25', NULL),
(10, 7, 4, 'Dior Sauvage Extrait de Parfum - Đẳng Cấp Nhất', 'dior-sauvage-extrait-de-parfum-dang-cap-nhat', 'Nước Hoa Dior Sauvage Extrait là phiên bản đặc biệt thuộc dòng Sauvage đình đám của Dior, được phát triển theo phong cách đậm đặc, mạnh mẽ và sâu sắc hơn. Với cấu trúc hương gỗ sang trọng, oud Việt Nam đóng vai trò trung tâm, kết hợp cùng hoắc hương Indonesia, cỏ hương bài Madagascar và tuyết tùng Virginia, tạo nên một dấu ấn nam tính đầy quyền lực.\r\n\r\nĐược sáng tạo bởi Francis Kurkdjian – Dior Perfume Creative Director, Sauvage Extrait mang đến một cách diễn giải mới của dòng Sauvage: sâu hơn, tối hơn, mạnh mẽ hơn nhưng vẫn giữ được nét tươi mát đặc trưng từ bergamot và lavender Provence. Dior cho biết nước hoa được trưởng thành và ngâm ủ trong 42 ngày, góp phần tạo nên chiều sâu và độ bám lưu hương ấn tượng.\r\n\r\nTầng hương đặc trưng\r\n\r\nHương đầu: Cam Mandarin và Bergamot tạo cảm giác tươi sáng, mạnh mẽ.\r\n\r\nHương giữa: Gỗ đàn hương và các sắc thái cay ấm mang đến chiều sâu nam tính.\r\n\r\nHương cuối: Đậu Tonka và Vanilla tạo cảm giác ấm áp, mượt mà và quyến rũ.\r\n\r\nDior Sauvage Extrait – Phiên Bản Sauvage Đậm Đặc Và Sang Trọng\r\nNếu những phiên bản Sauvage quen thuộc gây ấn tượng bởi sự tươi mát, nam tính và dễ nhận diện, thì Sauvage Extrait đưa DNA Sauvage sang một hướng trưởng thành và sang trọng hơn.\r\n\r\nTâm điểm của phiên bản này là tinh chất oud Việt Nam với sắc thái da thuộc ấm áp, sâu và có phần hoang dã. Bao quanh oud là một tầng hương gỗ tương phản giữa những sắc thái tối, khói của hoắc hương và cỏ hương bài với nét sáng, kem mượt của tuyết tùng Virginia.\r\n\r\nĐây là kiểu nước hoa dành cho người đàn ông muốn tạo ra một dấu ấn riêng biệt, không quá đại trà và có chiều sâu rõ rệt.\r\n\r\nVì sao nên chọn?\r\n\r\nNếu bạn yêu thích dòng Dior Sauvage nhưng muốn tìm một phiên bản sâu sắc, đậm đà và sang trọng hơn, Dior Sauvage Extrait 50ML là một lựa chọn rất đáng chú ý.Một chai nước hoa dành cho người đàn ông không cần quá phô trương nhưng vẫn muốn để lại dấu ấn mạnh mẽ và khác biệt.\r\n\r\nThương hiệu: Dior\r\nXuất xứ : Pháp', 'active', '2026-10-18 16:18:52', NULL),
(11, 7, 4, 'Nước Hoa Miss Dior EDP', 'nuoc-hoa-miss-dior-edp', '- Nước hoa Miss Dior, một sản phẩm nước hoa hoàn hảo được tạo ra để dành riêng cho những phụ nữ trẻ trung, thanh lịch và sống hết mình cho tình yêu. Hương thơm lãng mạn, Miss Dior truyền cảm hứng cho một tình yêu mãnh liệt và ngập tràn niềm vui, hạnh phúc. Chỉ với một chút hương của Miss Dior, người phụ nữ ngay lập tức trở nên duyên dáng và quyến rũ hơn bao giờ hết.\r\n\r\n- Miss Dior Eau De Parfum tỏa hương ra từng bước từng bước một. Lớp hương đầu lướt nhẹ sự quyến rũ tinh tế của hương thơm tươi mát từ trái cây, hương thơm từ nhóm cây cam chanh rồi tới lớp hương thơm hoa cỏ nở rộ, sau đó đến sự sang trọng quý phái của hoắc hương, trước khi kết thúc bằng mùi hương của xạ hương, đây là dấu vết cuối cùng đọng lại trong ký ức của người dùng.\r\n\r\n- Với thiết kế nhẹ nhàng, thanh thoát nhưng vô vùng sang trọng hình hộp chữ nhật bằng thủy tinh trong suốt để lộ rõ phần dung dịch nước hoa màu vàng gỗ. Với nắp chai trong suốt và một dải ruy băng kim loại, mang đến một chút quyến rũ và cá tính, đi kèm với mùi hương tuyệt diệu nước hoa nữ Miss Dior xứng đáng là lọ nước hoa đáng giá hàng đầu, dành cho những phụ nữ thanh lịch và sành điệu. \r\n\r\nMùi hương đặc trưng\r\n\r\nHương đầu: quả quýt\r\n\r\nHương giữa: hoa hồng, hoa nhài\r\n\r\nHương cuối: hoắc hương, xạ hương\r\n\r\nPhong cách: Mãnh Liệt, Nồng Nàn, Quyến Rũ\r\n\r\nXuất xứ: Pháp', 'active', '2026-10-18 16:22:42', NULL),
(12, 2, 5, 'SK-II LXP Ultimate Perfecting Cream - Kem Dưỡng Da Cao Cấp', 'sk-ii-lxp-ultimate-perfecting-cream-kem-duong-da-cao-cap', 'Kem dưỡng da cao cấp SK-II là một trong những dòng mỹ phẩm cao cấp tại Nhật, SK-II đang chiếm lĩnh thị trường với những sản phẩm chứa tinh chất Pitera độc quyền và công nghệ chống lão hóa cực tốt. Pitera là tinh chất hoàn hảo được chiết xuất từ men sake, được biết đến với quyền năng tái tạo tế bào, cho bạn làn da mịn màng và trong suốt như pha lê.\r\n\r\nSK-II LXP Ultimate Perfecting là đỉnh cao và mang lại hiệu quả của tất cả các dòng riêng biệt trước đó. Nó như là sự phối hợp hài hòa để mang lại một làn da với kết cấu vững chắc, khỏe mạnh, căng bóng, mịn màng và trong suốt như pha lê. Tất cả mọi vấn đề da của bạn sẽ được hồi phụ và tái tạo mà chỉ dùng duy nhất một dòng sản phẩm LXP Ultimate Perfecting.\r\n\r\nCác nhà khoa học của SK-II đã phối hợp tìm ra thành phần Centella Asiatice được chiết xuất từ rau má được tìm thấy ở vùng nhiệt đới Trung Mỹ. Centella Asiatice còn được gọi nôm na là “Vitamin X trẻ hóa” có tác dụng tiết ra chất làm đầy, đều màu về mặt da thậm chí đến những vết sẹo li ti do mụn, thâm nám hay do đốt lazer cũng dần được cải thiện.\r\n\r\nChiết xuất từ hoa hồng hoang dã chỉ được thu hoạch vào tháng nam ở vùng thảo nguyên nước Pháp. Hoa hồng là hương thơm thanh lịch và dịu dàng nhất trên Thế Giới sẽ làm cho bạn cảm thấy thư thái hơn.\r\n\r\nNgay cái nhìn đầu tiên đã cho thấy sự khác biệt và độ nhất của SK-II LXP Ultimate Perfecting Cream. Nó được đặc chế từ 15 thành phần với công thức phức hợp siêu độc đáo chỉ khi bạn tìm ra Secret Key II mới hoàn toàn cảm nhận được.\r\n\r\n\r\n\r\nSK-II LXP Ultimate Perfecting Cream giúp dưỡng ẩm sâu suốt 12h, bảo vệ da khỏi các tác động của quá trình lão hóa\r\n\r\nKem Dưỡng da Cao cấp SK-II LXP Ultimate Perfecting Cream ứng dụng công nghệ độc quyền của SK-II với hàm lượng pitera cao cùng các thành phần khoáng chất là chìa khóa làm đẹp cho làn da không tuổi.\r\n\r\nLXP Ultimate Perfecting Cream giúp dưỡng ẩm sâu, bảo vệ da khỏi các tác động của quá trình lão hóa.\r\n\r\nHương thơm hoa hồng sang trọng đem lại cảm giác thư thái,nhẹ nhàng mỗi khi sử dụng.', 'active', '2026-10-18 16:29:18', NULL),
(13, 5, 5, 'SK-II Facial Treatment Serum Bộ Sản Phẩm Dưỡng Da Cao Cấp Từ Nhật Bản', 'sk-ii-facial-treatment-serum-bo-san-pham-duong-da-cao-cap-tu-nhat-ban', 'Bộ Sản Phẩm Dưỡng Da Cao Cấp SK-II Facial Treatment Serum là bộ sản phẩm bản giới hạn được thiết kế dành cho những người mong muốn trải nghiệm trọn vẹn quy trình chăm sóc da của SK-II. Bộ sản phẩm kết hợp các sản phẩm biểu tượng của thương hiệu, giúp cấp ẩm, nuôi dưỡng và cải thiện độ rạng rỡ của làn da, đồng thời mang đến trải nghiệm chăm sóc da toàn diện trong một bộ sản phẩm tiện lợi.\r\n\r\nVới sự kết hợp giữa Facial Treatment Serum, Facial Treatment Essence và SkinPower Renew Cream, bộ sản phẩm hỗ trợ làn da trở nên mềm mại, căng mịn và tươi sáng hơn, đồng thời góp phần cải thiện kết cấu da và duy trì độ ẩm. Đây là lựa chọn phù hợp để trải nghiệm các sản phẩm nổi bật của SK-II hoặc làm quà tặng trong những dịp đặc biệt.\r\n\r\nBộ sản phẩm gồm:\r\n\r\n- Serum Facial Treatment Serum (50ml) NEW: Phiên bản cải tiến đột phá kết hợp cùng các hạt dầu dưỡng siêu nhỏ mang lại làn da căng bóng, săn chắc mướt mịn vô cùng.\r\n\r\n- Nước thần Facial Treatment Essence (30ml): Thần dược chứa hơn 90% Pitera™ giúp tái tạo tế bào, cân bằng độ ẩm và nuôi dưỡng da sáng mịn từ sâu bên trong.\r\n\r\n- Kem dưỡng SK-II SkinPower Renew Cream (15g): Khóa ẩm tuyệt đối, định hình cơ mặt, xóa mờ nếp nhăn và ngăn ngừa lão hóa toàn diện.\r\n\r\nCông dụng:\r\n- Cấp ẩm và duy trì làn da mềm mại, căng mịn.\r\n\r\n- Hỗ trợ cải thiện kết cấu da, giúp da mịn màng và rạng rỡ hơn.\r\n\r\n- Hỗ trợ tăng độ săn chắc và đàn hồi của da.\r\n\r\n- Giúp củng cố hàng rào bảo vệ da, duy trì làn da khỏe mạnh.\r\n\r\n- Hỗ trợ giảm sự xuất hiện của các dấu hiệu lão hóa và mang lại vẻ tươi trẻ cho làn da khi sử dụng đều đặn.\r\n\r\nHướng dẫn sử dụng:\r\nBước 1: Sau khi làm sạch da, thoa SK-II Facial Treatment Essence lên toàn bộ khuôn mặt và vỗ nhẹ để tinh chất thẩm thấu.\r\n\r\nBước 2: Lấy 1–2 lần nhấn SK-II Facial Treatment Serum, thoa đều lên mặt và cổ, massage nhẹ nhàng.\r\n\r\nBước 3: Thoa một lượng vừa đủ SkinPower Renew Cream để khóa ẩm và hoàn thiện quy trình dưỡng da.\r\n\r\nSử dụng 2 lần mỗi ngày, vào buổi sáng và buổi tối.\r\n\r\nBan ngày nên kết hợp kem chống nắng để bảo vệ da toàn diện.', 'active', '2026-10-18 16:32:13', NULL)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `slug`=VALUES(`slug`), `description`=VALUES(`description`), `status`=VALUES(`status`);

-- 5. Product Variants (Biến thể sản phẩm)
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `variant_name`, `price`, `stock_quantity`) VALUES
(6, 4, NULL, '50', 3190000.00, 20),
(7, 5, NULL, '500ml', 1490000.00, 20),
(8, 6, NULL, '30ml', 4350000.00, 20),
(9, 7, NULL, '7ml', 1990000.00, 20),
(10, 8, NULL, '50ml', 9800000.00, 20),
(11, 9, NULL, 'Rosy Ivory', 2950000.00, 20),
(12, 9, NULL, 'Warm Ivory', 2950000.00, 20),
(13, 10, NULL, '50ml', 4999000.00, 20),
(14, 11, NULL, '50ml', 2699000.00, 20),
(15, 11, NULL, '100ml', 3499000.00, 20),
(16, 12, NULL, '50gr', 8800000.00, 20),
(17, 13, NULL, '50ml', 6900000.00, 20)
ON DUPLICATE KEY UPDATE `variant_name`=VALUES(`variant_name`), `price`=VALUES(`price`), `stock_quantity`=VALUES(`stock_quantity`);

-- 6. Product Galleries (Bộ sưu tập ảnh sản phẩm)
INSERT INTO `product_galleries` (`id`, `product_id`, `image_url`, `is_main`) VALUES
(8, 4, '/uploads/products/products-1792338583917-72957000.webp', 1),
(9, 4, '/uploads/products/products-1792338583918-816975668.webp', 0),
(10, 4, '/uploads/products/products-1792338583919-673026256.webp', 0),
(11, 4, '/uploads/products/products-1792338583921-169159214.png', 0),
(12, 4, '/uploads/products/products-1792338583926-50943320.png', 0),
(13, 5, '/uploads/products/products-1792338806218-186112289.webp', 1),
(14, 5, '/uploads/products/products-1792338806219-633950890.webp', 0),
(15, 5, '/uploads/products/products-1792338806219-614622958.webp', 0),
(16, 5, '/uploads/products/products-1792338806220-913693647.webp', 0),
(17, 5, '/uploads/products/products-1792338806221-10364707.webp', 0),
(18, 6, '/uploads/products/products-1792339194315-262137864.png', 1),
(19, 6, '/uploads/products/products-1792339194316-842763194.jpg', 0),
(20, 6, '/uploads/products/products-1792339194319-618370419.png', 0),
(21, 6, '/uploads/products/products-1792339194320-543420525.png', 0),
(22, 6, '/uploads/products/products-1792339194321-131536508.png', 0),
(23, 7, '/uploads/products/products-1792339388393-427018616.png', 1),
(24, 7, '/uploads/products/products-1792339388394-677518711.jpg', 0),
(25, 7, '/uploads/products/products-1792339388394-391097622.jpg', 0),
(26, 7, '/uploads/products/products-1792339388394-284958423.png', 0),
(27, 7, '/uploads/products/products-1792339388395-339051661.png', 0),
(28, 8, '/uploads/products/products-1792339564625-348683629.png', 1),
(29, 8, '/uploads/products/products-1792339564626-686785773.png', 0),
(30, 8, '/uploads/products/products-1792339564630-433832359.png', 0),
(31, 8, '/uploads/products/products-1792339564633-679261139.png', 0),
(32, 8, '/uploads/products/products-1792339564634-187399021.png', 0),
(33, 9, '/uploads/products/products-1792339825013-883828327.png', 1),
(34, 9, '/uploads/products/products-1792339825015-196875215.png', 0),
(35, 9, '/uploads/products/products-1792339825016-528726022.png', 0),
(36, 9, '/uploads/products/products-1792339825018-216540636.jpg', 0),
(37, 9, '/uploads/products/products-1792339825018-139650771.jpg', 0),
(38, 10, '/uploads/products/products-1792340332791-501876029.webp', 1),
(39, 10, '/uploads/products/products-1792340332793-788073979.webp', 0),
(40, 10, '/uploads/products/products-1792340332793-925037819.webp', 0),
(41, 11, '/uploads/products/products-1792340562475-469931646.webp', 1),
(42, 12, '/uploads/products/products-1792340958252-789546029.webp', 1),
(43, 12, '/uploads/products/products-1792340958252-103501589.webp', 0),
(44, 13, '/uploads/products/products-1792341133554-191748605.webp', 1),
(45, 13, '/uploads/products/products-1792341133554-569614140.webp', 0),
(46, 13, '/uploads/products/products-1792341133555-47337136.webp', 0)
ON DUPLICATE KEY UPDATE `image_url`=VALUES(`image_url`), `is_main`=VALUES(`is_main`);

-- 7. Suppliers (Nhà cung cấp)
INSERT INTO `suppliers` (`id`, `name`, `contact_name`, `address`, `phone`, `email`, `status`) VALUES
(2, 'Công ty TNHH Phân Phối Dược Mỹ Phẩm Linh Beauty', 'Nguyễn Văn Tuấn', 'Tầng 5, Tòa nhà Landmark, Q.1, TP.HCM', '0912345678', 'contact@linhbeauty.vn', 'active'),
(3, 'Tổng Kho Mỹ Phẩm Hàn Quốc K-Beauty VN', 'Kim Min Ho', 'Khu chế xuất Tân Thuận, Q.7, TP.HCM', '0987654321', 'supply@kbeauty.vn', 'active'),
(4, 'Công ty TNHH Thời Trang & Mỹ Phẩm Dior Việt Nam', 'Trần Bảo Ngọc', 'Tòa nhà Bitexco, Q.1, TP.HCM', '0908889999', 'orders@diorvn.com', 'active'),
(5, 'Công ty Cổ Phần Mỹ Phẩm L\'Occitane Việt Nam', 'Lê Hoàng Yến', 'Vincom Đồng Khởi, Q.1, TP.HCM', '0918776655', 'supply@loccitane.vn', 'active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `contact_name`=VALUES(`contact_name`), `address`=VALUES(`address`), `phone`=VALUES(`phone`), `email`=VALUES(`email`), `status`=VALUES(`status`);

-- 8. Blogs (Bài viết & Tin tức làm đẹp)
INSERT INTO `blogs` (`id`, `title`, `slug`, `cover_image`, `content`, `author_id`, `created_at`) VALUES
(1, 'Bí Quyết Phục Hồi Làn Da Khô Ráp & Tổn Thương Cùng Tinh Chất Tảo Biển Thần Kỳ', 'bi-quyet-phuc-hoi-da-kho-rap-ton-thuong-tinh-chat-tao-bien', '/uploads/blogs/blog-phuc-hoi-da.png', '<p class=\"lead\">Thời tiết giao mùa hanh khô hay việc tiếp xúc liên tục với môi trường điều hòa khiến hàng rào bảo vệ da tự nhiên bị suy yếu, dẫn đến tình trạng mất nước, bong tróc và xuất hiện nếp nhăn li ti.</p><h3>1. Nguyên nhân khiến làn da mất đi hàng rào ẩm tự nhiên</h3><p>Hàng rào lipid bảo vệ da (Skin Barrier) đóng vai trò như bức tường thành kiên cố giữ nước và ngăn chặn vi khuẩn, tác nhân ô nhiễm xâm nhập. Khi lớp màng này bị tổn thương do tẩy da chết quá đà, dùng sản phẩm treatment nồng độ cao hoặc khí hậu khắc nghiệt, da sẽ trở nên nhạy cảm, dễ mẩn đỏ và xỉn màu rõ rệt.</p><h3>2. Sức mạnh tái sinh từ Miracle Broth™ và Tinh chất Tảo biển</h3><p>Miracle Broth™ - linh hồn trong các dòng sản phẩm phục hồi cao cấp của <strong>La Mer</strong> - được tạo ra qua quá trình lên men sinh học kéo dài từ 3 đến 4 tháng dưới sự tác động của ánh sáng và năng lượng sóng âm thanh. Chiết xuất từ tảo bẹ khổng lồ thu hoạch thủ công tại vùng biển đảo Vancouver mang đến khả năng làm dịu kích ứng tức thì, đẩy nhanh tốc độ tự chữa lành của tế bào da lên gấp 3 lần.</p><h3>3. Quy trình 3 bước phục hồi da chuyên sâu tại nhà</h3><ul><li><strong>Bước 1: Làm sạch dịu nhẹ:</strong> Sử dụng sữa rửa mặt có độ pH chuẩn 5.5, không chứa chất hoạt động bề mặt gốc sulfate.</li><li><strong>Bước 2: Cấp ẩm đa tầng:</strong> Vỗ tinh chất phục hồi (như <em>La Mer The Concentrate</em>) tập trung vào các vùng da đang bị khô rát, ửng đỏ.</li><li><strong>Bước 3: Khóa ẩm màng lipid:</strong> Thoa một lượng kem dưỡng ẩm vừa đủ, làm ấm trên đầu ngón tay trước khi áp đều lên mặt để hoạt chất thẩm thấu tối đa.</li></ul><p>Kiên trì áp dụng đều đặn mỗi tối, chỉ sau 7 đến 14 ngày, bạn sẽ cảm nhận rõ độ đàn hồi, căng bóng và sức sống tươi mới của làn da!</p>', 1, '2026-10-05 09:30:00'),
(2, 'Top 5 Bước Chăm Sóc Da Căng Bóng Chuẩn Pha Lê Cùng Men Rượu Sake Pitera™', 'top-5-buoc-cham-soc-da-cang-bong-pitera', '/uploads/blogs/blog-pitera-sk-ii.png', '<p class=\"lead\">Làn da trong suốt như pha lê (Crystal Clear Skin) luôn là chuẩn mực nhan sắc được phụ nữ Á Đông theo đuổi suốt nhiều thập kỷ qua. Bí mật đằng sau vẻ đẹp không tuổi ấy chính là tinh chất Pitera™ trứ danh từ xứ sở hoa anh đào.</p><h3>1. Truyền thuyết về đôi bàn tay không tuổi của nghệ nhân làm rượu Sake</h3><p>Vào những năm 1970, các nhà nghiên cứu Nhật Bản đã vô cùng kinh ngạc khi thấy các nghệ nhân nấu rượu Sake dù khuôn mặt đã hằn sâu nếp nhăn của thời gian nhưng đôi bàn tay lại luôn mềm mịn, căng mọng tựa thiếu nữ. Từ đó, qua hàng trăm cuộc thử nghiệm trên 350 chủng men khác nhau, tinh chất Pitera™ độc quyền của <strong>SK-II</strong> chính thức ra đời.</p><h3>2. 5 công dụng thần kỳ của Pitera™ đối với tế bào da</h3><ol><li><strong>Điều hòa chu kỳ thay da:</strong> Giúp các tế bào biểu bì chết bong tróc tự nhiên, thúc đẩy lớp tế bào mới sản sinh.</li><li><strong>Cân bằng độ pH và kiểm soát bã nhờn:</strong> Hạn chế tình trạng bóng nhờn vùng chữ T mà vẫn giữ đủ ẩm cho hai bên má.</li><li><strong>Xóa mờ đốm nâu và thâm sạm:</strong> Ức chế quá trình chuyển giao hắc tố melanin lên bề mặt da.</li><li><strong>Tăng cường độ đàn hồi:</strong> Kích thích sản sinh collagen nội sinh, lấp đầy các rãnh nhăn nông.</li><li><strong>Cải thiện kết cấu da:</strong> Thu nhỏ lỗ chân lông và mang lại bề mặt da mượt mà, phản chiếu ánh sáng tự nhiên.</li></ol><h3>3. Mẹo sử dụng Nước Thần SK-II Facial Treatment Essence đạt hiệu quả 200%</h3><p>Đổ khoảng 4-5 giọt tinh chất ra bông cotton mỏng hoặc trực tiếp vào lòng bàn tay. Nhẹ nhàng vỗ đều khắp mặt trong vòng 1 phút theo chiều nâng cơ. Cảm giác mát lành, sảng khoái tức thì sẽ đánh thức mọi giác quan và chuẩn bị bước đệm hoàn hảo cho các bước dưỡng tiếp theo.</p>', 1, '2026-10-09 14:15:00'),
(3, 'Nghệ Thuật Chọn Nước Hoa Pháp: Giải Mã Các Tầng Hương Quyến Rũ Dành Cho Quý Cô', 'nghe-thuat-chon-nuoc-hoa-phap-danh-cho-quy-co', '/uploads/blogs/blog-nuoc-hoa-phap.png', '<p class=\"lead\">Nước hoa không chỉ đơn thuần là một mùi hương, mà là tấm danh thiếp vô hình, khắc họa cá tính, cảm xúc và khí chất riêng biệt của mỗi người phụ nữ.</p><h3>1. Cấu trúc tam giác kim tự tháp hương thơm (Fragrance Pyramid)</h3><p>Mỗi chai nước hoa Haute Parfumerie của Pháp như <strong>Dior</strong> đều được chế tác công phu theo 3 tầng hương biến chuyển theo thời gian:</p><ul><li><strong>Hương đầu (Top Notes):</strong> Tỏa sáng ngay 15 phút đầu tiên sau khi xịt, thường là nhóm hương cam chanh (Citrus) thanh mát hoặc trái cây tươi mọng.</li><li><strong>Hương giữa (Heart/Middle Notes):</strong> Là linh hồn của chai nước hoa, bung tỏa từ phút thứ 20 đến 2 giờ, thường ngập tràn các loài hoa quý như hoa hồng May Rose vùng Grasse hay hoa nhài Sambac.</li><li><strong>Hương cuối (Base Notes):</strong> Lắng đọng sâu sắc suốt 6-12 giờ tiếp theo với hoắc hương, gỗ tuyết tùng Virginia, đậu Tonka và xạ hương trắng ấm áp.</li></ul><h3>2. Miss Dior Eau De Parfum - Bản hòa ca của tình yêu và sự tự do</h3><p>Nếu bạn tìm kiếm một phong thái kiêu kỳ, ngọt ngào nhưng không kém phần quyến rũ, Miss Dior EDP là sự lựa chọn không thể thay thế. Với những nốt hương hoa cỏ rực rỡ đan xen cùng chút nồng nàn của xạ hương, chai nước hoa này như một bó hoa millefiori ngát hương, mang lại niềm hân hoan rạng ngời cho người dùng.</p><h3>3. Vị trí xịt nước hoa giúp lưu hương thơm suốt 24 giờ</h3><p>Hãy ưu tiên xịt tại các điểm có mạch đập: cổ tay, sau gáy, hõm ngực và mặt trong khuỷu tay. Đừng quên xịt một lớp sương mỏng lên tóc hoặc thoa một lớp kem dưỡng không mùi trước khi xịt để giữ các phân tử hương thơm bám lâu hơn trên da.</p>', 2, '2026-10-13 11:00:00'),
(4, 'Liệu Trình Trẻ Hóa & Đẩy Lùi Lão Hóa Sớm Với Chiết Xuất Hoa Cúc Trường Sinh Hữu Cơ', 'lieu-trinh-tre-hoa-day-lui-lao-hoa-cuc-truong-sinh', '/uploads/blogs/blog-cuc-truong-sinh.png', '<p class=\"lead\">Hoa Cúc Trường Sinh (Immortelle) - loài hoa mang sắc vàng rực rỡ không bao giờ tàn phai ngay cả sau khi đã thu hoạch - chính là món quà vô giá mà thiên nhiên đảo Corsica nước Pháp ban tặng cho phái đẹp.</p><h3>1. Giải mã thành phần chống oxy hóa mạnh mẽ gấp 2 lần Vitamin E</h3><p>Được nghiên cứu và phát triển bởi phòng thí nghiệm <strong>L\'Occitane</strong>, tinh dầu hoa Cúc Trường Sinh chứa hàm lượng phân tử hữu cơ siêu nhỏ có khả năng thẩm thấu sâu vào tầng hạ bì. Hoạt chất này kích thích vi tuần hoàn máu, tăng cường tổng hợp collagen lên đến 6 lần và bảo vệ tế bào khỏi tác hại của các gốc tự do gây ra bởi tia cực tím và khói bụi đô thị.</p><h3>2. Giải pháp thay thế Retinol an toàn, êm dịu cho làn da nhạy cảm</h3><p>Retinol hóa học tuy mang lại hiệu quả tái tạo nhanh nhưng lại dễ gây kích ứng, đỏ rát và bong tróc. Chiết xuất Cúc Trường Sinh cô đặc cung cấp khả năng làm mờ nếp nhăn và săn chắc da tương đương Retinol nhưng hoàn toàn lành tính, an toàn cho cả phụ nữ mang thai hoặc người có làn da mẫn cảm nhất.</p><h3>3. Liệu trình kết hợp hoàn hảo sáng và tối</h3><ul><li><strong>Ban ngày:</strong> Sau khi làm sạch, sử dụng Kem Dưỡng Da Cúc Trường Sinh L\'Occitane Immortelle Divine Youth Cream kết hợp cùng kem chống nắng SPF 50+ để tạo lớp khiên bảo vệ toàn diện.</li><li><strong>Ban đêm:</strong> Kết hợp cùng Dầu dưỡng Cúc Trường Sinh, nhẹ nhàng massage theo hướng nâng cơ từ cằm lên thái dương trong 3 phút để thư giãn cơ mặt và tái tạo năng lượng cho ngày mới.</li></ul>', 1, '2026-10-16 16:20:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `slug`=VALUES(`slug`), `cover_image`=VALUES(`cover_image`), `content`=VALUES(`content`), `author_id`=VALUES(`author_id`), `created_at`=VALUES(`created_at`);

-- 9. Coupons (Mã giảm giá)
INSERT INTO `coupons` (`id`, `code`, `type`, `value`, `min_order_value`, `max_discount_value`, `start_date`, `end_date`, `total_limit`, `used_count`, `is_active`) VALUES
(1, 'CHAOBANMOI', 'percentage', 10.00, 500000.00, 150000.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 500, 28, 1),
(2, 'LINHBEAUTY50K', 'fixed_amount', 50000.00, 300000.00, NULL, '2026-06-01 00:00:00', '2026-12-31 23:59:59', 200, 45, 1),
(3, 'VIPLUXURY', 'percentage', 15.00, 2000000.00, 500000.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 100, 12, 1),
(4, 'TRIANKHACHHANG', 'fixed_amount', 100000.00, 1000000.00, NULL, '2026-03-01 00:00:00', '2026-12-31 23:59:59', 150, 30, 1)
ON DUPLICATE KEY UPDATE `code`=VALUES(`code`), `type`=VALUES(`type`), `value`=VALUES(`value`), `min_order_value`=VALUES(`min_order_value`), `max_discount_value`=VALUES(`max_discount_value`), `start_date`=VALUES(`start_date`), `end_date`=VALUES(`end_date`), `total_limit`=VALUES(`total_limit`), `used_count`=VALUES(`used_count`), `is_active`=VALUES(`is_active`);

-- 10. Purchase Receipts & Details (Phiếu nhập hàng)
INSERT INTO `purchase_receipts` (`id`, `supplier_id`, `user_id`, `created_at`, `note`) VALUES
(1, 5, 1, '2026-08-15 09:30:00', 'Nhập lô hàng kem dưỡng Cúc Trường Sinh và dầu tắm Hạnh Nhân đợt 1'),
(2, 2, 2, '2026-08-28 14:15:00', 'Nhập bổ sung bộ sản phẩm La Mer kem dưỡng ẩm mềm và son dưỡng môi'),
(3, 4, 1, '2026-09-05 10:00:00', 'Nhập dòng nước hoa Dior Sauvage Extrait và Miss Dior mùa thu'),
(4, 3, 2, '2026-09-18 11:30:00', 'Nhập mỹ phẩm cao cấp SK-II Nhật Bản chính ngạch'),
(5, 2, 1, '2026-09-29 16:45:00', 'Nhập tinh chất phục hồi La Mer The Concentrate và Cushion trang điểm'),
(6, 5, 2, '2026-10-06 08:30:00', 'Tái nhập kho Dầu tắm Hạnh Nhân và kem Cúc Trường Sinh phục vụ đợt khuyến mãi'),
(7, 4, 1, '2026-10-12 13:20:00', 'Bổ sung gấp nước hoa Miss Dior 50ml và Dior Sauvage phục vụ khách VIP'),
(8, 3, 2, '2026-10-17 15:00:00', 'Nhập kho định kỳ serum SK-II và kem La Mer Soft Cream')
ON DUPLICATE KEY UPDATE `supplier_id`=VALUES(`supplier_id`), `user_id`=VALUES(`user_id`), `created_at`=VALUES(`created_at`), `note`=VALUES(`note`);

INSERT INTO `purchase_receipt_details` (`id`, `receipt_id`, `variant_id`, `quantity`, `unit_price`) VALUES
(1, 1, 6, 30, 2200000.00),
(2, 1, 7, 40, 1050000.00),
(3, 2, 8, 20, 3200000.00),
(4, 2, 9, 35, 1400000.00),
(5, 3, 13, 25, 3800000.00),
(6, 3, 14, 30, 2000000.00),
(7, 3, 15, 20, 2600000.00),
(8, 4, 16, 15, 6800000.00),
(9, 4, 17, 25, 5200000.00),
(10, 5, 10, 15, 7500000.00),
(11, 5, 11, 25, 2100000.00),
(12, 5, 12, 25, 2100000.00),
(13, 6, 7, 50, 1020000.00),
(14, 6, 6, 20, 2180000.00),
(15, 7, 13, 15, 3800000.00),
(16, 7, 14, 20, 2000000.00),
(17, 8, 8, 15, 3200000.00),
(18, 8, 17, 20, 5200000.00)
ON DUPLICATE KEY UPDATE `receipt_id`=VALUES(`receipt_id`), `variant_id`=VALUES(`variant_id`), `quantity`=VALUES(`quantity`), `unit_price`=VALUES(`unit_price`);

SET FOREIGN_KEY_CHECKS = 1;

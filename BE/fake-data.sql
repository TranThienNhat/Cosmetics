USE `mypham_db`;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TRUNCATE OLD DATA
TRUNCATE TABLE `coupon_user`;
TRUNCATE TABLE `cart_items`;
TRUNCATE TABLE `carts`;
TRUNCATE TABLE `order_items`;
TRUNCATE TABLE `reviews`;
TRUNCATE TABLE `orders`;
TRUNCATE TABLE `purchase_receipt_details`;
TRUNCATE TABLE `purchase_receipts`;
TRUNCATE TABLE `product_galleries`;
TRUNCATE TABLE `product_variants`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `brands`;
TRUNCATE TABLE `suppliers`;
TRUNCATE TABLE `coupons`;
TRUNCATE TABLE `blogs`;
TRUNCATE TABLE `users`;

-- 2. USERS (Password: 123456)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `is_active`) VALUES
(1, 'Admin Quản Trị', 'admin@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0901234567', 'admin', 1),
(2, 'Từ Thế V', 'v@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0909999999', 'admin', 1),
(3, 'Nhân Viên Bán Hàng', 'staff@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0902345678', 'staff', 1),
(4, 'Lê Thị Thu Thảo', 'thao@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0903112233', 'staff', 1),
(5, 'Khách Hàng Mẫu', 'khachhang@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0903456789', 'user', 1),
(6, 'Nguyễn Thị Mai', 'mai@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0904567890', 'user', 1),
(7, 'Trần Hoàng Nam', 'nam@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0912345678', 'user', 1),
(8, 'Phạm Minh Anh', 'minhanh@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0987654321', 'user', 1),
(9, 'Đặng Quỳnh Như', 'quynhnhu@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0933221100', 'user', 1),
(10, 'Hoàng Gia Bảo', 'giabao@gmail.com', '$2b$10$7Yjs.WqEgQfXNjX7mtbzVeS4DqVYbWsEaYpVe3c6syZ97JIBZjfV2', '0977889900', 'user', 1);

-- 3. CATEGORIES
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `description`, `image_url`) VALUES
(1, NULL, 'Chăm sóc da mặt', 'cham-soc-da-mat', 'Các dòng sản phẩm chăm sóc, làm sạch và nuôi dưỡng làn da khỏe đẹp', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'),
(2, NULL, 'Trang điểm', 'trang-diem', 'Bộ sưu tập mỹ phẩm trang điểm chuẩn phong cách thời thượng', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80'),
(3, NULL, 'Chăm sóc cơ thể & Tóc', 'cham-soc-co-the-toc', 'Sản phẩm dưỡng thể, tẩy tế bào chết và phục hồi tóc chuyên sâu', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80'),
(4, NULL, 'Nước hoa cao cấp', 'nuoc-hoa-cao-cap', 'Hương thơm quyến rũ, tinh tế dành riêng cho phái đẹp và phái mạnh', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&auto=format&fit=crop&q=80'),
(5, 1, 'Sữa rửa mặt & Tẩy trang', 'sua-rua-mat-tay-trang', 'Làm sạch sâu bụi bẩn, bã nhờn dịu nhẹ cho mọi làn da', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80'),
(6, 1, 'Serum & Tinh chất', 'serum-tinh-chat', 'Đặc trị mụn, mờ thâm nám và tái sinh làn da căng mọng', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80'),
(7, 1, 'Kem dưỡng ẩm & Phục hồi', 'kem-duong-am-phuc-hoi', 'Khóa ẩm, phục hồi hàng rào bảo vệ da chuyên sâu', 'https://images.unsplash.com/photo-1608248597359-26d971553c30?w=500&auto=format&fit=crop&q=80'),
(8, 1, 'Kem chống nắng', 'kem-chong-nang', 'Chống tia UVA, UVB, ánh sáng xanh toàn diện cả ngày dài', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'),
(9, 2, 'Son môi thời thượng', 'son-moi-thoi-thuong', 'Son thỏi, son kem lì màu sắc rạng rỡ lâu trôi', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80'),
(10, 2, 'Cushion & Kem nền', 'cushion-kem-nen', 'Lớp nền tự nhiên, che khuyết điểm hoàn hảo chuẩn mịn lì', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80'),
(11, 2, 'Phấn mắt & Mascara', 'phan-mat-mascara', 'Tạo điểm nhấn đôi mắt hút hồn, mi cong dày tự nhiên', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80'),
(12, 3, 'Sữa tắm & Dưỡng thể', 'sua-tam-duong-the', 'Nuôi dưỡng làn da cơ thể mềm mịn, trắng sáng ngát hương', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80'),
(13, 3, 'Dầu gội & Phục hồi tóc', 'dau-goi-phuc-hoi-toc', 'Dầu gội làm sạch gàu, ngăn gãy rụng và nuôi dưỡng tóc bồng bềnh', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80'),
(14, 4, 'Nước hoa Nữ', 'nuoc-hoa-nu', 'Mùi hương ngọt ngào, kiêu kỳ quyến rũ', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&auto=format&fit=crop&q=80'),
(15, 4, 'Nước hoa Nam', 'nuoc-hoa-nam', 'Hương thơm nam tính, lịch lãm và cuốn hút', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&auto=format&fit=crop&q=80');

-- 4. BRANDS
INSERT INTO `brands` (`id`, `name`, `slug`, `image_url`, `description`) VALUES
(1, 'La Roche-Posay', 'la-roche-posay', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80', 'Dược mỹ phẩm hàng đầu nước Pháp chuyên gia cho làn da nhạy cảm'),
(2, 'Cerave', 'cerave', 'https://images.unsplash.com/photo-1608248597359-26d971553c30?w=400&auto=format&fit=crop&q=80', 'Thương hiệu phát triển bởi các chuyên gia da liễu với công nghệ 3 Ceramide thiết yếu'),
(3, 'Bioderma', 'bioderma', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80', 'Tiên phong trong công nghệ micellar water sinh học bảo vệ làn da'),
(4, 'The Ordinary', 'the-ordinary', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80', 'Thương hiệu chăm sóc da công nghệ cao với bảng thành phần tối giản, hiệu quả vượt trội'),
(5, 'Anessa', 'anessa', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80', 'Nhãn hiệu kem chống nắng số 1 Nhật Bản 21 năm liên tiếp'),
(6, 'MAC Cosmetics', 'mac-cosmetics', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&auto=format&fit=crop&q=80', 'Thương hiệu trang điểm chuyên nghiệp đẳng cấp quốc tế'),
(7, 'Maybelline New York', 'maybelline-new-york', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop&q=80', 'Nhãn hiệu trang điểm hàng đầu thế giới với phong cách New York hiện đại'),
(8, 'Innisfree', 'innisfree', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80', 'Mỹ phẩm thiên nhiên thuần khiết từ hòn đảo ngọc Jeju Hàn Quốc'),
(9, 'Paula\'s Choice', 'paulas-choice', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&auto=format&fit=crop&q=80', 'Thương hiệu chăm sóc da khoa học không hương liệu, dựa trên nghiên cứu thực chứng'),
(10, 'Chanel', 'chanel', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&auto=format&fit=crop&q=80', 'Biểu tượng sang trọng và nước hoa xa xỉ hàng đầu thế giới từ Paris'),
(11, 'Dior', 'dior', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&auto=format&fit=crop&q=80', 'Đẳng cấp nước hoa và mỹ phẩm thượng lưu nước Pháp'),
(12, 'L\'Oréal Paris', 'loreal-paris', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80', 'Thương hiệu làm đẹp toàn cầu mang chất lượng cao cấp đến mọi phụ nữ');

-- 5. SUPPLIERS
INSERT INTO `suppliers` (`id`, `name`, `contact_name`, `address`, `phone`, `email`, `status`, `note`) VALUES
(1, 'Công Ty TNHH L\'Oréal Việt Nam', 'Nguyễn Văn Minh', 'Tầng 10 Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', '02839111222', 'contact.vn@loreal.com', 'active', 'Nhà phân phối chính hãng L\'Oreal, La Roche-Posay, Cerave chiết khấu 25%'),
(2, 'Công Ty Cổ Phần DKSH Việt Nam', 'Phạm Thu Trang', 'Lầu 1 Viettel Complex, 285 Cách Mạng Tháng 8, P.12, Q.10, TP.HCM', '02838167890', 'healthcare.vn@dksh.com', 'active', 'Nhập khẩu và phân phối Bioderma, The Ordinary, Paula\'s Choice'),
(3, 'Công Ty TNHH Mỹ Phẩm Shiseido Việt Nam', 'Trần Nhật Quang', 'Tòa nhà Empress Tower, 138-142 Hai Bà Trưng, Đa Kao, Q.1, TP.HCM', '02838244999', 'info@shiseido.com.vn', 'active', 'Phân phối độc quyền thương hiệu Anessa tại thị trường Việt Nam'),
(4, 'Công Ty Cổ Phần Phân Phối Mỹ Phẩm Quốc Tế Thùy Dung', 'Đỗ Hải Đăng', 'Số 5 Ngõ 379 Hoàng Hoa Thám, Ba Đình, Hà Nội', '02437895678', 'kinhdoanh@tdic.vn', 'active', 'Đại diện phân phối Innisfree, Maybelline, MAC chính ngạch');

-- 6. PRODUCTS
INSERT INTO `products` (`id`, `category_id`, `brand_id`, `name`, `slug`, `description`, `status`) VALUES
(1, 8, 1, 'Kem Chống Nắng La Roche-Posay Anthelios UVMune 400 Oil Control Gel-Cream SPF50+', 'kem-chong-nang-la-roche-posay-anthelios-uvmune-400', 'Kem chống nắng kiểm soát dầu vượt trội suốt 12h với màng lọc phổ rộng độc quyền Mexoryl 400 bảo vệ da khỏi tia UVA dài, ngăn sạm nám và lão hóa sớm.', 'active'),
(2, 5, 3, 'Nước Tẩy Trang Bioderma Sensibio H2O Cho Da Nhạy Cảm Nắp Hồng', 'nuoc-tay-trang-bioderma-sensibio-h2o-nap-hong', 'Công nghệ hạt micellar sinh học làm sạch 99% lớp trang điểm và bụi mịn PM2.5, làm dịu và phục hồi độ ẩm tự nhiên cho da nhạy cảm.', 'active'),
(3, 5, 2, 'Sữa Rửa Mặt CeraVe Foaming Facial Cleanser Cho Da Thường Đến Da Dầu', 'sua-rua-mat-cerave-foaming-facial-cleanser', 'Sữa rửa mặt dạng gel tạo bọt mịn chứa 3 Ceramide thiết yếu, Niacinamide và Hyaluronic Acid giúp làm sạch bã nhờn mà không phá vỡ hàng rào ẩm tự nhiên của da.', 'active'),
(4, 6, 4, 'Tinh Chất The Ordinary Niacinamide 10% + Zinc 1% Giảm Thâm Mụn Kiềm Dầu', 'tinh-chat-the-ordinary-niacinamide-10-zinc-1', 'Serum nổi tiếng toàn cầu giúp cải thiện sắc tố da, làm mờ vết thâm sau mụn, điều tiết tuyến dầu thừa và thu nhỏ lỗ chân lông hiệu quả.', 'active'),
(5, 7, 1, 'Kem Dưỡng Làm Dịu Và Phục Hồi Da La Roche-Posay Cicaplast Baume B5+ Ultra-Repairing', 'kem-duong-la-roche-posay-cicaplast-baume-b5-plus', 'Công thức cải tiến mới với phức hợp Tribioma độc quyền và 5% Panthenol (Vitamin B5), Madecassoside giúp làm dịu tức thì kích ứng, phục hồi da sau 1 giờ.', 'active'),
(6, 8, 5, 'Sữa Chống Nắng Anessa Perfect UV Sunscreen Skincare Milk SPF50+ PA++++', 'sua-chong-nang-anessa-perfect-uv-sunscreen-skincare-milk', 'Chống nắng số 1 Nhật Bản với công nghệ Auto Booster và Aqua Booster EX chống trôi trong nước và mồ hôi tối đa 80 phút, bảo vệ tối ưu kể cả khi vận động ngoài trời.', 'active'),
(7, 6, 9, 'Dung Dịch Tẩy Tế Bào Chết Hóa Học Paula\'s Choice Skin Perfecting 2% BHA Liquid Exfoliant', 'tay-te-bao-chet-paulas-choice-skin-perfecting-2-bha-liquid', 'Dung dịch chứa 2% Salicylic Acid thẩm thấu sâu loại bỏ bã nhờn bít tắc trong lỗ chân lông, làm sạch mụn đầu đen, kháng viêm và làm mịn màng bề mặt da.', 'active'),
(8, 7, 8, 'Kem Dưỡng Ẩm Trà Xanh Cấp Nước Chuyên Sâu Innisfree Green Tea Seed Hyaluronic Cream', 'kem-duong-am-tra-xanh-innisfree-green-tea-seed-hyaluronic', 'Chiết xuất từ lá trà xanh đảo Jeju giàu amino acid kết hợp 5 loại Hyaluronic Acid cấp ẩm sâu, phục hồi độ đàn hồi và tạo lớp màng giữ ẩm căng bóng.', 'active'),
(9, 9, 6, 'Son Thỏi Lì MAC Matte Lipstick Chuẩn Màu Mịn Mượt', 'son-thoi-li-mac-matte-lipstick', 'Thỏi son kinh điển của phái đẹp với chất son lì mịn như nhung, bền màu lên đến 8 tiếng mà không gây khô môi, bảng màu thời thượng tôn mọi tone da.', 'active'),
(10, 10, 7, 'Phấn Nước Kiềm Dầu Maybelline Fit Me Matte + Poreless Oil Control Cushion SPF40', 'phan-nuoc-maybelline-fit-me-matte-poreless-cushion', 'Công nghệ hạt phấn siêu nhỏ hút dầu thừa cho hiệu ứng mịn lì tự nhiên, che phủ khuyết điểm hoàn hảo đến 24 giờ mà nhẹ mặt thông thoáng.', 'active'),
(11, 11, 7, 'Chuốt Mi Dài Cong Tự Nhiên Maybelline Lash Sensational Sky High Waterproof Mascara', 'chuot-mi-maybelline-lash-sensational-sky-high', 'Đầu cọ Flex Tower linh hoạt chạm tới từng sợi mi từ gốc tới ngọn, công thức chống thấm nước đỉnh cao giữ nếp mi cong dài suốt ngày không lem không trôi.', 'active'),
(12, 9, 12, 'Son Kem Lì Mỏng Nhẹ Như Không L\'Oréal Paris Rouge Signature Matte Liquid Lipstick', 'son-kem-li-loreal-rouge-signature-matte-liquid', 'Chất son lỏng mịn tan nhẹ trên môi cho cảm giác nhẹ tênh không bóng dính, bảng màu phong phú sang trọng với sắc tố hạt màu tinh khiết.', 'active'),
(13, 12, 10, 'Gel Tắm Nước Hoa Cao Cấp Chanel Coco Mademoiselle Gel Moussant', 'gel-tam-nuoc-hoa-chanel-coco-mademoiselle', 'Gel tắm mang hương nước hoa Coco Mademoiselle trứ danh lưu hương quyến rũ trên cơ thể, tạo bọt êm ái dưỡng da mềm mịn và rạng rỡ.', 'active'),
(14, 13, 12, 'Dầu Gội Phục Hồi Tóc Hư Tổn Chuyên Sâu L\'Oréal Professionnel Serie Expert Absolut Repair', 'dau-goi-phuc-hoi-loreal-serie-expert-absolut-repair', 'Công nghệ phục hồi với Protein hạt Quinoa vàng làm mượt và củng cố liên kết sợi tóc, giảm gãy rụng và phục hồi mái tóc xơ rối chắc khỏe sáng bóng.', 'active'),
(15, 15, 11, 'Nước Hoa Nam Dior Sauvage Eau De Parfum Quyến Rũ Nam Tính', 'nuoc-hoa-nam-dior-sauvage-eau-de-parfum', 'Nốt hương cam Bergamot tươi mát quyện cùng hoa oải hương, tiêu Tứ Xuyên và hương vani phương Đông nồng ấm tạo nên phong cách nam tính, phong trần bí ẩn.', 'active'),
(16, 14, 10, 'Nước Hoa Nữ Chanel Coco Mademoiselle Eau De Parfum Tinh Tế Sang Trọng', 'nuoc-hoa-nu-chanel-coco-mademoiselle-eau-de-parfum', 'Tuyệt tác hương thơm mang phong thái kiêu kỳ của người phụ nữ tự do, nốt hương cam quýt tươi sáng hòa cùng hoa hồng Thổ Nhĩ Kỳ và hoắc hương gợi cảm.', 'active');

-- 7. PRODUCT VARIANTS
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `variant_name`, `price`, `stock_quantity`, `image_url`) VALUES
(1, 1, 'LRP-SUN-50', 'Tuýp 50ml Tiêu Chuẩn', 475000.00, 150, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'),
(2, 1, 'LRP-SUN-COMBO', 'Combo 2 Tuýp x 50ml (Tiết kiệm)', 890000.00, 60, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'),
(3, 2, 'BIO-PINK-100', 'Chai Nhỏ Du Lịch 100ml', 185000.00, 200, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80'),
(4, 2, 'BIO-PINK-500', 'Chai Lớn Tiết Kiệm 500ml', 465000.00, 180, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80'),
(5, 3, 'CER-CLEAN-236', 'Dung tích 236ml Vòi nhấn', 340000.00, 120, 'https://images.unsplash.com/photo-1608248597359-26d971553c30?w=500&auto=format&fit=crop&q=80'),
(6, 3, 'CER-CLEAN-473', 'Dung tích Lớn 473ml', 495000.00, 95, 'https://images.unsplash.com/photo-1608248597359-26d971553c30?w=500&auto=format&fit=crop&q=80'),
(7, 4, 'TO-NIA-30', 'Lọ 30ml Tiêu Chuẩn', 235000.00, 250, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80'),
(8, 4, 'TO-NIA-60', 'Lọ Lớn 60ml Tiết Kiệm', 395000.00, 130, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80'),
(9, 5, 'LRP-B5-40', 'Tuýp 40ml Tiêu chuẩn', 350000.00, 140, 'https://images.unsplash.com/photo-1608248597359-26d971553c30?w=500&auto=format&fit=crop&q=80'),
(10, 5, 'LRP-B5-100', 'Tuýp Đại 100ml Gia Đình', 590000.00, 85, 'https://images.unsplash.com/photo-1608248597359-26d971553c30?w=500&auto=format&fit=crop&q=80'),
(11, 6, 'ANE-MILK-60', 'Chai Vàng 60ml Chuẩn', 590000.00, 110, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80'),
(12, 7, 'PC-BHA-30', 'Trial Size 30ml Dùng thử', 339000.00, 160, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=500&auto=format&fit=crop&q=80'),
(13, 7, 'PC-BHA-118', 'Full Size 118ml Tiêu Chuẩn', 850000.00, 90, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=500&auto=format&fit=crop&q=80'),
(14, 8, 'INN-GT-50', 'Hũ 50ml Thủy Tinh', 440000.00, 105, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80'),
(15, 9, 'MAC-LIP-CHILI', 'Màu 602 Chili (Đỏ Gạch Thời Thượng)', 580000.00, 75, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80'),
(16, 9, 'MAC-LIP-RUBY', 'Màu 707 Ruby Woo (Đỏ Cổ Điển Tôn Da)', 580000.00, 90, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80'),
(17, 9, 'MAC-LIP-MARR', 'Màu 646 Marrakesh (Cam Đất Ấm Áp)', 580000.00, 65, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80'),
(18, 10, 'MAY-CUSH-115', 'Tone #115 Da Trắng Sáng', 335000.00, 120, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80'),
(19, 10, 'MAY-CUSH-120', 'Tone #120 Da Tự Nhiên', 335000.00, 140, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80'),
(20, 11, 'MAY-MASC-BLK', 'Màu Very Black (Đen Sâu Chống Nước)', 245000.00, 210, 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80'),
(21, 12, 'LOR-LIP-113', 'Màu 113 I Don\'t (Đỏ Cam Trẻ Trung)', 269000.00, 130, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80'),
(22, 12, 'LOR-LIP-129', 'Màu 129 I Lead (Hồng Đất Dịu Dàng)', 269000.00, 115, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80'),
(23, 13, 'CHA-GEL-200', 'Chai 200ml Nắp Vặn', 1650000.00, 45, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80'),
(24, 14, 'LOR-SHAM-300', 'Chai 300ml', 385000.00, 160, 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80'),
(25, 14, 'LOR-SHAM-500', 'Chai Lớn 500ml Kèm Vòi', 560000.00, 95, 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80'),
(26, 15, 'DIOR-SAU-60', 'Chai 60ml Sang Trọng', 2750000.00, 35, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&auto=format&fit=crop&q=80'),
(27, 15, 'DIOR-SAU-100', 'Chai 100ml Đẳng Cấp', 3650000.00, 50, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&auto=format&fit=crop&q=80'),
(28, 16, 'CHA-COCO-50', 'Chai 50ml Tinh Tế', 3350000.00, 40, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&auto=format&fit=crop&q=80'),
(29, 16, 'CHA-COCO-100', 'Chai 100ml Quyến Rũ', 4450000.00, 30, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&auto=format&fit=crop&q=80');

-- 8. PRODUCT GALLERIES
INSERT INTO `product_galleries` (`id`, `product_id`, `image_url`, `is_main`, `sort_order`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80', 1, 0),
(2, 1, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80', 0, 1),
(3, 2, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80', 1, 0),
(4, 2, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80', 0, 1),
(5, 3, 'https://images.unsplash.com/photo-1608248597359-26d971553c30?w=800&auto=format&fit=crop&q=80', 1, 0),
(6, 3, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80', 0, 1),
(7, 4, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80', 1, 0),
(8, 4, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=crop&q=80', 0, 1),
(9, 5, 'https://images.unsplash.com/photo-1608248597359-26d971553c30?w=800&auto=format&fit=crop&q=80', 1, 0),
(10, 6, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80', 1, 0),
(11, 7, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=crop&q=80', 1, 0),
(12, 8, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=80', 1, 0),
(13, 9, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80', 1, 0),
(14, 10, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', 1, 0),
(15, 11, 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80', 1, 0),
(16, 12, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80', 1, 0),
(17, 13, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=80', 1, 0),
(18, 14, 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80', 1, 0),
(19, 15, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop&q=80', 1, 0),
(20, 16, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80', 1, 0);

-- 9. COUPONS
INSERT INTO `coupons` (`id`, `code`, `type`, `value`, `min_order_value`, `max_discount_value`, `start_date`, `end_date`, `total_limit`, `used_count`, `is_active`) VALUES
(1, 'WELCOME10', 'percentage', 10.00, 200000.00, 50000.00, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1000, 15, 1),
(2, 'FREESHIP', 'fixed_amount', 30000.00, 250000.00, NULL, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 500, 28, 1),
(3, 'SALE50K', 'fixed_amount', 50000.00, 500000.00, NULL, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 200, 8, 1),
(4, 'BEAUTYVIP', 'percentage', 15.00, 800000.00, 150000.00, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 100, 3, 1);

-- 10. PURCHASE RECEIPTS & DETAILS
INSERT INTO `purchase_receipts` (`id`, `supplier_id`, `user_id`, `created_at`, `note`) VALUES
(1, 1, 1, '2026-08-10 09:30:00', 'Nhập lô hàng chống nắng và kem dưỡng ẩm phục hồi B5 La Roche-Posay đầu quý'),
(2, 2, 3, '2026-08-25 14:15:00', 'Nhập bổ sung nước tẩy trang Bioderma 500ml và serum The Ordinary Niacinamide'),
(3, 3, 1, '2026-09-05 10:00:00', 'Nhập hàng sữa chống nắng Anessa Gold Milk đợt thu'),
(4, 4, 3, '2026-09-20 16:45:00', 'Nhập mỹ phẩm trang điểm son MAC và cushion Maybelline Fit Me');

INSERT INTO `purchase_receipt_details` (`id`, `receipt_id`, `variant_id`, `quantity`, `unit_price`) VALUES
(1, 1, 1, 100, 320000.00),
(2, 1, 9, 80, 230000.00),
(3, 2, 4, 120, 310000.00),
(4, 2, 7, 150, 155000.00),
(5, 3, 11, 90, 410000.00),
(6, 4, 15, 50, 420000.00),
(7, 4, 16, 60, 420000.00),
(8, 4, 18, 80, 210000.00);

-- 11. ORDERS & ORDER ITEMS
INSERT INTO `orders` (`id`, `user_id`, `order_code`, `shipping_name`, `shipping_phone`, `shipping_address`, `notes`, `shipping_fee`, `total_amount`, `discount_amount`, `final_amount`, `coupon_id`, `status`, `created_at`) VALUES
(1, 5, 'ORD-20260901-001', 'Khách Hàng Mẫu', '0903456789', '120 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM', 'Giao giờ hành chính giúp em', 30000.00, 940000.00, 50000.00, 920000.00, 1, 'completed', '2026-09-01 10:30:00'),
(2, 6, 'ORD-20260905-002', 'Nguyễn Thị Mai', '0904567890', '45 Hoàng Diệu, Phường 12, Quận 4, TP.HCM', 'Gọi trước khi giao 15 phút', 30000.00, 700000.00, 30000.00, 700000.00, 2, 'completed', '2026-09-05 14:15:00'),
(3, 7, 'ORD-20260912-003', 'Trần Hoàng Nam', '0912345678', '88 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', 'Hàng dễ vỡ xin nhẹ tay', 35000.00, 2750000.00, 100000.00, 2685000.00, 4, 'completed', '2026-09-12 09:00:00'),
(4, 8, 'ORD-20260918-004', 'Phạm Minh Anh', '0987654321', '25 Lê Duẩn, Hải Châu, Đà Nẵng', 'Giao tại quầy lễ tân tòa nhà', 30000.00, 580000.00, 0.00, 610000.00, NULL, 'completed', '2026-09-18 16:20:00'),
(5, 9, 'ORD-20260922-005', 'Đặng Quỳnh Như', '0933221100', '152 Nguyễn Trãi, Phường 3, Quận 5, TP.HCM', 'Đóng gói quà tặng xinh giúp mình nhé', 30000.00, 850000.00, 50000.00, 830000.00, 3, 'shipped', '2026-09-22 11:45:00'),
(6, 10, 'ORD-20260925-006', 'Hoàng Gia Bảo', '0977889900', '210 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội', '', 30000.00, 475000.00, 0.00, 505000.00, NULL, 'processing', '2026-09-25 15:10:00'),
(7, 5, 'ORD-20260928-007', 'Khách Hàng Mẫu', '0903456789', '120 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM', 'Lần trước dùng hợp nên mua lại', 30000.00, 1030000.00, 50000.00, 1010000.00, 1, 'pending', '2026-09-28 08:30:00'),
(8, 6, 'ORD-20260929-008', 'Nguyễn Thị Mai', '0904567890', '45 Hoàng Diệu, Phường 12, Quận 4, TP.HCM', 'Đặt nhầm số lượng, muốn hủy đơn này', 30000.00, 465000.00, 0.00, 495000.00, NULL, 'cancelled', '2026-09-29 13:00:00');

INSERT INTO `order_items` (`id`, `order_id`, `variant_id`, `price`, `quantity`) VALUES
(1, 1, 1, 475000.00, 1),
(2, 1, 4, 465000.00, 1),
(3, 2, 5, 340000.00, 1),
(4, 2, 9, 350000.00, 1),
(5, 3, 26, 2750000.00, 1),
(6, 4, 16, 580000.00, 1),
(7, 5, 13, 850000.00, 1),
(8, 6, 1, 475000.00, 1),
(9, 7, 7, 235000.00, 2),
(10, 7, 24, 385000.00, 1),
(11, 7, 20, 245000.00, 1),
(12, 8, 4, 465000.00, 1);

INSERT INTO `coupon_user` (`coupon_id`, `user_id`, `order_id`, `used_at`) VALUES
(1, 5, 1, '2026-09-01 10:30:00'),
(2, 6, 2, '2026-09-05 14:15:00'),
(4, 7, 3, '2026-09-12 09:00:00'),
(3, 9, 5, '2026-09-22 11:45:00');

-- 12. SHOPPING CARTS
INSERT INTO `carts` (`id`, `user_id`, `session_id`, `coupon_id`, `created_at`) VALUES
(1, 5, 'sess_khachhang_001', 1, NOW()),
(2, 6, 'sess_mai_002', NULL, NOW());

INSERT INTO `cart_items` (`id`, `cart_id`, `variant_id`, `quantity`) VALUES
(1, 1, 1, 1),
(2, 1, 15, 1),
(3, 2, 7, 2);

-- 13. REVIEWS
INSERT INTO `reviews` (`id`, `user_id`, `product_id`, `order_id`, `rating`, `comment`, `is_approved`, `created_at`) VALUES
(1, 5, 1, 1, 5, 'Chất kem mỏng nhẹ thấm cực kỳ nhanh, không để lại bất kỳ vệt trắng hay cảm giác bết dính. Mình da dầu dùng em này cả ngày vẫn khô thoáng, kiềm dầu cực kỳ ưng ý!', 1, '2026-09-04 11:20:00'),
(2, 5, 2, 1, 5, 'Tẩy trang siêu lành tính, nước trong vắt không cay mắt tí nào mà son lì hay mascara trôi sạch trơn. Chai 500ml xài nửa năm mới hết, rất đáng đồng tiền!', 1, '2026-09-04 11:25:00'),
(3, 6, 3, 2, 5, 'Sữa rửa mặt dạng gel nhẹ nhàng, bọt mịn êm dịu, sau khi rửa xong da vẫn giữ được độ ẩm mịn màng mướt mát chứ không hề bị căng rát kin kít.', 1, '2026-09-08 09:15:00'),
(4, 6, 5, 2, 5, 'Tuýp kem cứu tinh cho những ngày treatment hoặc peel da bị khô tróc. Bôi một lớp mỏng qua đêm là sáng hôm sau da dịu hẳn các vết đỏ rát, phục hồi thần thánh!', 1, '2026-09-08 09:20:00'),
(5, 7, 15, 3, 5, 'Mùi hương Dior Sauvage quá cuốn hút và nam tính. Độ bám tỏa cực kỳ lâu trên 8 tiếng, đi làm hay đi tiệc ai cũng khen mùi thơm sang.', 1, '2026-09-15 15:40:00'),
(6, 8, 9, 4, 5, 'Màu son MAC Chili đỏ gạch siêu tôn da và làm trắng răng! Đánh lòng môi hay full môi đều xuất sắc, không hề kén da tí nào.', 1, '2026-09-20 18:30:00'),
(7, 9, 7, 5, 5, 'BHA 2% của Paula Choice giúp đẩy sạch mụn ẩn ở trán và 2 bên cánh mũi. Dùng kiên trì 3 tuần da mịn màng và lỗ chân lông thu nhỏ thấy rõ.', 1, '2026-09-26 14:10:00'),
(8, 10, 4, NULL, 5, 'Serum The Ordinary Niacinamide này kiềm dầu đỉnh cao, các vết thâm sau mụn mờ đi đáng kể sau khoảng 2 tuần sử dụng liên tục.', 1, '2026-09-27 20:00:00');

-- 14. BLOGS
INSERT INTO `blogs` (`id`, `title`, `slug`, `cover_image`, `content`, `author_id`, `created_at`) VALUES
(1, 'Top 5 Kem Chống Nắng Kiểm Soát Dầu Vượt Trội Dành Cho Da Dầu Mụn', 'top-5-kem-chong-nang-kiem-soat-dau-cho-da-dau-mun', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80', '<p>Làn da dầu mụn trong thời tiết khí hậu nhiệt đới gió mùa tại Việt Nam luôn đòi hỏi một loại kem chống nắng có kết cấu mỏng nhẹ, khả năng thẩm thấu nhanh và không gây bít tắc lỗ chân lông. Trong bài viết này, chúng tôi cùng các chuyên gia da liễu sẽ phân tích và xếp hạng top 5 dòng kem chống nắng kiềm dầu đỉnh cao nhất hiện nay:</p><h3>1. La Roche-Posay Anthelios UVMune 400 Oil Control</h3><p>Với công nghệ độc quyền màng lọc Mexoryl 400 cùng hoạt chất Airlicium kiểm soát bã nhờn suốt 12 tiếng, đây là lựa chọn hàng đầu cho bạn gái sở hữu làn da siêu dầu.</p><h3>2. Anessa Perfect UV Sunscreen Skincare Milk</h3><p>Công nghệ cảm biến mồ hôi và nước độc quyền từ Nhật Bản, kết cấu sữa mỏng nhẹ tênh như không thoa kem.</p>', 1, '2026-09-02 08:30:00'),
(2, 'Bí Quyết Phục Hồi Hàng Rào Bảo Vệ Da Sau Treatment và Peel Chuyên Sâu', 'bi-quyet-phuc-hoi-hang-rao-bao-ve-da-sau-treatment', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80', '<p>Khi sử dụng các hoạt chất treatment nồng độ cao như Retinol, Tretinoin, AHA hoặc BHA, hàng rào lipid tự nhiên của da rất dễ bị tổn thương, dẫn đến hiện tượng đỏ rát, bong tróc hoặc kích ứng. Để giúp làn da tái sinh khỏe mạnh, việc bổ sung các thành phần sau là cốt lõi:</p><ul><li><strong>Ceramides:</strong> Xi măng sinh học kết nối các tế bào sừng, ngăn ngừa mất nước qua biểu bì.</li><li><strong>Vitamin B5 (Panthenol):</strong> Làm dịu cảm giác nóng rát tức thì và thúc đẩy tái sinh tế bào mới.</li><li><strong>Madecassoside (Chiết xuất rau má):</strong> Giảm kích ứng và ngăn ngừa thâm sẹo sau viêm.</li></ul>', 1, '2026-09-10 10:15:00'),
(3, 'Bảng Màu Son MAC Thời Thượng - Cách Chọn Tone Màu Tôn Da Cho Phụ Nữ Á Đông', 'bang-mau-son-mac-thoi-thuong-cach-chon-tone-mau-ton-da', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80', '<p>Son môi chính là vũ khí quyền lực nhất giúp nâng tầm thần thái của người phụ nữ chỉ trong vài giây. Tuy nhiên, chọn đúng sắc độ phù hợp với undertone da châu Á là điều không phải ai cũng nắm rõ.</p><p>Các chuyên gia trang điểm khuyên rằng những sắc son chứa ánh đỏ đất, đỏ gạch hoặc cam cháy như <strong>MAC Chili 602</strong> hay <strong>MAC Marrakesh 646</strong> sẽ giúp trung hòa sắc tố vàng của làn da, mang lại vẻ ngoài rạng rỡ và hàm răng trắng sáng nổi bật.</p>', 3, '2026-09-19 14:00:00'),
(4, 'Quy Trình Skincare Buổi Sáng Chuẩn Chỉnh Chỉ Trong 4 Bước Cơ Bản', 'quy-trinh-skincare-buoi-sang-chuan-chinh-4-buoc', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80', '<p>Buổi sáng bận rộn không đồng nghĩa với việc bạn bỏ qua các bước chăm sóc da quan trọng. Hãy tinh giản quy trình dưỡng da sáng với 4 bước vàng:</p><ol><li><strong>Làm sạch dịu nhẹ:</strong> Loại bỏ dầu thừa và tàn dư kem dưỡng ban đêm bằng sữa rửa mặt pH cân bằng 5.5.</li><li><strong>Cấp ẩm mỏng nhẹ:</strong> Sử dụng serum Hyaluronic Acid hoặc Niacinamide để tạo lớp nền ngậm nước.</li><li><strong>Khóa ẩm vừa đủ:</strong> Một lớp gel dưỡng mỏng nhẹ giúp giữ ẩm mà không gây nặng mặt.</li><li><strong>Kem chống nắng (Bắt buộc):</strong> Thoa đủ 2 ngón tay kem chống nắng trước khi ra ngoài 20 phút.</li></ol>', 1, '2026-09-24 09:20:00');

SET FOREIGN_KEY_CHECKS = 1;

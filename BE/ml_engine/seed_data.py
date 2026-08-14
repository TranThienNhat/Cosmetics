import random
from datetime import datetime, timedelta
from db_helper import get_db_connection

# Pre-hashed bcrypt for '123456'
HASHED_123456 = "$2b$10$75Jb0l8mRszjU1WlQ3eM9exR65gRk0vYgI2uV1h7Wk8hL8yYv6jC6"

def seed_full_cosmetics_store():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Check / Seed Admin & Users
            cursor.execute("SELECT COUNT(*) as cnt FROM users")
            if cursor.fetchone()['cnt'] == 0:
                print("Seeding Users & Admin...")
                hashed_pw = HASHED_123456
                
                users_data = [
                    ("Admin Linh", "admin@gmail.com", hashed_pw, "0901234567", "admin"),
                    ("Nhân Viên Bán Hàng", "staff@gmail.com", hashed_pw, "0902345678", "staff"),
                    ("Nguyễn Thị Mai", "mai.nguyen@gmail.com", hashed_pw, "0903456789", "user"),
                    ("Trần Hương Giang", "huonggiang@gmail.com", hashed_pw, "0904567890", "user"),
                    ("Lê Thu Thảo", "thuthao@gmail.com", hashed_pw, "0905678901", "user"),
                    ("Phạm Minh Anh", "minhanh@gmail.com", hashed_pw, "0906789012", "user"),
                ]
                for name, email, pw, phone, role in users_data:
                    cursor.execute("""
                        INSERT INTO users (name, email, password, phone, role, is_active)
                        VALUES (%s, %s, %s, %s, %s, 1)
                    """, (name, email, pw, phone, role))

            # 2. Check / Seed Categories
            cursor.execute("SELECT COUNT(*) as cnt FROM categories")
            if cursor.fetchone()['cnt'] == 0:
                print("Seeding Categories...")
                categories = [
                    ("Chăm sóc da (Skincare)", "cham-soc-da", "Các dòng sản phẩm dưỡng da mặt chuyên sâu, phục hồi và cấp ẩm.", "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500"),
                    ("Serum & Tinh chất", "serum-tinh-chat", "Tinh chất dưỡng trắng, mờ thâm nám và chống lão hóa.", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500"),
                    ("Kem chống nắng", "kem-chong-nang", "Bảo vệ làn da trước tia UVA/UVB với màng lọc phổ rộng tiên tiến.", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500"),
                    ("Son môi & Trang điểm", "son-moi-trang-diem", "Bộ sưu tập son kem lì, son dưỡng và phấn phủ cao cấp.", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500"),
                    ("Làm sạch & Tẩy trang", "lam-sach-tay-trang", "Nước tẩy trang dịu nhẹ và sữa rửa mặt tạo bọt sạch sâu.", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500"),
                ]
                for name, slug, desc, img in categories:
                    cursor.execute("""
                        INSERT INTO categories (name, slug, description, image_url)
                        VALUES (%s, %s, %s, %s)
                    """, (name, slug, desc, img))

            # 3. Check / Seed Brands
            cursor.execute("SELECT COUNT(*) as cnt FROM brands")
            if cursor.fetchone()['cnt'] == 0:
                print("Seeding Brands...")
                brands = [
                    ("La Roche-Posay", "la-roche-posay", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200", "Thương hiệu dược mỹ phẩm hàng đầu từ Pháp dành cho da nhạy cảm."),
                    ("The Ordinary", "the-ordinary", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200", "Mỹ phẩm chăm sóc da với bảng thành phần tối giản và hiệu quả cao."),
                    ("Anessa", "anessa", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200", "Thương hiệu chống nắng số 1 Nhật Bản thuộc tập đoàn Shiseido."),
                    ("MAC Cosmetics", "mac-cosmetics", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200", "Đỉnh cao trang điểm chuyên nghiệp từ New York."),
                    ("Innisfree", "innisfree", "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200", "Mỹ phẩm thiên nhiên từ đảo ngọc Jeju Hàn Quốc."),
                    ("Paula's Choice", "paulas-choice", "https://images.unsplash.com/photo-1608248597359-009d17d5ce39?w=200", "Dược mỹ phẩm hàng đầu Hoa Kỳ về BHA & Niacinamide.")
                ]
                for name, slug, img, desc in brands:
                    cursor.execute("""
                        INSERT INTO brands (name, slug, image_url, description)
                        VALUES (%s, %s, %s, %s)
                    """, (name, slug, img, desc))

            # 4. Check / Seed Suppliers
            cursor.execute("SELECT COUNT(*) as cnt FROM suppliers")
            if cursor.fetchone()['cnt'] == 0:
                print("Seeding Suppliers...")
                suppliers = [
                    ("Công ty TNHH Phân Phối Dược Mỹ Phẩm Linh Beauty", "Nguyễn Văn Tuấn", "Tầng 5, Tòa nhà Landmark, Q.1, TP.HCM", "0912345678", "contact@linhbeauty.vn", "active", "Nhà phân phối độc quyền dòng dược mỹ phẩm Pháp & Nhật"),
                    ("Tổng Kho Mỹ Phẩm Hàn Quốc K-Beauty VN", "Kim Min Ho", "Khu chế xuất Tân Thuận, Q.7, TP.HCM", "0987654321", "supply@kbeauty.vn", "active", "Chiết khấu đại lý cấp 1 25%")
                ]
                for name, contact, addr, phone, email, st, note in suppliers:
                    cursor.execute("""
                        INSERT INTO suppliers (name, contact_name, address, phone, email, status, note)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (name, contact, addr, phone, email, st, note))

            # 5. Check / Seed Products & Variants & Galleries
            cursor.execute("SELECT COUNT(*) as cnt FROM products")
            if cursor.fetchone()['cnt'] == 0:
                print("Seeding Products, Variants & Galleries...")
                # Fetch categories & brands map
                cursor.execute("SELECT id, slug FROM categories")
                cat_map = {row['slug']: row['id'] for row in cursor.fetchall()}
                cursor.execute("SELECT id, slug FROM brands")
                brand_map = {row['slug']: row['id'] for row in cursor.fetchall()}

                products_data = [
                    {
                        "name": "Serum Phục Hồi Da La Roche-Posay Hyalu B5 30ml",
                        "slug": "serum-la-roche-posay-hyalu-b5",
                        "cat_slug": "serum-tinh-chat",
                        "brand_slug": "la-roche-posay",
                        "desc": "Serum dưỡng ẩm chuyên sâu, tái tạo hàng rào bảo vệ da với Hyaluronic Acid và Vitamin B5.",
                        "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600",
                        "variants": [
                            ("SKU-LRP-B5-30", "Chai 30ml tiêu chuẩn", 850000, 45),
                            ("SKU-LRP-B5-50", "Chai 50ml tiết kiệm", 1250000, 20)
                        ]
                    },
                    {
                        "name": "Kem Chống Nắng Anessa Perfect UV Sunscreen Skincare Milk SPF50+ PA++++",
                        "slug": "kem-chong-nang-anessa-perfect-uv-milk",
                        "cat_slug": "kem-chong-nang",
                        "brand_slug": "anessa",
                        "desc": "Sữa chống nắng kiềm dầu, kháng nước mồ hôi công nghệ Auto Booster đỉnh cao.",
                        "image": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600",
                        "variants": [
                            ("SKU-ANE-60ML", "Chai 60ml", 580000, 35),
                            ("SKU-ANE-20ML", "Tuýp Mini 20ml", 230000, 50)
                        ]
                    },
                    {
                        "name": "Nước Tẩy Trang La Roche-Posay Micellar Water Ultra Cho Da Nhạy Cảm",
                        "slug": "nuoc-tay-trang-la-roche-posay-micellar-water",
                        "cat_slug": "lam-sach-tay-trang",
                        "brand_slug": "la-roche-posay",
                        "desc": "Nước tẩy trang làm sạch 99% bụi mịn và lớp makeup mà không gây khô rát.",
                        "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
                        "variants": [
                            ("SKU-LRP-TT-400", "Chai 400ml", 435000, 60),
                            ("SKU-LRP-TT-200", "Chai 200ml", 280000, 40)
                        ]
                    },
                    {
                        "name": "Tinh Chất The Ordinary Niacinamide 10% + Zinc 1% Kiềm Dầu Mờ Thâm",
                        "slug": "tinh-chat-the-ordinary-niacinamide-zinc",
                        "cat_slug": "serum-tinh-chat",
                        "brand_slug": "the-ordinary",
                        "desc": "Serum kiềm dầu số 1 thế giới, thu nhỏ lỗ chân lông và làm sáng da.",
                        "image": "https://images.unsplash.com/photo-1608248597359-009d17d5ce39?w=600",
                        "variants": [
                            ("SKU-TO-NIA-30", "Chai 30ml", 240000, 15), # Low stock for test alert
                            ("SKU-TO-NIA-60", "Chai 60ml", 420000, 5)
                        ]
                    },
                    {
                        "name": "Son Thỏi Lì MAC Matte Lipstick Retro Matte 3g",
                        "slug": "son-thoi-li-mac-matte-lipstick",
                        "cat_slug": "son-moi-trang-diem",
                        "brand_slug": "mac-cosmetics",
                        "desc": "Dòng son kinh điển của MAC với độ chuẩn màu cực cao, lâu trôi suốt 10 tiếng.",
                        "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600",
                        "variants": [
                            ("SKU-MAC-RUBYWOO", "Màu Ruby Woo - Đỏ Cổ Điển", 560000, 30),
                            ("SKU-MAC-CHILI", "Màu Chili - Đỏ Gạch Nổi Bật", 560000, 25),
                            ("SKU-MAC-MARRAKESH", "Màu Marrakesh - Đỏ Nâu", 560000, 18)
                        ]
                    },
                    {
                        "name": "Kem Dưỡng Ẩm Phục Hồi Da Innisfree Green Tea Seed Cream 50ml",
                        "slug": "kem-duong-am-innisfree-green-tea-seed-cream",
                        "cat_slug": "cham-soc-da",
                        "brand_slug": "innisfree",
                        "desc": "Kem dưỡng chiết xuất mầm trà xanh hữu cơ cấp nước tức thì cho làn da căng mọng.",
                        "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600",
                        "variants": [
                            ("SKU-INNI-GT-50", "Hũ 50ml", 480000, 40)
                        ]
                    },
                    {
                        "name": "Dung Dịch Tẩy Tế Bào Chết Paula's Choice Skin Perfecting 2% BHA Liquid 118ml",
                        "slug": "tay-te-bao-chet-paulas-choice-2-bha-liquid",
                        "cat_slug": "cham-soc-da",
                        "brand_slug": "paulas-choice",
                        "desc": "BHA 2% giúp làm sạch sâu lỗ chân lông, đẩy lùi mụn ẩn và mụn đầu đen.",
                        "image": "https://images.unsplash.com/photo-1567928815114-1e0e85dc4109?w=600",
                        "variants": [
                            ("SKU-PC-BHA-118", "Chai 118ml Fullsize", 890000, 25),
                            ("SKU-PC-BHA-30", "Chai 30ml Trial", 310000, 30)
                        ]
                    }
                ]

                for p in products_data:
                    cat_id = cat_map.get(p['cat_slug'], 1)
                    brand_id = brand_map.get(p['brand_slug'], 1)
                    cursor.execute("""
                        INSERT INTO products (category_id, brand_id, name, slug, description, status)
                        VALUES (%s, %s, %s, %s, %s, 'active')
                    """, (cat_id, brand_id, p['name'], p['slug'], p['desc']))
                    prod_id = cursor.lastrowid

                    # Main image gallery
                    cursor.execute("""
                        INSERT INTO product_galleries (product_id, image_url, is_main, sort_order)
                        VALUES (%s, %s, 1, 0)
                    """, (prod_id, p['image']))

                    # Variants
                    for sku, vname, price, stock in p['variants']:
                        cursor.execute("""
                            INSERT INTO product_variants (product_id, sku, variant_name, price, stock_quantity, image_url)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (prod_id, sku, vname, price, stock, p['image']))

            conn.commit()

            # 6. Seed Realistic Orders & Order Items
            cursor.execute("SELECT COUNT(*) as cnt FROM orders")
            curr_orders = cursor.fetchone()['cnt']
            if curr_orders < 150:
                print("Seeding 280+ realistic cosmetics transactions...")
                cursor.execute("""
                    SELECT p.id as product_id, p.name as product_name,
                           pv.id as variant_id, pv.price
                    FROM products p
                    JOIN product_variants pv ON p.id = pv.product_id
                """)
                all_variants = cursor.fetchall()
                
                cursor.execute("SELECT id FROM users")
                u_rows = cursor.fetchall()
                if not u_rows:
                    cursor.execute("INSERT INTO users (name, email, password, role) VALUES ('Khách Hàng Test', 'test@gmail.com', %s, 'user')", (HASHED_123456,))
                    user_ids = [cursor.lastrowid]
                else:
                    user_ids = [u['id'] for u in u_rows]

                # Map product -> list of variants
                p_to_vars = {}
                for v in all_variants:
                    p_to_vars.setdefault(v['product_id'], []).append(v)
                
                p_ids = list(p_to_vars.keys())

                # Skincare natural combo patterns for Apriori mining:
                # Combo A: Tẩy trang + Serum B5 + Kem chống nắng (Skincare full routine)
                # Combo B: The Ordinary Niacinamide + Paula's Choice BHA (Acne treatment duo)
                # Combo C: Son MAC + Kem chống nắng Anessa (Daily glam duo)
                # Combo D: Serum B5 + Innisfree Green Tea Cream (Hydration power pack)
                defined_combos = []
                if len(p_ids) >= 6:
                    defined_combos = [
                        [p_ids[0], p_ids[1], p_ids[2]], # B5 + Anessa + Tẩy trang
                        [p_ids[3], p_ids[6]],          # Niacinamide + BHA
                        [p_ids[4], p_ids[1]],          # Son MAC + Anessa
                        [p_ids[0], p_ids[5]],          # B5 + Innisfree
                    ]

                today = datetime.now()
                total_to_seed = 280

                for i in range(total_to_seed):
                    # Distribute across last 110 days with weekend/evening growth trend
                    days_back = int(random.triangular(0, 110, 20)) # skewed towards recent days
                    order_date = today - timedelta(
                        days=days_back,
                        hours=random.randint(7, 23),
                        minutes=random.randint(0, 59)
                    )

                    is_weekend = order_date.weekday() >= 5
                    user_id = random.choice(user_ids)
                    order_code = f"ORD{order_date.strftime('%y%m%d')}{i+1000:04d}"
                    shipping_name = f"Khách Hàng {i+1}"
                    shipping_phone = f"09{random.randint(10000000, 99999999)}"
                    shipping_address = random.choice([
                        "123 Nguyễn Huệ, Quận 1, TP.HCM",
                        "45 Lê Lợi, Quận 1, TP.HCM",
                        "78 Cầu Giấy, Hà Nội",
                        "12 Trần Phú, Hải Châu, Đà Nẵng",
                        "56 Quang Trung, Gò Vấp, TP.HCM",
                        "89 Hoàng Hoa Thám, Ba Đình, Hà Nội",
                        "24 Hai Bà Trưng, TP. Cần Thơ"
                    ])
                    shipping_fee = 30000.00
                    status = random.choices(
                        ['completed', 'completed', 'completed', 'completed', 'shipped', 'processing', 'cancelled'],
                        weights=[75, 10, 5, 4, 3, 2, 1]
                    )[0]

                    chosen_vars = []
                    # 45% chance to buy predefined combo
                    if defined_combos and random.random() < 0.45:
                        combo = random.choice(defined_combos)
                        for pid in combo:
                            if pid in p_to_vars:
                                chosen_vars.append(random.choice(p_to_vars[pid]))
                    else:
                        k = random.choices([1, 2, 3], weights=[50, 35, 15])[0]
                        chosen_pids = random.sample(p_ids, min(k, len(p_ids)))
                        for pid in chosen_pids:
                            chosen_vars.append(random.choice(p_to_vars[pid]))

                    if not chosen_vars:
                        continue

                    total_amt = 0.0
                    items_data = []
                    for v in chosen_vars:
                        qty = random.choices([1, 2, 3], weights=[85, 12, 3])[0]
                        price = float(v['price'])
                        total_amt += price * qty
                        items_data.append((v['variant_id'], price, qty))

                    discount = 0.0
                    if total_amt > 600000 and random.random() < 0.35:
                        discount = float(random.choice([30000, 50000, 70000]))

                    final_amt = max(0.0, total_amt + shipping_fee - discount)

                    cursor.execute("""
                        INSERT INTO orders (
                            user_id, order_code, shipping_name, shipping_phone, shipping_address,
                            shipping_fee, total_amount, discount_amount, final_amount, status, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        user_id, order_code, shipping_name, shipping_phone, shipping_address,
                        shipping_fee, total_amt, discount, final_amt, status, order_date
                    ))
                    order_id = cursor.lastrowid

                    for var_id, price, qty in items_data:
                        cursor.execute("""
                            INSERT INTO order_items (order_id, variant_id, price, quantity)
                            VALUES (%s, %s, %s, %s)
                        """, (order_id, var_id, price, qty))

                conn.commit()
                print(f"Successfully populated store and generated {total_to_seed} orders for ML models!")

    finally:
        conn.close()

if __name__ == '__main__':
    seed_full_cosmetics_store()

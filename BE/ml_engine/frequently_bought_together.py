import sys
import json
import pandas as pd
from db_helper import get_db_connection
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

# Force UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def analyze_frequently_bought_together(target_product_id=None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Fetch all completed/valid order transactions
            tx_query = """
                SELECT 
                    oi.order_id,
                    p.id as product_id,
                    p.name as product_name,
                    p.category_id,
                    c.name as category_name,
                    (SELECT image_url FROM product_galleries WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image,
                    MIN(pv.price) as min_price,
                    MIN(pv.id) as default_variant_id
                FROM order_items oi
                JOIN product_variants pv ON oi.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status IN ('completed', 'processing', 'shipped', 'pending')
                GROUP BY oi.order_id, p.id, p.name, p.category_id, c.name
            """
            cursor.execute(tx_query)
            tx_df = pd.DataFrame(cursor.fetchall())

            # 2. Fetch all active products for reference / fallback
            all_prod_query = """
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    p.category_id,
                    c.name as category_name,
                    (SELECT image_url FROM product_galleries WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image,
                    MIN(pv.price) as min_price,
                    MIN(pv.id) as default_variant_id,
                    COALESCE(SUM(pv.stock_quantity), 0) as total_stock
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN product_variants pv ON p.id = pv.product_id
                WHERE p.status = 'active'
                GROUP BY p.id, p.name, p.category_id, c.name
            """
            cursor.execute(all_prod_query)
            all_prods_df = pd.DataFrame(cursor.fetchall())
    finally:
        conn.close()

    if all_prods_df.empty:
        return {"success": False, "message": "Không có sản phẩm nào trong hệ thống."}

    # Build product dictionary for quick lookup
    product_dict = {}
    for _, row in all_prods_df.iterrows():
        pid = int(row['product_id'])
        product_dict[pid] = {
            "productId": pid,
            "productName": row['product_name'],
            "categoryId": int(row['category_id']) if row['category_id'] else None,
            "categoryName": row['category_name'] or "Mỹ phẩm",
            "imageUrl": row['main_image'] or "",
            "price": float(row['min_price']) if row['min_price'] is not None else 0.0,
            "defaultVariantId": int(row['default_variant_id']) if row['default_variant_id'] else None,
            "stock": int(row['total_stock'])
        }

    # Group transactions by order_id
    transactions = []
    if not tx_df.empty:
        order_groups = tx_df.groupby('order_id')['product_id'].apply(lambda s: list(set(s.tolist())))
        transactions = [list(items) for items in order_groups if len(items) >= 2]

    rules_list = []
    co_occurrence_scores = {}

    if len(transactions) >= 5:
        try:
            te = TransactionEncoder()
            te_ary = te.fit(transactions).transform(transactions)
            df_encoded = pd.DataFrame(te_ary, columns=te.columns_)

            # Frequent itemsets with min_support
            frequent_itemsets = apriori(df_encoded, min_support=0.03, use_colnames=True)
            
            if not frequent_itemsets.empty:
                # Association rules with min_threshold
                rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
                
                for _, r in rules.iterrows():
                    antecedents = [int(x) for x in list(r['antecedents'])]
                    consequents = [int(x) for x in list(r['consequents'])]
                    
                    if len(antecedents) == 1 and len(consequents) == 1:
                        a_id = antecedents[0]
                        c_id = consequents[0]
                        
                        if a_id in product_dict and c_id in product_dict:
                            rule_obj = {
                                "antecedent": product_dict[a_id],
                                "consequent": product_dict[c_id],
                                "support": round(float(r['support']) * 100, 2),
                                "confidence": round(float(r['confidence']) * 100, 2),
                                "lift": round(float(r['lift']), 2)
                            }
                            rules_list.append(rule_obj)
                            
                            # Record co-occurrence score
                            if a_id not in co_occurrence_scores:
                                co_occurrence_scores[a_id] = {}
                            co_occurrence_scores[a_id][c_id] = float(r['lift']) * float(r['confidence'])
        except Exception as e:
            pass

    # Sort rules by lift and confidence
    rules_list.sort(key=lambda x: (x['lift'], x['confidence']), reverse=True)

    # Function to get recommendation for a given product ID
    def get_bundle_for_product(pid):
        main_prod = product_dict.get(pid)
        if not main_prod:
            return None

        recommended_items = []
        added_ids = {pid}

        # 1. From Apriori / Co-occurrence scores
        if pid in co_occurrence_scores:
            sorted_candidates = sorted(co_occurrence_scores[pid].items(), key=lambda x: x[1], reverse=True)
            for c_id, _ in sorted_candidates:
                if c_id in product_dict and c_id not in added_ids and product_dict[c_id]['stock'] > 0:
                    recommended_items.append(product_dict[c_id])
                    added_ids.add(c_id)
                if len(recommended_items) >= 2:
                    break

        # 2. Complementary fallback from other categories if < 2 recommendations
        if len(recommended_items) < 2:
            main_cat = main_prod['categoryId']
            # Find products in different categories
            for other_id, other_p in product_dict.items():
                if other_id not in added_ids and other_p['categoryId'] != main_cat and other_p['stock'] > 0:
                    recommended_items.append(other_p)
                    added_ids.add(other_id)
                if len(recommended_items) >= 2:
                    break

        # 3. Fallback to any remaining active product
        if len(recommended_items) < 2:
            for other_id, other_p in product_dict.items():
                if other_id not in added_ids and other_p['stock'] > 0:
                    recommended_items.append(other_p)
                    added_ids.add(other_id)
                if len(recommended_items) >= 2:
                    break

        # Calculate combo pricing
        all_bundle_items = [main_prod] + recommended_items
        original_combo_price = sum(item['price'] for item in all_bundle_items)
        bundle_discount_percent = 10 # 10% discount for buying full combo
        discount_amount = original_combo_price * (bundle_discount_percent / 100.0)
        combo_price = original_combo_price - discount_amount

        return {
            "mainProduct": main_prod,
            "recommendedItems": recommended_items,
            "bundleSummary": {
                "originalPrice": round(original_combo_price, 2),
                "discountPercent": bundle_discount_percent,
                "discountAmount": round(discount_amount, 2),
                "comboPrice": round(combo_price, 2),
                "totalItems": len(all_bundle_items)
            }
        }

    target_bundle = None
    if target_product_id:
        target_bundle = get_bundle_for_product(int(target_product_id))

    return {
        "success": True,
        "algorithm": "Apriori Association Rules & Co-occurrence Mining",
        "totalTransactions": len(transactions),
        "totalRulesFound": len(rules_list),
        "topRules": rules_list[:15],
        "targetBundle": target_bundle
    }

if __name__ == '__main__':
    target_id = sys.argv[1] if len(sys.argv) > 1 else None
    result = analyze_frequently_bought_together(target_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))

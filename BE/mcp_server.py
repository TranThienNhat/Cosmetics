#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cosmetics AI Intelligence MCP Server
Exposes Database, Machine Learning Forecasting, Inventory Management, and Product Search tools via standard Model Context Protocol (Stdio JSON-RPC).
"""

import sys
import json
import os
import io

# Ensure UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

# Add ml_engine to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(CURRENT_DIR)

from ml_engine.db_helper import get_db_connection

TOOLS = [
    {
        "name": "get_store_metrics",
        "description": "Lấy tổng quan chỉ số kinh doanh mỹ phẩm (Tổng doanh thu, tổng đơn hàng, số lượng khách, tổng sản phẩm và cảnh báo hết hàng)",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "predict_revenue_ml",
        "description": "Chạy mô hình Random Forest Regressor dự báo doanh thu tương lai (7, 14, 30 hoặc 60 ngày)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "days": {
                    "type": "integer",
                    "description": "Số ngày cần dự báo (7, 14, 30, 60)",
                    "default": 14
                }
            }
        }
    },
    {
        "name": "get_inventory_health",
        "description": "Kiểm tra tình trạng sức khỏe tồn kho, phát hiện các sản phẩm có nguy cơ hết hàng và số lượng đề xuất nhập thêm",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "get_fbt_combos",
        "description": "Khai phá luật kết hợp Apriori tìm các combo sản phẩm mỹ phẩm thường xuyên được mua cùng nhau với chiết khấu gợi ý",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "integer",
                    "description": "Mã sản phẩm cụ thể cần tìm combo (tùy chọn)"
                }
            }
        }
    },
    {
        "name": "search_cosmetic_products",
        "description": "Tìm kiếm tra cứu sản phẩm mỹ phẩm theo từ khóa, danh mục hoặc thương hiệu kèm giá và số lượng tồn",
        "inputSchema": {
            "type": "object",
            "properties": {
                "keyword": {
                    "type": "string",
                    "description": "Từ khóa tìm kiếm (tên sản phẩm, thương hiệu, thành phần)"
                },
                "category": {
                    "type": "string",
                    "description": "Tên danh mục cần lọc"
                }
            }
        }
    }
]

def handle_get_store_metrics():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Revenue & Orders
    c.execute("""
        SELECT 
            COUNT(id) as total_orders,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COUNT(DISTINCT user_id) as total_customers
        FROM orders 
        WHERE status != 'cancelled'
    """)
    sales = c.fetchone() or {}
    
    # Products & Stock
    c.execute("SELECT COUNT(id) as total_products FROM products")
    products = c.fetchone() or {}
    
    # Critical Low Stock
    c.execute("""
        SELECT p.name, pv.sku, pv.stock_quantity as stock 
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE pv.stock_quantity <= 10
        ORDER BY pv.stock_quantity ASC
        LIMIT 5
    """)
    low_stock = c.fetchall()
    
    conn.close()
    return {
        "salesSummary": {
            "totalRevenue": float(sales.get("total_revenue", 0)),
            "totalOrders": sales.get("total_orders", 0),
            "totalCustomers": sales.get("total_customers", 0),
            "totalProducts": products.get("total_products", 0)
        },
        "lowStockAlerts": low_stock
    }

def handle_predict_revenue(days=14):
    try:
        from ml_engine.revenue_forecasting import run_revenue_forecasting
        return run_revenue_forecasting(future_days=days)
    except Exception as e:
        return {"error": str(e)}

def handle_inventory_health():
    try:
        from ml_engine.demand_forecasting import run_demand_forecasting
        return run_demand_forecasting()
    except Exception as e:
        return {"error": str(e)}

def handle_fbt_combos(product_id=None):
    try:
        from ml_engine.frequently_bought_together import run_frequently_bought_together
        return run_frequently_bought_together(target_product_id=product_id)
    except Exception as e:
        return {"error": str(e)}

def handle_search_products(keyword=None, category=None):
    conn = get_db_connection()
    c = conn.cursor()
    
    query = """
        SELECT p.id, p.name, p.slug, b.name as brand_name, cat.name as category_name,
               MIN(pv.price) as min_price, MAX(pv.price) as max_price,
               SUM(pv.stock_quantity) as total_stock
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories cat ON cat.id = p.category_id
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        WHERE 1=1
    """
    params = []
    if keyword:
        query += " AND (p.name LIKE %s OR p.description LIKE %s OR b.name LIKE %s)"
        k = f"%{keyword}%"
        params.extend([k, k, k])
    if category:
        query += " AND cat.name LIKE %s"
        params.append(f"%{category}%")
        
    query += " GROUP BY p.id, p.name, p.slug, b.name, cat.name LIMIT 20"
    
    c.execute(query, tuple(params))
    rows = c.fetchall()
    conn.close()
    return {"products": rows, "count": len(rows)}

def process_request(request):
    req_id = request.get("id")
    method = request.get("method")
    params = request.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "cosmetics-ai-mcp",
                    "version": "1.0.0"
                }
            }
        }
        
    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": TOOLS
            }
        }
        
    elif method == "tools/call":
        name = params.get("name")
        arguments = params.get("arguments", {})
        
        try:
            if name == "get_store_metrics":
                res = handle_get_store_metrics()
            elif name == "predict_revenue_ml":
                days = arguments.get("days", 14)
                res = handle_predict_revenue(days)
            elif name == "get_inventory_health":
                res = handle_inventory_health()
            elif name == "get_fbt_combos":
                pid = arguments.get("product_id")
                res = handle_fbt_combos(pid)
            elif name == "search_cosmetic_products":
                kw = arguments.get("keyword")
                cat = arguments.get("category")
                res = handle_search_products(kw, cat)
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": f"Tool '{name}' not found"}
                }
                
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(res, ensure_ascii=False, indent=2)
                        }
                    ]
                }
            }
        except Exception as err:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "isError": True,
                    "content": [
                        {
                            "type": "text",
                            "text": f"Error executing tool {name}: {str(err)}"
                        }
                    ]
                }
            }
            
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method '{method}' not found"}
    }

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = process_request(req)
            sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {str(e)}"}
            }
            sys.stdout.write(json.dumps(err_resp, ensure_ascii=False) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()

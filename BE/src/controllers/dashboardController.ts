import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import pool from "../config/db";

export const getFilteredDashboardStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { year, month, startDate, endDate } = req.query;

    const connection = await pool.getConnection();
    try {
      // 1. Xây dựng điều kiện lọc thời gian (Where Clause)
      let dateCondition = "1=1"; 
      let orderParams: any[] = [];
      
      // Định dạng nhóm thời gian cho biểu đồ (Mặc định là nhóm theo tháng)
      let chartGroupFormat = "'%Y-%m'"; 

      if (startDate && endDate) {
        dateCondition += " AND created_at >= ? AND created_at <= ?";
        orderParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
        // Nếu lọc khoảng thời gian cụ thể -> Vẽ chart theo Từng Ngày
        chartGroupFormat = "'%Y-%m-%d'"; 
      } 
      else if (year && month) {
        dateCondition += " AND YEAR(created_at) = ? AND MONTH(created_at) = ?";
        orderParams.push(Number(year), Number(month));
        // Nếu lọc theo tháng -> Vẽ chart theo Từng Ngày trong tháng
        chartGroupFormat = "'%Y-%m-%d'";
      } 
      else if (year) {
        dateCondition += " AND YEAR(created_at) = ?";
        orderParams.push(Number(year));
        // Nếu lọc theo năm -> Vẽ chart theo Từng Tháng trong năm
        chartGroupFormat = "'%Y-%m'";
      }

      // 2. Thống kê Overview (Tổng quan)
      const overviewQuery = `
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN final_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as total_cancelled
        FROM orders 
        WHERE ${dateCondition}
      `;
      const [overviewResult]: any = await connection.query(overviewQuery, orderParams);
      
      const totalOrders = overviewResult[0].total_orders;
      const totalRevenue = parseFloat(overviewResult[0].total_revenue);
      const totalCancelled = overviewResult[0].total_cancelled;
      const cancelRate = totalOrders > 0 ? parseFloat(((totalCancelled / totalOrders) * 100).toFixed(2)) : 0;

      // ---------------------------------------------------------
      // 3. DỮ LIỆU VẼ BIỂU ĐỒ ĐƯỜNG/CỘT (Doanh thu & Số đơn theo thời gian)
      // ---------------------------------------------------------
      const chartDataQuery = `
        SELECT 
          DATE_FORMAT(created_at, ${chartGroupFormat}) as label,
          COUNT(*) as total_orders,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN final_amount ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_orders
        FROM orders
        WHERE ${dateCondition}
        GROUP BY label
        ORDER BY label ASC
      `;
      const [revenueChartData]: any = await connection.query(chartDataQuery, orderParams);

      // ---------------------------------------------------------
      // 4. DỮ LIỆU VẼ BIỂU ĐỒ TRÒN (Tỷ lệ trạng thái đơn hàng)
      // ---------------------------------------------------------
      const orderStatusQuery = `
        SELECT 
          status as label, 
          COUNT(*) as value
        FROM orders
        WHERE ${dateCondition}
        GROUP BY status
      `;
      const [orderStatusChart]: any = await connection.query(orderStatusQuery, orderParams);

      // 5. Top sản phẩm bán chạy (áp dụng bộ lọc thời gian theo order)
      const topProductsQuery = `
        SELECT 
          p.id, 
          p.name, 
          SUM(oi.quantity) as sold_qty,
          SUM(oi.price * oi.quantity) as total_sales
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed' AND ${dateCondition.replace(/created_at/g, 'o.created_at')}
        GROUP BY p.id, p.name
        ORDER BY sold_qty DESC
        LIMIT 10
      `;
      const [topProducts]: any = await connection.query(topProductsQuery, orderParams);

      // 6. Sản phẩm tồn kho (Kho hiện tại - Không phụ thuộc thời gian lọc)
      const inventoryQuery = `
        SELECT 
          p.id, 
          p.name, 
          COALESCE(SUM(pv.stock_quantity), 0) as total_stock
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        WHERE p.status = 'active'
        GROUP BY p.id, p.name
        ORDER BY total_stock DESC
        LIMIT 20
      `;
      const [inventoryProducts]: any = await connection.query(inventoryQuery);

      return res.json({
        message: "Lấy thống kê dashboard thành công",
        filters: { year, month, startDate, endDate },
        data: {
          overview: {
            totalOrders,
            totalRevenue,
            cancelRate,
            totalCancelled
          },
          charts: {
            revenueChartData, // Array dùng cho Line Chart / Bar Chart
            orderStatusChart  // Array dùng cho Pie Chart / Donut Chart
          },
          topProducts,
          inventoryProducts
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

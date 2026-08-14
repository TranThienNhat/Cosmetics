import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import pool from "../config/db";

export const getFilteredDashboardStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { year, month, startDate, endDate, start_date, end_date, filter } = req.query as any;

    const connection = await pool.getConnection();
    try {
      // 1. Xây dựng điều kiện lọc thời gian (Where Clause)
      let dateCondition = "1=1"; 
      let orderParams: any[] = [];
      let chartGroupFormat = "'%d/%m'"; 

      const effectiveStartDate = startDate || start_date;
      const effectiveEndDate = endDate || end_date;

      if (filter === "current_month" || (!filter && !year && !month && !effectiveStartDate && !effectiveEndDate)) {
        // Mặc định hoặc Tháng hiện tại -> Lọc theo tháng và năm hiện tại, vẽ theo từng ngày
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        dateCondition += " AND YEAR(created_at) = ? AND MONTH(created_at) = ?";
        orderParams.push(currentYear, currentMonth);
        chartGroupFormat = "'%d/%m'";
      } 
      else if (effectiveStartDate && effectiveEndDate) {
        // Khoảng ngày cụ thể -> Lọc từ ngày A đến ngày B, vẽ theo từng ngày
        dateCondition += " AND created_at >= ? AND created_at <= ?";
        orderParams.push(`${effectiveStartDate} 00:00:00`, `${effectiveEndDate} 23:59:59`);
        chartGroupFormat = "'%d/%m'"; 
      } 
      else if (year && month) {
        // Lọc tháng cụ thể
        dateCondition += " AND YEAR(created_at) = ? AND MONTH(created_at) = ?";
        orderParams.push(Number(year), Number(month));
        chartGroupFormat = "'%d/%m'";
      } 
      else if (year || filter === "year") {
        // Lọc theo năm -> Vẽ theo 12 tháng
        const filterYear = Number(year) || new Date().getFullYear();
        dateCondition += " AND YEAR(created_at) = ?";
        orderParams.push(filterYear);
        chartGroupFormat = "'Tháng %m'";
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
        ORDER BY MIN(created_at) ASC
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
        filters: { year, month, startDate: effectiveStartDate, endDate: effectiveEndDate, filter },
        data: {
          overview: {
            totalOrders,
            totalRevenue,
            cancelRate,
            totalCancelled
          },
          charts: {
            revenueChartData,
            orderStatusChart
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

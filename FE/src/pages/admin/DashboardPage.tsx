import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Button,
  DatePicker,
  Space,
  Select,
  ConfigProvider,
  message,
} from "antd";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
  SyncOutlined,
  FileExcelOutlined, // <- Import thêm icon Excel
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/helpers";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardData {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    cancelRate: string;
    totalCancelled: number;
  };
  charts: {
    revenueChartData: any[];
    orderStatusChart: any[];
  };
  topProducts: any[];
  inventoryProducts: any[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#DDBEA9",
  processing: "#CB997E",
  shipped: "#A5A58D",
  completed: "#BC8F8F",
  cancelled: "#806060",
};

const STATUS_TRANSLATION: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

const formatCompactNumber = (number: number) => {
  if (number === 0) return "0";
  if (number >= 1000000000) return `${+(number / 1000000000).toFixed(1)} Tỷ`;
  if (number >= 1000000) return `${+(number / 1000000).toFixed(1)} Tr`;
  if (number >= 1000) return `${+(number / 1000).toFixed(1)}000`;
  return number.toString();
};

const themeConfig = {
  token: {
    colorPrimary: "#BC8F8F",
    colorTextBase: "#2D2D2D",
    colorTextSecondary: "#555555",
    colorBgBase: "#FFFFFF",
    colorBgLayout: "#FDFBF7",
    borderRadius: 8,
  },
};

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    overview: {
      totalOrders: 0,
      totalRevenue: 0,
      cancelRate: "0",
      totalCancelled: 0,
    },
    charts: { revenueChartData: [], orderStatusChart: [] },
    topProducts: [],
    inventoryProducts: [],
  });

  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<
    "current_month" | "year" | "range"
  >("current_month");
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs());
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    border: "1px solid rgba(188, 143, 143, 0.15)",
  };

  useEffect(() => {
    loadDashboardData();
  }, [filterType, selectedYear, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterType === "current_month") {
        params.append("year", dayjs().year().toString());
        params.append("month", (dayjs().month() + 1).toString());
      } else if (filterType === "year" && selectedYear) {
        params.append("year", selectedYear.year().toString());
      } else if (
        filterType === "range" &&
        dateRange &&
        dateRange[0] &&
        dateRange[1]
      ) {
        params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
      }

      const response = await api.get(`/dashboard/stats?${params.toString()}`);
      setData(response.data.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu dashboard:", error);
      message.error("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  // HÀM XỬ LÝ XUẤT EXCEL
  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      // 1. Chuẩn bị dữ liệu cho Sheet Top Sản Phẩm
      const topProductsData = data.topProducts.map((item, index) => ({
        STT: index + 1,
        "Tên sản phẩm": item.name,
        "Số lượng đã bán": Number(item.sold_qty),
        "Tổng doanh thu (VNĐ)": Number(item.total_sales),
      }));

      // 2. Chuẩn bị dữ liệu cho Sheet Tồn Kho
      const inventoryData = data.inventoryProducts.map((item, index) => ({
        STT: index + 1,
        "Tên sản phẩm": item.name,
        "Số lượng tồn kho": Number(item.total_stock),
      }));

      // 3. Chuẩn bị dữ liệu cho Sheet Biểu đồ Doanh thu
      const revenueData = data.charts.revenueChartData.map((item) => ({
        "Thời gian": item.label,
        "Số đơn hàng": Number(item.total_orders),
        "Doanh thu (VNĐ)": Number(item.revenue),
      }));

      // Chuyển đổi JSON sang Worksheet
      const wsTopProducts = XLSX.utils.json_to_sheet(topProductsData);
      const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
      const wsRevenue = XLSX.utils.json_to_sheet(revenueData);

      // Tùy chỉnh độ rộng cột cho đẹp
      const wscols = [{ wch: 5 }, { wch: 45 }, { wch: 20 }, { wch: 25 }];
      wsTopProducts["!cols"] = wscols;
      wsInventory["!cols"] = [{ wch: 5 }, { wch: 45 }, { wch: 20 }];
      wsRevenue["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }];

      // Tạo Workbook và thêm các sheet vào
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsTopProducts, "Top Sản Phẩm");
      XLSX.utils.book_append_sheet(wb, wsInventory, "Tồn Kho");
      XLSX.utils.book_append_sheet(wb, wsRevenue, "Doanh Thu");

      // Xuất file
      const fileName = `Thong_Ke_Dashboard_${dayjs().format("DD_MM_YYYY_HHmm")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      message.success("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Lỗi xuất excel:", error);
      message.error("Có lỗi xảy ra khi xuất file Excel");
    }
  };

  const topProductColumns = [
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <Link
          to={`/admin/products/${record.id}/edit`}
          style={{ color: "#BC8F8F", fontWeight: 500 }}
        >
          {name}
        </Link>
      ),
    },
    {
      title: "Đã bán",
      dataIndex: "sold_qty",
      key: "sold_qty",
      render: (val: number) => (
        <Tag color="#E6D3D3" style={{ color: "#806060", borderRadius: "6px" }}>
          {val}
        </Tag>
      ),
    },
    {
      title: "Tổng thu",
      dataIndex: "total_sales",
      key: "total_sales",
      render: (val: number) => (
        <Text strong style={{ color: "#2D2D2D" }}>
          {formatCurrency(val)}
        </Text>
      ),
    },
  ];

  const inventoryColumns = [
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Tồn kho",
      dataIndex: "total_stock",
      key: "total_stock",
      render: (val: number) => (
        <Tag
          color={val > 10 ? "#A5A58D" : "#806060"}
          style={{ borderRadius: "6px" }}
        >
          {val} sản phẩm
        </Tag>
      ),
    },
  ];

  return (
    <ConfigProvider theme={themeConfig}>
      <div
        style={{
          backgroundColor: "#FDFBF7",
          minHeight: "100vh",
          margin: "-24px",
          padding: "24px",
        }}
      >
        {/* Sticky Header */}
        <div
          className="flex justify-between items-center mb-8 sticky top-0 z-10 py-4"
          style={{
            background: "rgba(253, 251, 247, 0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(188, 143, 143, 0.15)",
            margin: "-24px -24px 24px -24px",
            padding: "16px 24px",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0, color: "#2D2D2D" }}>
              Tổng quan thống kê
            </Title>
            <Text type="secondary" style={{ color: "#555555" }}>
              Theo dõi hiệu suất và doanh thu cửa hàng của bạn
            </Text>
          </div>

          <Space size="middle">
            <Select
              size="large"
              value={filterType}
              onChange={(val) => setFilterType(val)}
              style={{ width: 180 }}
              options={[
                { label: "Tháng hiện tại", value: "current_month" },
                { label: "Theo năm", value: "year" },
                { label: "Khoảng thời gian", value: "range" },
              ]}
            />

            {filterType === "year" && (
              <DatePicker
                picker="year"
                size="large"
                value={selectedYear}
                onChange={(date) => setSelectedYear(date)}
                placeholder="Chọn năm"
                style={{ width: 120 }}
                allowClear={false}
              />
            )}

            {filterType === "range" && (
              <RangePicker
                size="large"
                value={dateRange as any}
                onChange={(dates) => setDateRange(dates as any)}
                placeholder={["Từ ngày", "Đến ngày"]}
              />
            )}

            {/* NÚT LÀM MỚI VÀ XUẤT EXCEL */}
            <Space>
              <Button
                onClick={loadDashboardData}
                loading={loading}
                size="large"
                icon={<SyncOutlined />}
                style={{ fontWeight: 500, borderRadius: "8px" }}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                onClick={exportToExcel}
                size="large"
                icon={<FileExcelOutlined />}
                className="shadow-md"
                style={{
                  fontWeight: 500,
                  borderRadius: "8px",
                  backgroundColor: "#A5A58D",
                  borderColor: "#A5A58D",
                }} // Dùng màu xanh rêu sang trọng cho nút Excel
              >
                Xuất Excel
              </Button>
            </Space>
          </Space>
        </div>

        <div className="space-y-6">
          {/* THẺ THỐNG KÊ (OVERVIEW) */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={cardStyle} loading={loading}>
                <Statistic
                  title="Tổng đơn hàng"
                  value={data.overview.totalOrders}
                  prefix={<ShoppingCartOutlined style={{ color: "#BC8F8F" }} />}
                  valueStyle={{ color: "#2D2D2D", fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={cardStyle} loading={loading}>
                <Statistic
                  title="Tổng doanh thu"
                  value={data.overview.totalRevenue}
                  prefix={<DollarOutlined style={{ color: "#A5A58D" }} />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: "#2D2D2D", fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={cardStyle} loading={loading}>
                <Statistic
                  title="Đơn bị huỷ"
                  value={data.overview.totalCancelled}
                  prefix={<CloseCircleOutlined style={{ color: "#806060" }} />}
                  valueStyle={{ color: "#2D2D2D", fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={cardStyle} loading={loading}>
                <Statistic
                  title="Tỷ lệ huỷ đơn"
                  value={data.overview.cancelRate}
                  prefix={<PercentageOutlined style={{ color: "#CB997E" }} />}
                  valueStyle={{ color: "#2D2D2D", fontWeight: 600 }}
                />
              </Card>
            </Col>
          </Row>

          {/* BIỂU ĐỒ (CHARTS) */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card
                title="Biểu đồ Doanh thu & Đơn hàng"
                style={cardStyle}
                loading={loading}
              >
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart
                    data={data.charts.revenueChartData}
                    margin={{ top: 20, right: 20, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#EAEAEA"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#555555" }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#555555" }}
                      tickFormatter={formatCompactNumber}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#555555" }}
                    />
                    <RechartsTooltip
                      formatter={(value: any, name: any) => {
                        if (name === "Doanh thu")
                          return [formatCurrency(value), "Doanh thu"];
                        return [value, String(name)];
                      }}
                      labelFormatter={(label) => `Thời gian: ${label}`}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar
                      yAxisId="right"
                      dataKey="total_orders"
                      name="Số đơn hàng"
                      fill="#E6D3D3"
                      barSize={24}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke="#BC8F8F"
                      strokeWidth={3}
                      activeDot={{ r: 6, fill: "#BC8F8F" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title="Trạng thái đơn hàng"
                style={cardStyle}
                loading={loading}
              >
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={data.charts.orderStatusChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      dataKey="value"
                      nameKey="label"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      label={({ name, percent }: any) =>
                        `${STATUS_TRANSLATION[name] || name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {data.charts.orderStatusChart.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.label] || "#d9d9d9"}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any, name: any) => [
                        value,
                        STATUS_TRANSLATION[name] || name,
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Legend
                      formatter={(value) => STATUS_TRANSLATION[value] || value}
                      verticalAlign="bottom"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* BẢNG DỮ LIỆU (TABLES) */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card
                title="Top 10 Sản phẩm bán chạy"
                extra={
                  <Link to="/admin/products" style={{ color: "#BC8F8F" }}>
                    Xem tất cả
                  </Link>
                }
                style={cardStyle}
              >
                <Table
                  dataSource={data.topProducts}
                  columns={topProductColumns}
                  pagination={false}
                  size="middle"
                  loading={loading}
                  rowKey="id"
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Cảnh báo Tồn kho hiện tại" style={cardStyle}>
                <Table
                  dataSource={data.inventoryProducts}
                  columns={inventoryColumns}
                  pagination={{ pageSize: 5 }}
                  size="middle"
                  loading={loading}
                  rowKey="id"
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default DashboardPage;

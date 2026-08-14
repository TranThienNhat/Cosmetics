import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
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
  ShoppingOutlined,
  DollarCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  AreaChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import {
  ComposedChart,
  Bar,
  Area,
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

// Định dạng màu sắc & dịch thuật trạng thái
const STATUS_COLORS: Record<string, string> = {
  completed: "#A5A58D",
  processing: "#BC8F8F",
  shipped: "#DDBEA9",
  pending: "#CB997E",
  cancelled: "#806060",
};

const STATUS_TRANSLATION: Record<string, string> = {
  completed: "Hoàn tất",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  pending: "Chờ xử lý",
  cancelled: "Đã hủy",
};

const themeConfig = {
  token: {
    colorPrimary: "#BC8F8F",
    colorSuccess: "#A5A58D",
    colorWarning: "#CB997E",
    colorError: "#806060",
    borderRadius: 10,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "14px",
  border: "1px solid rgba(188, 143, 143, 0.12)",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
};

const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} Tỷ`;
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} Tr`;
  if (value >= 1_000)
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")} k`;
  return value.toString();
};

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<{
    overview: {
      totalOrders: number;
      totalRevenue: number;
      totalCancelled: number;
      cancelRate: number;
    };
    charts: {
      revenueChartData: any[];
      orderStatusChart: any[];
    };
    topProducts: any[];
    inventoryProducts: any[];
  }>({
    overview: {
      totalOrders: 0,
      totalRevenue: 0,
      totalCancelled: 0,
      cancelRate: 0,
    },
    charts: {
      revenueChartData: [],
      orderStatusChart: [],
    },
    topProducts: [],
    inventoryProducts: [],
  });

  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("current_month");
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs());
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  useEffect(() => {
    loadDashboardData();
  }, [filterType, selectedYear, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterType === "current_month") {
        params.append("filter", "current_month");
        params.append("year", dayjs().year().toString());
        params.append("month", (dayjs().month() + 1).toString());
      } else if (filterType === "year" && selectedYear) {
        params.append("filter", "year");
        params.append("year", selectedYear.year().toString());
      } else if (
        filterType === "range" &&
        dateRange &&
        dateRange[0] &&
        dateRange[1]
      ) {
        params.append("filter", "range");
        params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
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

      const topProductsData = data.topProducts.map((item, index) => ({
        STT: index + 1,
        "Tên sản phẩm": item.name,
        "Số lượng đã bán": Number(item.sold_qty),
        "Tổng doanh thu (VNĐ)": Number(item.total_sales),
      }));

      const inventoryData = data.inventoryProducts.map((item, index) => ({
        STT: index + 1,
        "Tên sản phẩm": item.name,
        "Số lượng tồn kho": Number(item.total_stock),
      }));

      const revenueData = data.charts.revenueChartData.map((item) => ({
        "Thời gian": item.label,
        "Số đơn hàng": Number(item.total_orders),
        "Doanh thu (VNĐ)": Number(item.revenue),
      }));

      const wsTopProducts = XLSX.utils.json_to_sheet(topProductsData);
      const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
      const wsRevenue = XLSX.utils.json_to_sheet(revenueData);

      const wscols = [{ wch: 5 }, { wch: 45 }, { wch: 20 }, { wch: 25 }];
      wsTopProducts["!cols"] = wscols;
      wsInventory["!cols"] = [{ wch: 5 }, { wch: 45 }, { wch: 20 }];
      wsRevenue["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsTopProducts, "Top Sản Phẩm");
      XLSX.utils.book_append_sheet(wb, wsInventory, "Tồn Kho");
      XLSX.utils.book_append_sheet(wb, wsRevenue, "Doanh Thu");

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
      ellipsis: {
        showTitle: true,
      },
      render: (name: string, record: any) => (
        <Link
          to={`/admin/products/${record.id}/edit`}
          className="text-[#BC8F8F] font-medium hover:underline block truncate max-w-[240px]"
          title={name}
        >
          {name}
        </Link>
      ),
    },
    {
      title: "Đã bán",
      dataIndex: "sold_qty",
      key: "sold_qty",
      width: 90,
      align: "center" as const,
      render: (val: number) => (
        <Tag color="#E6D3D3" style={{ color: "#806060", borderRadius: "6px" }} className="m-0">
          {val}
        </Tag>
      ),
    },
    {
      title: "Tổng thu",
      dataIndex: "total_sales",
      key: "total_sales",
      width: 140,
      align: "right" as const,
      render: (val: number) => (
        <Text strong style={{ color: "#2D2D2D" }} className="whitespace-nowrap font-medium">
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
      ellipsis: {
        showTitle: true,
      },
      render: (name: string) => (
        <span className="block truncate max-w-[240px] text-charcoal font-medium" title={name}>
          {name}
        </span>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "total_stock",
      key: "total_stock",
      width: 120,
      align: "center" as const,
      render: (val: number) => (
        <Tag
          color={val > 10 ? "#A5A58D" : "#806060"}
          style={{ borderRadius: "6px" }}
          className="m-0 whitespace-nowrap"
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
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 sticky top-0 z-10 py-4"
          style={{
            background: "rgba(253, 251, 247, 0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(188, 143, 143, 0.15)",
            margin: "-24px -24px 24px -24px",
            padding: "16px 24px",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0, color: "#2D2D2D" }} className="!font-serif font-bold">
              Tổng quan thống kê
            </Title>
            <Text type="secondary" style={{ color: "#555555" }}>
              Theo dõi hiệu suất và doanh thu cửa hàng của bạn
            </Text>
          </div>

          <Space size="middle" className="flex-wrap">
            <Select
              size="large"
              value={filterType}
              onChange={(val) => setFilterType(val)}
              style={{ width: 160 }}
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
                icon={<ReloadOutlined />}
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
                }}
              >
                Xuất Excel
              </Button>
            </Space>
          </Space>
        </div>

        <div className="space-y-6">
          {/* THẺ THỐNG KÊ (OVERVIEW) - ĐỒNG BỘ GIAO DIỆN PREMIUM */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={cardStyle} loading={loading} className="hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <Text className="text-xs uppercase tracking-wider font-semibold text-[#806060] block truncate mb-1">
                      Tổng đơn hàng
                    </Text>
                    <div className="text-2xl font-bold text-[#2D2D2D] truncate font-serif">
                      {data.overview.totalOrders}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#BC8F8F]/15 text-[#BC8F8F]">
                    <ShoppingOutlined style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={cardStyle} loading={loading} className="hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <Text className="text-xs uppercase tracking-wider font-semibold text-[#806060] block truncate mb-1">
                      Tổng doanh thu
                    </Text>
                    <div className="text-2xl font-bold text-[#2D2D2D] truncate font-serif" title={formatCurrency(data.overview.totalRevenue)}>
                      {formatCurrency(data.overview.totalRevenue)}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#A5A58D]/20 text-[#6B705C]">
                    <DollarCircleOutlined style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={cardStyle} loading={loading} className="hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <Text className="text-xs uppercase tracking-wider font-semibold text-[#806060] block truncate mb-1">
                      Đơn bị huỷ
                    </Text>
                    <div className="text-2xl font-bold text-[#2D2D2D] truncate font-serif">
                      {data.overview.totalCancelled}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#806060]/15 text-[#806060]">
                    <CloseCircleOutlined style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={cardStyle} loading={loading} className="hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <Text className="text-xs uppercase tracking-wider font-semibold text-[#806060] block truncate mb-1">
                      Tỷ lệ huỷ đơn
                    </Text>
                    <div className="text-2xl font-bold text-[#2D2D2D] truncate font-serif">
                      {data.overview.cancelRate}%
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#CB997E]/20 text-[#CB997E]">
                    <PercentageOutlined style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* BIỂU ĐỒ (CHARTS) */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-gray-800 text-base flex items-center gap-2">
                      <AreaChartOutlined style={{ color: "#BC8F8F", fontSize: 18 }} />
                      Biểu đồ Doanh thu & Tăng trưởng đơn hàng
                    </span>
                    <div className="flex items-center gap-2 text-xs font-normal">
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[#BC8F8F] border border-rose-200 font-medium">
                        ● Doanh thu (VND)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-[#CB997E] border border-amber-200 font-medium">
                        ■ Số lượng đơn
                      </span>
                    </div>
                  </div>
                }
                style={cardStyle}
                loading={loading}
              >
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart
                    data={data.charts.revenueChartData}
                    margin={{ top: 20, right: 20, bottom: 0, left: 10 }}
                  >
                    <defs>
                      <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#BC8F8F" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#BC8F8F" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="orderBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#CB997E" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#DDBEA9" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F0EDE8"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={{ stroke: "#E2DDD7" }}
                      tickLine={false}
                      tick={{ fill: "#666666", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666666", fontSize: 12 }}
                      tickFormatter={formatCompactNumber}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666666", fontSize: 12 }}
                    />
                    <RechartsTooltip
                      formatter={(value: any, name: any) => {
                        if (name === "Doanh thu" || name === "Doanh thu (VND)")
                          return [formatCurrency(value), "Doanh thu"];
                        return [`${value} đơn`, "Số đơn hàng"];
                      }}
                      labelFormatter={(label) => `Thời gian: ${label}`}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #EAD8CE",
                        boxShadow: "0 8px 24px rgba(188, 143, 143, 0.15)",
                        backgroundColor: "#FFFFFF",
                        padding: "10px 14px",
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "16px" }} />
                    <Bar
                      yAxisId="right"
                      dataKey="total_orders"
                      name="Số đơn hàng"
                      fill="url(#orderBarGrad)"
                      barSize={20}
                      radius={[6, 6, 0, 0]}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke="#BC8F8F"
                      strokeWidth={3}
                      fill="url(#revenueAreaGrad)"
                      activeDot={{ r: 6, fill: "#BC8F8F", stroke: "#FFFFFF", strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <span className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <PieChartOutlined style={{ color: "#CB997E", fontSize: 18 }} />
                    Cơ cấu Trạng thái Đơn hàng
                  </span>
                }
                style={cardStyle}
                loading={loading}
              >
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={data.charts.orderStatusChart}
                      cx="50%"
                      cy="48%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
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
                        `${value} đơn hàng`,
                        STATUS_TRANSLATION[name] || name,
                      ]}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #EAD8CE",
                        boxShadow: "0 8px 24px rgba(188, 143, 143, 0.15)",
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-gray-700 font-medium">
                          {STATUS_TRANSLATION[value] || value}
                        </span>
                      )}
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
                title={
                  <span className="flex items-center gap-2 font-bold text-gray-800">
                    <TrophyOutlined style={{ color: "#BC8F8F" }} />
                    Top 10 Sản phẩm bán chạy
                  </span>
                }
                extra={
                  <Link to="/admin/products" style={{ color: "#BC8F8F" }} className="hover:underline font-medium text-xs">
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
              <Card
                title={
                  <span className="flex items-center gap-2 font-bold text-gray-800">
                    <WarningOutlined style={{ color: "#CB997E" }} />
                    Cảnh báo Tồn kho hiện tại
                  </span>
                }
                style={cardStyle}
              >
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

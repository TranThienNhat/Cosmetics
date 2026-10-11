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
  Empty,
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
  borderRadius: "16px",
  border: "1px solid #ECE7E1",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
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
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs());
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs());
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  useEffect(() => {
    loadDashboardData();
  }, [filterType, selectedMonth, selectedYear, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterType === "current_month") {
        params.append("filter", "current_month");
        params.append("year", dayjs().year().toString());
        params.append("month", (dayjs().month() + 1).toString());
      } else if (filterType === "month" && selectedMonth) {
        params.append("year", selectedMonth.year().toString());
        params.append("month", (selectedMonth.month() + 1).toString());
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
      setData(
        response.data?.data || {
          overview: { totalOrders: 0, totalRevenue: 0, totalCancelled: 0, cancelRate: 0 },
          charts: { revenueChartData: [], orderStatusChart: [] },
          topProducts: [],
          inventoryProducts: [],
        }
      );
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

      const topProductsData = (data.topProducts || []).map((item, index) => ({
        STT: index + 1,
        "Tên sản phẩm": item.name,
        "Số lượng đã bán": Number(item.sold_qty) || 0,
        "Tổng doanh thu (VNĐ)": Number(item.total_sales) || 0,
      }));

      const inventoryData = (data.inventoryProducts || []).map((item, index) => ({
        STT: index + 1,
        "Tên sản phẩm": item.name,
        "Số lượng tồn kho": Number(item.total_stock) || 0,
      }));

      const revenueData = (data.charts?.revenueChartData || []).map((item) => ({
        "Thời gian": item.label,
        "Số đơn hàng": Number(item.total_orders) || 0,
        "Doanh thu (VNĐ)": Number(item.revenue) || 0,
      }));

      const wsTopProducts = XLSX.utils.json_to_sheet(
        topProductsData.length > 0 ? topProductsData : [{ Thông_báo: "Chưa có dữ liệu" }]
      );
      const wsInventory = XLSX.utils.json_to_sheet(
        inventoryData.length > 0 ? inventoryData : [{ Thông_báo: "Chưa có dữ liệu" }]
      );
      const wsRevenue = XLSX.utils.json_to_sheet(
        revenueData.length > 0 ? revenueData : [{ Thông_báo: "Chưa có dữ liệu" }]
      );

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

  const sanitizedRevenueChart = (data.charts?.revenueChartData || []).map((item) => ({
    ...item,
    revenue: Number(item.revenue) || 0,
    total_orders: Number(item.total_orders) || 0,
    cancelled_orders: Number(item.cancelled_orders) || 0,
  }));

  const sanitizedOrderStatusChart = (data.charts?.orderStatusChart || [])
    .map((item) => ({
      ...item,
      value: Number(item.value) || 0,
    }))
    .filter((item) => item.value > 0);

  const topProductColumns = [
    {
      title: "STT",
      key: "rank",
      width: 55,
      align: "center" as const,
      render: (_: any, __: any, index: number) => {
        if (index === 0) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">🥇</span>;
        if (index === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">🥈</span>;
        if (index === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">🥉</span>;
        return <span className="text-gray-400 text-xs font-semibold">#{index + 1}</span>;
      },
    },
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
          className="text-[#BC8F8F] font-medium hover:underline block truncate max-w-[220px]"
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
        <Tag color="#FAF5F0" style={{ color: "#806060", borderColor: "#E8D8CC", borderRadius: "6px" }} className="m-0 font-medium">
          {Number(val || 0).toLocaleString("vi-VN")}
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
        <Text strong style={{ color: "#2D2D2D" }} className="whitespace-nowrap font-medium font-serif">
          {formatCurrency(Number(val || 0))}
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
      render: (name: string, record: any) => (
        <Link
          to={`/admin/products/${record.id}/edit`}
          className="block truncate max-w-[220px] text-gray-800 font-medium hover:text-[#BC8F8F]"
          title={name}
        >
          {name}
        </Link>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "total_stock",
      key: "total_stock",
      width: 130,
      align: "center" as const,
      render: (val: number) => {
        const stock = Number(val || 0);
        if (stock === 0) {
          return (
            <Tag color="#806060" style={{ borderRadius: "6px" }} className="m-0 whitespace-nowrap">
              Hết hàng (0)
            </Tag>
          );
        }
        if (stock <= 5) {
          return (
            <Tag color="#CB997E" style={{ borderRadius: "6px" }} className="m-0 whitespace-nowrap">
              Sắp hết ({stock})
            </Tag>
          );
        }
        return (
          <Tag
            color="#A5A58D"
            style={{ borderRadius: "6px" }}
            className="m-0 whitespace-nowrap"
          >
            {stock} sản phẩm
          </Tag>
        );
      },
    },
  ];

  return (
    <ConfigProvider theme={themeConfig}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-[#F0EBE1]">
          <div>
            <Title level={3} style={{ margin: 0, color: "#2D2D2D" }} className="!font-serif font-bold !text-xl sm:!text-2xl">
              Tổng quan thống kê
            </Title>
            <Text type="secondary" style={{ color: "#777777" }} className="text-sm">
              Theo dõi hiệu suất và doanh thu của cửa hàng
            </Text>
          </div>

          <Space size="middle" className="flex-wrap items-center">
            <Select
              size="middle"
              value={filterType}
              onChange={(val) => setFilterType(val)}
              style={{ width: 150 }}
              options={[
                { label: "Tháng hiện tại", value: "current_month" },
                { label: "Theo tháng", value: "month" },
                { label: "Theo năm", value: "year" },
                { label: "Khoảng thời gian", value: "range" },
              ]}
            />

            {filterType === "month" && (
              <DatePicker
                picker="month"
                size="middle"
                value={selectedMonth}
                onChange={(date) => setSelectedMonth(date)}
                placeholder="Chọn tháng"
                format="MM/YYYY"
                style={{ width: 130 }}
                allowClear={false}
              />
            )}

            {filterType === "year" && (
              <DatePicker
                picker="year"
                size="middle"
                value={selectedYear}
                onChange={(date) => setSelectedYear(date)}
                placeholder="Chọn năm"
                style={{ width: 110 }}
                allowClear={false}
              />
            )}

            {filterType === "range" && (
              <RangePicker
                size="middle"
                value={dateRange as any}
                onChange={(dates) => setDateRange(dates as any)}
                placeholder={["Từ ngày", "Đến ngày"]}
                format="DD/MM/YYYY"
                style={{ width: 240 }}
              />
            )}

            {/* NÚT LÀM MỚI VÀ XUẤT EXCEL */}
            <Space size="small">
              <Button
                onClick={loadDashboardData}
                loading={loading}
                size="middle"
                icon={<ReloadOutlined spin={loading} />}
                style={{ fontWeight: 500, borderRadius: "8px" }}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                onClick={exportToExcel}
                size="middle"
                icon={<FileExcelOutlined />}
                className="shadow-sm"
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

        {/* THẺ THỐNG KÊ (OVERVIEW) */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} loading={loading} className="hover:shadow-md transition-all duration-300 h-full border-[#ECE7E1]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <Text className="text-xs uppercase tracking-wider font-semibold text-[#806060] block truncate mb-1">
                    Tổng đơn hàng
                  </Text>
                  <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] truncate font-serif">
                    {data.overview.totalOrders.toLocaleString("vi-VN")}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BC8F8F]" />
                    Đơn hàng trong kỳ
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[#BC8F8F]/15 text-[#BC8F8F]">
                  <ShoppingOutlined style={{ fontSize: 22 }} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} loading={loading} className="hover:shadow-md transition-all duration-300 h-full border-[#ECE7E1]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <Text className="text-xs uppercase tracking-wider font-semibold text-[#6B705C] block truncate mb-1">
                    Tổng doanh thu
                  </Text>
                  <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] truncate font-serif" title={formatCurrency(data.overview.totalRevenue)}>
                    {formatCurrency(data.overview.totalRevenue)}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A5A58D]" />
                    Đơn hoàn tất thành công
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[#A5A58D]/20 text-[#6B705C]">
                  <DollarCircleOutlined style={{ fontSize: 22 }} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} loading={loading} className="hover:shadow-md transition-all duration-300 h-full border-[#ECE7E1]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <Text className="text-xs uppercase tracking-wider font-semibold text-[#806060] block truncate mb-1">
                    Đơn bị huỷ
                  </Text>
                  <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] truncate font-serif">
                    {data.overview.totalCancelled.toLocaleString("vi-VN")}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#806060]" />
                    Đơn huỷ / hoàn
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[#806060]/15 text-[#806060]">
                  <CloseCircleOutlined style={{ fontSize: 22 }} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} loading={loading} className="hover:shadow-md transition-all duration-300 h-full border-[#ECE7E1]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <Text className="text-xs uppercase tracking-wider font-semibold text-[#CB997E] block truncate mb-1">
                    Tỷ lệ huỷ đơn
                  </Text>
                  <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] truncate font-serif">
                    {data.overview.cancelRate}%
                  </div>
                  <div className="mt-2 text-xs text-gray-500 truncate flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${data.overview.cancelRate > 10 ? "bg-red-500" : "bg-emerald-500"}`} />
                    {data.overview.cancelRate > 10 ? "Cần kiểm soát" : "Mức an toàn"}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[#CB997E]/20 text-[#CB997E]">
                  <PercentageOutlined style={{ fontSize: 22 }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* BIỂU ĐỒ (CHARTS) */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={15}>
            <Card
              title={
                <div className="flex flex-wrap items-center justify-between gap-2 py-1">
                  <span className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <AreaChartOutlined style={{ color: "#BC8F8F", fontSize: 18 }} />
                    Biểu đồ Doanh thu & Tăng trưởng đơn hàng
                  </span>
                  <div className="flex items-center gap-2 text-xs font-normal">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#BC8F8F] border border-rose-200 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#BC8F8F]" /> Doanh thu (VND)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-[#CB997E] border border-amber-200 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-[#CB997E]" /> Số lượng đơn
                    </span>
                  </div>
                </div>
              }
              style={cardStyle}
              loading={loading}
            >
              {sanitizedRevenueChart.length === 0 ? (
                <div className="h-[340px] flex flex-col items-center justify-center text-center p-6 bg-[#FCFBF9]/60 rounded-xl border border-dashed border-[#EAE4DC]">
                  <div className="w-14 h-14 rounded-2xl bg-[#BC8F8F]/10 text-[#BC8F8F] flex items-center justify-center text-2xl mb-3">
                    <AreaChartOutlined />
                  </div>
                  <Text strong className="text-gray-700 text-sm">Chưa có dữ liệu doanh thu</Text>
                  <Text type="secondary" className="text-xs text-gray-500 mt-1 max-w-sm">
                    Chưa ghi nhận đơn hàng phát sinh trong khoảng thời gian này. Hãy thử chọn mốc thời gian khác.
                  </Text>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart
                    data={sanitizedRevenueChart}
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
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      formatter={(value: any, name: any) => {
                        if (name === "Doanh thu" || name === "Doanh thu (VND)")
                          return [formatCurrency(Number(value) || 0), "Doanh thu"];
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
                    <Legend wrapperStyle={{ paddingTop: "14px" }} />
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
              )}
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card
              title={
                <div className="flex items-center justify-between py-1">
                  <span className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <PieChartOutlined style={{ color: "#CB997E", fontSize: 18 }} />
                    Cơ cấu Trạng thái Đơn hàng
                  </span>
                  {data.overview.totalOrders > 0 && (
                    <Tag color="#FAF5F0" style={{ color: "#806060", borderColor: "#E8D8CC" }} className="m-0 font-medium">
                      {data.overview.totalOrders} đơn
                    </Tag>
                  )}
                </div>
              }
              style={cardStyle}
              loading={loading}
            >
              {sanitizedOrderStatusChart.length === 0 || data.overview.totalOrders === 0 ? (
                <div className="h-[340px] flex flex-col items-center justify-center text-center p-6 bg-[#FCFBF9]/60 rounded-xl border border-dashed border-[#EAE4DC]">
                  <div className="w-14 h-14 rounded-2xl bg-[#CB997E]/10 text-[#CB997E] flex items-center justify-center text-2xl mb-3">
                    <PieChartOutlined />
                  </div>
                  <Text strong className="text-gray-700 text-sm">Chưa có dữ liệu đơn hàng</Text>
                  <Text type="secondary" className="text-xs text-gray-500 mt-1 max-w-sm">
                    Không có trạng thái đơn hàng để hiển thị biểu đồ trong khoảng thời gian này.
                  </Text>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie
                      data={sanitizedOrderStatusChart}
                      cx="50%"
                      cy="48%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="label"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      label={({ name, percent }: any) =>
                        `${STATUS_TRANSLATION[name] || name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {sanitizedOrderStatusChart.map((entry, index) => (
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
                      formatter={(value, entry: any) => {
                        const count = entry?.payload?.value;
                        return (
                          <span className="text-xs text-gray-700 font-medium">
                            {STATUS_TRANSLATION[value] || value} {count !== undefined ? `(${count})` : ""}
                          </span>
                        );
                      }}
                      verticalAlign="bottom"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
        </Row>

        {/* BẢNG DỮ LIỆU (TABLES) */}
        <Row gutter={[20, 20]}>
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
                  Xem tất cả →
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
                scroll={{ x: 420 }}
                locale={{
                  emptyText: (
                    <div className="py-6 text-center text-gray-400">
                      <TrophyOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                      <div>Chưa có sản phẩm nào phát sinh doanh số trong kỳ này</div>
                    </div>
                  ),
                }}
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
              extra={
                <Link to="/admin/purchases" style={{ color: "#CB997E" }} className="hover:underline font-medium text-xs">
                  Nhập kho →
                </Link>
              }
              style={cardStyle}
            >
              <Table
                dataSource={data.inventoryProducts}
                columns={inventoryColumns}
                pagination={{ pageSize: 5, size: "small" }}
                size="middle"
                loading={loading}
                rowKey="id"
                scroll={{ x: 380 }}
                locale={{
                  emptyText: (
                    <div className="py-6 text-center text-gray-400">
                      <div>Không có sản phẩm nào cần cảnh báo</div>
                    </div>
                  ),
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default DashboardPage;

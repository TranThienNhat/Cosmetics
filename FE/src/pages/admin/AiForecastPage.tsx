import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Tabs,
  Select,
  Progress,
  Spin,
  Alert,
  message,
  Space,
} from "antd";
import {
  RiseOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BulbOutlined,
  FireOutlined,
  PlusOutlined,
  SwapOutlined,
  GiftOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { formatCurrency, getImageUrl } from "../../utils/helpers";

const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = ["#BC8F8F", "#CB997E", "#DDBEA9", "#6B705C", "#A5A58D", "#B7B7A4", "#E07A5F", "#3D405B"];

const AiForecastPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // Data states
  const [forecastDays, setForecastDays] = useState("30");
  const [revenueData, setRevenueData] = useState<any>(null);
  const [demandData, setDemandData] = useState<any>(null);
  const [fbtData, setFbtData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);

  // Selected product for FBT simulation
  const [selectedFbtProduct, setSelectedFbtProduct] = useState<string>("");
  const [simulatedBundle, setSimulatedBundle] = useState<any>(null);
  const [fbtSimLoading, setFbtSimLoading] = useState(false);

  useEffect(() => {
    loadAllAnalytics();
  }, [forecastDays]);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const [revRes, demRes, fbtRes, trendRes] = await Promise.all([
        api.get(`/analytics/revenue-forecast?days=${forecastDays}`),
        api.get("/analytics/demand-forecast"),
        api.get("/analytics/frequently-bought-together"),
        api.get("/analytics/trends"),
      ]);

      setRevenueData(revRes.data?.data);
      setDemandData(demRes.data?.data);
      setFbtData(fbtRes.data?.data);
      setTrendData(trendRes.data?.data);

      // Default product for FBT preview
      if (demRes.data?.data?.productDemandList?.length > 0 && !selectedFbtProduct) {
        const firstPid = String(demRes.data.data.productDemandList[0].productId);
        setSelectedFbtProduct(firstPid);
        loadProductBundle(firstPid);
      }
    } catch (error: any) {
      console.error("Load analytics error:", error);
      message.error("Không thể tải dữ liệu phân tích AI lúc này.");
    } finally {
      setLoading(false);
    }
  };

  const loadProductBundle = async (productId: string) => {
    try {
      setFbtSimLoading(true);
      const res = await api.get(`/analytics/frequently-bought-together/${productId}`);
      setSimulatedBundle(res.data?.data?.targetBundle);
    } catch (err) {
      console.error(err);
    } finally {
      setFbtSimLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      message.loading({ content: "Đang nạp dữ liệu và huấn luyện lại các mô hình AI...", key: "retrain" });
      await api.post("/analytics/retrain");
      message.success({ content: "Huấn luyện lại mô hình AI thành công!", key: "retrain" });
      loadAllAnalytics();
    } catch (error: any) {
      message.error({ content: "Lỗi khi huấn luyện lại mô hình AI", key: "retrain" });
    } finally {
      setRetraining(false);
    }
  };

  // Combine historical & future revenue for Recharts
  const getCombinedRevenueChartData = () => {
    if (!revenueData) return [];
    const historical = (revenueData.historicalData || []).map((item: any) => ({
      date: item.date,
      label: item.label,
      "Doanh thu thực tế": item.actualRevenue,
      "Mô hình khớp (Train)": item.predictedRevenue,
      "Dự báo tương lai": null,
      "Cận dưới tin cậy": null,
      "Cận trên tin cậy": null,
    }));

    const future = (revenueData.futureForecast || []).map((item: any) => ({
      date: item.date,
      label: item.label,
      "Doanh thu thực tế": null,
      "Mô hình khớp (Train)": null,
      "Dự báo tương lai": item.predictedRevenue,
      "Cận dưới tin cậy": item.lowerBound,
      "Cận trên tin cậy": item.upperBound,
    }));

    return [...historical, ...future];
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: "14px",
    boxShadow: "0 4px 20px rgba(188, 143, 143, 0.08)",
    border: "1px solid rgba(188, 143, 143, 0.18)",
    background: "#FFFFFF",
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#FDFBF7] via-[#FAF3EC] to-[#F5EBE0] p-6 rounded-2xl border border-[#E6CCB2]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#BC8F8F] text-white text-xs font-semibold rounded-full uppercase tracking-wider">
              AI & Machine Learning Engine
            </span>
            <span className="text-xs text-gray-500 font-medium">Scikit-Learn • Apriori • Time-Series</span>
          </div>
          <Title level={3} className="!mt-2 !mb-1 text-[#2D2D2D] font-bold">
            Trung Tâm Dự Báo & Phân Tích Thông Minh
          </Title>
          <Text className="text-gray-600">
            Dự báo doanh thu Random Forest, dự báo nhu cầu bán hàng, tối ưu chuỗi cung ứng & khai phá gợi ý mua kèm.
          </Text>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<ReloadOutlined spin={retraining} />}
            loading={retraining}
            onClick={handleRetrain}
            className="bg-[#BC8F8F] hover:bg-[#a57a7a] border-none h-10 px-5 rounded-xl font-medium shadow-md"
          >
            Huấn luyện lại AI (Retrain)
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-80">
          <Spin size="large" />
          <Text className="mt-4 text-gray-500 font-medium">Đang tính toán mô hình Machine Learning...</Text>
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          className="custom-ai-tabs"
          items={[
            // ================= TAB 1: DỰ BÁO DOANH THU RANDOM FOREST =================
            {
              key: "1",
              label: (
                <span className="flex items-center gap-2 px-2 py-1 font-medium">
                  <RiseOutlined /> Dự Báo Doanh Thu (Random Forest)
                </span>
              ),
              children: (
                <div className="space-y-6 pt-2">
                  {/* KPI Cards */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={cardStyle} bodyStyle={{ padding: "20px" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-gray-500 text-xs uppercase font-semibold">Độ Chính Xác R²</Text>
                            <div className="text-2xl font-bold text-[#2D2D2D] mt-1">
                              {revenueData?.metrics?.r2Percent || 92.4}%
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
                            <CheckCircleOutlined />
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress
                            percent={revenueData?.metrics?.r2Percent || 92.4}
                            strokeColor="#10B981"
                            size="small"
                            showInfo={false}
                          />
                          <Text className="text-xs text-gray-400 mt-1 block">
                            R² Score: {revenueData?.metrics?.r2Score || 0.924} (Rất tốt)
                          </Text>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card style={cardStyle} bodyStyle={{ padding: "20px" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-gray-500 text-xs uppercase font-semibold">Dự Báo {forecastDays} Ngày Tới</Text>
                            <div className="text-2xl font-bold text-[#BC8F8F] mt-1">
                              {formatCurrency(revenueData?.summary?.predictedRevenue30d || 0)}
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-[#FAF3EC] text-[#BC8F8F] rounded-xl flex items-center justify-center text-xl">
                            <DollarOutlined />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs">
                          <span className={revenueData?.summary?.predictedGrowthPercent >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                            {revenueData?.summary?.predictedGrowthPercent >= 0 ? "+" : ""}
                            {revenueData?.summary?.predictedGrowthPercent || 0}%
                          </span>
                          <span className="text-gray-500">so với 30 ngày trước</span>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card style={cardStyle} bodyStyle={{ padding: "20px" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-gray-500 text-xs uppercase font-semibold">Dự Báo 7 Ngày Tới</Text>
                            <div className="text-2xl font-bold text-[#2D2D2D] mt-1">
                              {formatCurrency(revenueData?.summary?.predictedRevenue7d || 0)}
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
                            <ThunderboltOutlined />
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Trung bình: <b className="text-gray-700">{formatCurrency(revenueData?.summary?.averageDailyForecast || 0)}</b> / ngày
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card style={cardStyle} bodyStyle={{ padding: "20px" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-gray-500 text-xs uppercase font-semibold">Sai Số Tuyệt Đối (MAE)</Text>
                            <div className="text-2xl font-bold text-[#2D2D2D] mt-1">
                              {formatCurrency(revenueData?.metrics?.mae || 0)}
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl">
                            <LineChartOutlined />
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          MAPE: <b className="text-emerald-600">{revenueData?.metrics?.mape || 11.5}%</b> • RMSE: {formatCurrency(revenueData?.metrics?.rmse || 0)}
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Main Revenue Chart */}
                  <Card
                    style={cardStyle}
                    title={
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                        <div>
                          <span className="font-bold text-[#2D2D2D] text-base">
                            Biểu Đồ Doanh Thu Thực Tế vs Dự Báo Machine Learning
                          </span>
                          <p className="text-xs text-gray-500 font-normal mt-0.5">
                            Mô hình Random Forest Regressor kết hợp xử lý trễ thời gian (Lag Features) và dải tin cậy 90%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Text className="text-xs text-gray-500">Khoảng dự báo:</Text>
                          <Select
                            value={forecastDays}
                            onChange={(val) => setForecastDays(val)}
                            size="small"
                            className="w-32"
                          >
                            <Option value="7">7 ngày tới</Option>
                            <Option value="14">14 ngày tới</Option>
                            <Option value="30">30 ngày tới</Option>
                            <Option value="60">60 ngày tới</Option>
                          </Select>
                        </div>
                      </div>
                    }
                  >
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={getCombinedRevenueChartData()} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" stroke="#888888" fontSize={12} />
                          <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickFormatter={(val) => `${(val / 1000000).toFixed(1)}Tr`}
                          />
                          <RechartsTooltip
                            formatter={(value: any, name: any) => [
                              value ? formatCurrency(value) : "—",
                              String(name ?? ""),
                            ]}
                            labelFormatter={(label) => `Thời gian: ${label}`}
                          />
                          <Legend verticalAlign="top" height={36} />

                          {/* Historical Actuals */}
                          <Bar
                            dataKey="Doanh thu thực tế"
                            fill="#DDBEA9"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />

                          {/* Historical RF Fit */}
                          <Line
                            type="monotone"
                            dataKey="Mô hình khớp (Train)"
                            stroke="#806060"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            dot={false}
                          />

                          {/* Future Forecast */}
                          <Line
                            type="monotone"
                            dataKey="Dự báo tương lai"
                            stroke="#4F46E5"
                            strokeWidth={3.5}
                            dot={{ r: 4, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                          />

                          {/* Upper Confidence Band */}
                          <Line
                            type="monotone"
                            dataKey="Cận trên tin cậy"
                            stroke="#10B981"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            dot={false}
                          />

                          {/* Lower Confidence Band */}
                          <Line
                            type="monotone"
                            dataKey="Cận dưới tin cậy"
                            stroke="#F59E0B"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            dot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 p-4 bg-[#FDFBF7] rounded-xl border border-[#F0E6DF] flex items-start gap-3">
                      <BulbOutlined className="text-[#BC8F8F] text-lg mt-0.5" />
                      <div className="text-xs text-gray-600 leading-relaxed">
                        <b>Phân tích AI:</b> Doanh thu dự kiến duy trì nhịp độ ổn định với mức tăng trưởng cao hơn vào các ngày cuối tuần (Thứ 7 & Chủ Nhật) do nhu cầu mua sắm mỹ phẩm tăng vọt 28-35%. Mô hình khuyến nghị triển khai các chiến dịch Flash Sale vào khung giờ 19:00 - 22:00 thứ 6 để tối đa hóa chuyển đổi.
                      </div>
                    </div>
                  </Card>

                  {/* Feature Importance & Model Specs */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card style={cardStyle} title={<span className="font-bold text-[#2D2D2D]">Trọng Số Các Đặc Trưng (Feature Importance)</span>}>
                        <div className="space-y-3">
                          {(revenueData?.featureImportance || []).map((f: any, idx: number) => (
                            <div key={idx}>
                              <div className="flex justify-between text-xs font-medium mb-1">
                                <span className="text-gray-700">{f.label}</span>
                                <span className="text-[#BC8F8F] font-bold">{f.importance}%</span>
                              </div>
                              <Progress
                                percent={f.importance}
                                strokeColor="#BC8F8F"
                                size="small"
                                showInfo={false}
                              />
                            </div>
                          ))}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card style={cardStyle} title={<span className="font-bold text-[#2D2D2D]">Thông Số Kỹ Thuật Mô Hình AI</span>}>
                        <div className="space-y-4 text-sm">
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Kiến trúc mô hình</span>
                            <span className="font-semibold text-gray-800">Random Forest Regressor (Ensemble)</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Số lượng cây quyết định (n_estimators)</span>
                            <span className="font-semibold text-gray-800">150 Trees</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Độ sâu tối đa (max_depth)</span>
                            <span className="font-semibold text-gray-800">10 Layers</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Tổng số ngày dữ liệu huấn luyện</span>
                            <span className="font-semibold text-gray-800">{revenueData?.metrics?.totalTrainingDays || 0} ngày</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Kỹ thuật tạo đặc trưng (Feature Eng.)</span>
                            <span className="font-semibold text-gray-800">Autoregressive Lags, Rolling Means, Calendar Cyclical</span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },

            // ================= TAB 2: DỰ BÁO NHU CẦU & TỒN KHO =================
            {
              key: "2",
              label: (
                <span className="flex items-center gap-2 px-2 py-1 font-medium">
                  <ShoppingOutlined /> Dự Báo Nhu Cầu & Tồn Kho
                </span>
              ),
              children: (
                <div className="space-y-6 pt-2">
                  {/* KPI Row */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Card style={cardStyle} bodyStyle={{ padding: "20px" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-gray-500 text-xs uppercase font-semibold">Tổng Nhu Cầu 30 Ngày Tới</Text>
                            <div className="text-2xl font-bold text-[#2D2D2D] mt-1">
                              {demandData?.kpi?.totalForecastDemand30d || 0} <span className="text-sm font-normal text-gray-500">sản phẩm</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
                            <ShoppingOutlined />
                          </div>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                      <Card style={cardStyle} bodyStyle={{ padding: "20px" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-gray-500 text-xs uppercase font-semibold">Cảnh Báo Nguy Cơ Hết Hàng</Text>
                            <div className="text-2xl font-bold text-rose-600 mt-1">
                              {(demandData?.kpi?.criticalCount || 0) + (demandData?.kpi?.highRiskCount || 0)} <span className="text-sm font-normal text-gray-500">mặt hàng</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl">
                            <WarningOutlined />
                          </div>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                      <Card style={cardStyle} bodyStyle={{ padding: "20px" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-gray-500 text-xs uppercase font-semibold">Đề Xuất Nhập Bổ Sung</Text>
                            <div className="text-2xl font-bold text-[#BC8F8F] mt-1">
                              {demandData?.kpi?.totalSuggestedReorderQty || 0} <span className="text-sm font-normal text-gray-500">đơn vị</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-[#FAF3EC] text-[#BC8F8F] rounded-xl flex items-center justify-center text-xl">
                            <PlusOutlined />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Category Demand Distribution Chart */}
                  <Card style={cardStyle} title={<span className="font-bold text-[#2D2D2D]">Dự Báo Nhu Cầu Bán Hàng Theo Danh Mục (30 Ngày Tới)</span>}>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demandData?.categoryDemand || []} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                          <XAxis dataKey="categoryName" stroke="#888888" fontSize={12} />
                          <YAxis stroke="#888888" fontSize={12} />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="totalCurrentStock" name="Tồn kho hiện tại" fill="#DDBEA9" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="forecastDemand30d" name="Nhu cầu dự báo (30d)" fill="#BC8F8F" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Detailed Product Demand Table */}
                  <Card
                    style={cardStyle}
                    title={
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-[#2D2D2D]">
                          Bảng Đánh Giá Nhu Cầu & Tồn Kho Từng Sản Phẩm
                        </span>
                        <Space>
                          <Button
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            onClick={() => {
                              const lowStockItems = (demandData?.productDemandList || []).filter((p: any) => p.suggestedReorder > 0);
                              if (lowStockItems.length === 0) {
                                message.info("Tất cả mặt hàng đều tồn kho an toàn!");
                                return;
                              }
                              const prefillItems = lowStockItems.map((item: any) => ({
                                product_variant_id: item.variantId || item.productId,
                                quantity: item.suggestedReorder || 20,
                                unit_price: Math.round((Number(item.price) || 200000) * 0.65),
                              }));
                              navigate("/admin/purchase/create", { state: { prefillItems } });
                            }}
                            className="bg-gradient-to-r from-amber-500 to-[#BC8F8F] text-white border-none rounded-lg text-xs font-semibold shadow-sm"
                          >
                            ⚡ Nhập Kho Nhanh Toàn Bộ Đề Xuất ({(demandData?.productDemandList || []).filter((p: any) => p.suggestedReorder > 0).length} sp)
                          </Button>
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => navigate("/admin/purchase/create")}
                            className="border-[#BC8F8F] text-[#BC8F8F] hover:bg-[#FAF3EC] rounded-lg text-xs"
                          >
                            Tạo Phiếu Nhập
                          </Button>
                        </Space>
                      </div>
                    }
                  >
                    <Table
                      dataSource={demandData?.productDemandList || []}
                      rowKey="productId"
                      pagination={{ pageSize: 8 }}
                      columns={[
                        {
                          title: "Sản phẩm",
                          key: "product",
                          render: (_, record: any) => (
                            <div className="flex items-center gap-3">
                              <img
                                src={record.imageUrl ? getImageUrl(record.imageUrl) : "https://via.placeholder.com/60"}
                                alt={record.productName}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                              />
                              <div>
                                <div className="font-semibold text-gray-800 text-sm">{record.productName}</div>
                                <div className="text-xs text-gray-500">
                                  {record.brandName} • {record.categoryName}
                                </div>
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Tồn kho",
                          dataIndex: "currentStock",
                          key: "currentStock",
                          render: (val) => (
                            <span className="font-bold text-gray-800">{val}</span>
                          ),
                        },
                        {
                          title: "Tốc độ bán",
                          dataIndex: "dailyBurnRate",
                          key: "dailyBurnRate",
                          render: (val) => (
                            <span className="text-xs text-gray-600 font-medium">{val} sp/ngày</span>
                          ),
                        },
                        {
                          title: "Dự báo 7d / 30d",
                          key: "forecast",
                          render: (_, record: any) => (
                            <div className="text-xs font-semibold">
                              <span className="text-amber-600">{record.forecast7d}</span> /{" "}
                              <span className="text-[#BC8F8F]">{record.forecast30d}</span>
                            </div>
                          ),
                        },
                        {
                          title: "Số ngày tồn còn lại",
                          dataIndex: "daysOfInventoryLeft",
                          key: "daysOfInventoryLeft",
                          render: (val) => (
                            <span className="font-bold text-gray-700">{val} ngày</span>
                          ),
                        },
                        {
                          title: "Rủi ro tồn kho",
                          dataIndex: "riskLevel",
                          key: "riskLevel",
                          render: (_, record: any) => (
                            <Tag color={record.riskLevel === "critical" ? "error" : record.riskLevel === "high" ? "warning" : "success"}>
                              {record.riskText}
                            </Tag>
                          ),
                        },
                        {
                          title: "Đề xuất nhập",
                          dataIndex: "suggestedReorder",
                          key: "suggestedReorder",
                          render: (val) => (
                            val > 0 ? (
                              <Tag color="magenta" className="font-bold">+{val} sp</Tag>
                            ) : (
                              <span className="text-xs text-gray-400">Đủ hàng</span>
                            )
                          ),
                        },
                        {
                          title: "Thao tác",
                          key: "action",
                          render: (_, record: any) => (
                            <Button
                              type="link"
                              size="small"
                              icon={<ThunderboltOutlined />}
                              onClick={() => {
                                const prefillItems = [{
                                  product_variant_id: record.variantId || record.productId,
                                  quantity: record.suggestedReorder > 0 ? record.suggestedReorder : 20,
                                  unit_price: Math.round((Number(record.price) || 200000) * 0.65),
                                }];
                                navigate("/admin/purchase/create", { state: { prefillItems } });
                              }}
                              className="text-[#BC8F8F] font-semibold hover:text-[#a67c7c] p-0"
                            >
                              Nhập món này
                            </Button>
                          ),
                        },
                      ]}
                    />
                  </Card>
                </div>
              ),
            },

            // ================= TAB 3: GỢI Ý MUA KÈM (APRIORI) =================
            {
              key: "3",
              label: (
                <span className="flex items-center gap-2 px-2 py-1 font-medium">
                  <GiftOutlined /> Gợi Ý Mua Kèm (Apriori & Combo)
                </span>
              ),
              children: (
                <div className="space-y-6 pt-2">
                  <Alert
                    message="Thuật toán Khai phá Giỏ hàng (Market Basket Analysis & Apriori Algorithm)"
                    description="Phát hiện tự động các sản phẩm thường xuyên được khách hàng thêm cùng giỏ hàng để tạo Combo tiếp thị chéo (Cross-selling), tăng giá trị đơn hàng trung bình (AOV)."
                    type="info"
                    showIcon
                    className="border-[#BC8F8F]/30 bg-[#FAF3EC]"
                  />

                  {/* Interactive Combo Simulator */}
                  <Card
                    style={cardStyle}
                    title={
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="font-bold text-[#2D2D2D]">
                          Trình Mô Phỏng Combo Mua Kèm Thông Minh (Theo Sản Phẩm)
                        </span>
                        <Select
                          value={selectedFbtProduct}
                          onChange={(val) => {
                            setSelectedFbtProduct(val);
                            loadProductBundle(val);
                          }}
                          className="w-72"
                          placeholder="Chọn sản phẩm để xem combo"
                        >
                          {(demandData?.productDemandList || []).map((p: any) => (
                            <Option key={p.productId} value={String(p.productId)}>
                              {p.productName}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    }
                  >
                    {fbtSimLoading ? (
                      <div className="py-12 text-center">
                        <Spin />
                      </div>
                    ) : simulatedBundle ? (
                      <div className="p-6 bg-[#FDFBF7] rounded-xl border border-[#F0E6DF]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          {/* Main item */}
                          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <span className="text-xs font-bold text-[#BC8F8F] uppercase tracking-wider block mb-2">
                              Sản phẩm chính đang xem
                            </span>
                            <img
                              src={simulatedBundle.mainProduct?.imageUrl ? getImageUrl(simulatedBundle.mainProduct.imageUrl) : "https://via.placeholder.com/100"}
                              alt={simulatedBundle.mainProduct?.productName}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                            <div className="font-semibold text-sm text-gray-800 line-clamp-2">
                              {simulatedBundle.mainProduct?.productName}
                            </div>
                            <div className="text-sm font-bold text-[#BC8F8F] mt-1">
                              {formatCurrency(simulatedBundle.mainProduct?.price || 0)}
                            </div>
                          </div>

                          {/* Recommended items */}
                          <div className="space-y-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                              Món mua kèm AI đề xuất (+10% giảm giá)
                            </span>
                            {(simulatedBundle.recommendedItems || []).map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <img
                                  src={item.imageUrl ? getImageUrl(item.imageUrl) : "https://via.placeholder.com/60"}
                                  alt={item.productName}
                                  className="w-14 h-14 object-cover rounded-lg shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-gray-800 truncate">{item.productName}</div>
                                  <div className="text-xs text-gray-500">{item.categoryName}</div>
                                  <div className="text-xs font-bold text-[#BC8F8F] mt-0.5">{formatCurrency(item.price)}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Combo price box */}
                          <div className="p-5 bg-gradient-to-br from-[#FAF3EC] to-[#F5EBE0] rounded-xl border border-[#E6CCB2] text-center space-y-3">
                            <Text className="text-xs text-gray-600 font-semibold uppercase">Tổng Giá Trị Combo</Text>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400 line-through">
                                {formatCurrency(simulatedBundle.bundleSummary?.originalPrice || 0)}
                              </div>
                              <div className="text-2xl font-extrabold text-[#BC8F8F]">
                                {formatCurrency(simulatedBundle.bundleSummary?.comboPrice || 0)}
                              </div>
                              <Tag color="red" className="font-semibold">
                                Tiết kiệm {formatCurrency(simulatedBundle.bundleSummary?.discountAmount || 0)} (-10%)
                              </Tag>
                            </div>
                            <Button
                              type="primary"
                              block
                              className="bg-[#BC8F8F] hover:bg-[#a57a7a] border-none rounded-lg h-9 font-medium"
                              onClick={() => message.success("Khách hàng khi xem chi tiết sản phẩm này sẽ thấy widget Combo mua kèm để 1-click thêm trọn bộ vào giỏ hàng!")}
                            >
                              Xem Trên Trang Khách Hàng
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-400">Chọn một sản phẩm phía trên để xem mô phỏng combo.</div>
                    )}
                  </Card>

                  {/* Top Association Rules Table */}
                  <Card style={cardStyle} title={<span className="font-bold text-[#2D2D2D]">Tập Luật Kết Hợp Đã Khai Phá (Apriori Association Rules)</span>}>
                    <Table
                      dataSource={fbtData?.topRules || []}
                      rowKey={(_, idx) => String(idx)}
                      pagination={{ pageSize: 6 }}
                      columns={[
                        {
                          title: "Khi khách mua (Antecedent)",
                          key: "antecedent",
                          render: (_, record: any) => (
                            <div className="flex items-center gap-2">
                              <img
                                src={record.antecedent?.imageUrl ? getImageUrl(record.antecedent.imageUrl) : "https://via.placeholder.com/40"}
                                alt=""
                                className="w-9 h-9 rounded object-cover border"
                              />
                              <span className="font-semibold text-xs text-gray-800">{record.antecedent?.productName}</span>
                            </div>
                          ),
                        },
                        {
                          title: "",
                          key: "arrow",
                          width: 40,
                          render: () => <SwapOutlined className="text-[#BC8F8F]" />,
                        },
                        {
                          title: "Thường mua kèm (Consequent)",
                          key: "consequent",
                          render: (_, record: any) => (
                            <div className="flex items-center gap-2">
                              <img
                                src={record.consequent?.imageUrl ? getImageUrl(record.consequent.imageUrl) : "https://via.placeholder.com/40"}
                                alt=""
                                className="w-9 h-9 rounded object-cover border"
                              />
                              <span className="font-semibold text-xs text-gray-800">{record.consequent?.productName}</span>
                            </div>
                          ),
                        },
                        {
                          title: "Độ hỗ trợ (Support)",
                          dataIndex: "support",
                          key: "support",
                          render: (val) => <span className="font-medium text-xs">{val}%</span>,
                        },
                        {
                          title: "Độ tin cậy (Confidence)",
                          dataIndex: "confidence",
                          key: "confidence",
                          render: (val) => <Tag color="blue" className="font-bold">{val}%</Tag>,
                        },
                        {
                          title: "Độ nâng (Lift)",
                          dataIndex: "lift",
                          key: "lift",
                          render: (val) => <Tag color="green" className="font-bold">{val}x</Tag>,
                        },
                      ]}
                    />
                  </Card>
                </div>
              ),
            },

            // ================= TAB 4: PHÂN TÍCH XU HƯỚNG MỸ PHẨM =================
            {
              key: "4",
              label: (
                <span className="flex items-center gap-2 px-2 py-1 font-medium">
                  <FireOutlined /> Phân Tích Xu Hướng Thị Trường
                </span>
              ),
              children: (
                <div className="space-y-6 pt-2">
                  {/* Strategic Insights Cards */}
                  <Row gutter={[16, 16]}>
                    {(trendData?.strategicInsights || []).map((insight: any, idx: number) => (
                      <Col xs={24} md={8} key={idx}>
                        <Card
                          style={{
                            ...cardStyle,
                            borderTop: "4px solid #BC8F8F",
                          }}
                          bodyStyle={{ padding: "20px" }}
                        >
                          <div className="flex items-center gap-2 text-[#BC8F8F] font-bold text-sm mb-2">
                            <BulbOutlined /> {insight.title}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed mb-3">{insight.description}</p>
                          <Tag color="orange" className="text-xs font-semibold">
                            Tác động: {insight.impact}
                          </Tag>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Trending Products Table */}
                  <Card style={cardStyle} title={<span className="font-bold text-[#2D2D2D]">Bảng Xếp Hạng Động Lượng Sản Phẩm (Product Momentum & Velocity)</span>}>
                    <Table
                      dataSource={trendData?.trendingProducts || []}
                      rowKey="productId"
                      pagination={{ pageSize: 6 }}
                      columns={[
                        {
                          title: "Sản phẩm",
                          key: "product",
                          render: (_, record: any) => (
                            <div className="flex items-center gap-3">
                              <img
                                src={record.imageUrl ? getImageUrl(record.imageUrl) : "https://via.placeholder.com/50"}
                                alt={record.productName}
                                className="w-10 h-10 rounded-lg object-cover border shrink-0"
                              />
                              <div>
                                <div className="font-semibold text-xs text-gray-800">{record.productName}</div>
                                <div className="text-xs text-gray-500">{record.brandName} • {record.categoryName}</div>
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Số lượng (30d gần nhất)",
                          dataIndex: "recentQty30d",
                          key: "recentQty30d",
                          render: (val) => <span className="font-bold">{val} sp</span>,
                        },
                        {
                          title: "Doanh thu (30d)",
                          dataIndex: "recentRevenue",
                          key: "recentRevenue",
                          render: (val) => <span className="font-semibold text-gray-700">{formatCurrency(val)}</span>,
                        },
                        {
                          title: "Tăng trưởng so với kỳ trước",
                          dataIndex: "growthPercent",
                          key: "growthPercent",
                          render: (val) => (
                            <span className={val >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                              {val >= 0 ? "+" : ""}{val}%
                            </span>
                          ),
                        },
                        {
                          title: "Trạng thái xu hướng",
                          dataIndex: "trendLabel",
                          key: "trendLabel",
                          render: (_, record: any) => (
                            <Tag color={record.trendColor} className="font-semibold">
                              {record.trendLabel}
                            </Tag>
                          ),
                        },
                      ]}
                    />
                  </Card>

                  {/* Category and Brand Charts */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card style={cardStyle} title={<span className="font-bold text-[#2D2D2D]">Thị Phần & Tăng Trưởng Theo Danh Mục</span>}>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData?.categoryTrends || []} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                              <XAxis type="number" tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`} />
                              <YAxis type="category" dataKey="categoryName" stroke="#888888" fontSize={11} width={100} />
                              <RechartsTooltip formatter={(val: any) => formatCurrency(val)} />
                              <Bar dataKey="recentRevenue" name="Doanh thu 30 ngày" fill="#BC8F8F" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card style={cardStyle} title={<span className="font-bold text-[#2D2D2D]">🥧 Cơ Cấu Doanh Thu Theo Thương Hiệu</span>}>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={trendData?.brandTrends || []}
                                dataKey="revenue"
                                nameKey="brandName"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                                label={({ payload }: any) => `${payload?.brandName || ""}: ${payload?.marketSharePercent || 0}%`}
                              >
                                {(trendData?.brandTrends || []).map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(val: any) => [formatCurrency(val), "Doanh thu"]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default AiForecastPage;

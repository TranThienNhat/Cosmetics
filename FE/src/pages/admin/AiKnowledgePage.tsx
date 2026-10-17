import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Switch,
  Modal,
  Form,
  Space,
  message,
  Popconfirm,
  Badge,
  Tooltip,
} from "antd";
import {
  CustomerServiceOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import api from "../../utils/api";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ChatKnowledgeItem {
  id: number;
  user_query: string;
  normalized_query: string;
  intent: string;
  response: string;
  suggested_products?: any[];
  quick_suggestions?: string[];
  source: string;
  use_count: number;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

interface KnowledgeStats {
  totalRecords: number;
  totalHitCount: number;
  activeRecords: number;
  topIntents: Array<{ intent: string; count: number; hits: number }>;
  sourceBreakdown: Array<{ source: string; count: number; hits: number }>;
}

const AiKnowledgePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [list, setList] = useState<ChatKnowledgeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntent, setSelectedIntent] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedActive, setSelectedActive] = useState("ALL");

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ChatKnowledgeItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ChatKnowledgeItem | null>(null);
  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadKnowledgeList(page);
  }, [page, selectedIntent, selectedSource, selectedActive]);

  const loadStats = async () => {
    try {
      const res = await api.get("/ai/knowledge/stats");
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Load Knowledge Stats Error:", error);
    }
  };

  const loadKnowledgeList = async (targetPage: number = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page: targetPage,
        limit,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedIntent !== "ALL") params.intent = selectedIntent;
      if (selectedSource !== "ALL") params.source = selectedSource;
      if (selectedActive !== "ALL") params.is_active = selectedActive;

      const res = await api.get("/ai/knowledge", { params });
      if (res.data?.success) {
        setList(res.data.list || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể tải danh sách tri thức");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadKnowledgeList(1);
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await api.patch(`/ai/knowledge/${id}/toggle`);
      if (res.data?.success) {
        message.success("Đổi trạng thái thành công!");
        loadKnowledgeList(page);
        loadStats();
      }
    } catch (error: any) {
      message.error("Lỗi khi đổi trạng thái");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/ai/knowledge/${id}`);
      if (res.data?.success) {
        message.success("Xóa bản ghi tri thức thành công!");
        loadKnowledgeList(page);
        loadStats();
      }
    } catch (error: any) {
      message.error("Lỗi khi xóa bản ghi");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      intent: "BEAUTY_ADVICE",
      source: "manual",
      is_active: true,
    });
    setModalVisible(true);
  };

  const handleOpenEditModal = (item: ChatKnowledgeItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      user_query: item.user_query,
      intent: item.intent,
      response: item.response,
      source: item.source,
      is_active: Boolean(item.is_active),
    });
    setModalVisible(true);
  };

  const handleSaveModal = async (values: any) => {
    try {
      if (editingItem) {
        const res = await api.put(`/ai/knowledge/${editingItem.id}`, values);
        if (res.data?.success) {
          message.success("Cập nhật tri thức thành công!");
          setModalVisible(false);
          loadKnowledgeList(page);
        }
      } else {
        const res = await api.post("/ai/knowledge", values);
        if (res.data?.success) {
          message.success("Thêm mới tri thức thành công!");
          setModalVisible(false);
          loadKnowledgeList(1);
          loadStats();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi lưu tri thức");
    }
  };

  // Xuất file dataset huấn luyện model
  const handleExportDataset = async (format: "jsonl" | "csv") => {
    try {
      setExporting(true);
      const res = await api.get(`/ai/knowledge/export?format=${format}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: format === "csv" ? "text/csv;charset=utf-8" : "application/x-jsonlines;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `linh_cosmetics_chat_dataset_${dateStr}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Xuất dataset ${format.toUpperCase()} thành công! Bạn có thể dùng để fine-tune model riêng.`);
    } catch (error) {
      message.error("Lỗi khi tải file dataset");
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 65,
      render: (id: number) => <span className="text-gray-400 font-mono text-xs">#{id}</span>,
    },
    {
      title: "Câu hỏi của khách (User Query)",
      dataIndex: "user_query",
      key: "user_query",
      width: "30%",
      render: (text: string, record: ChatKnowledgeItem) => (
        <div>
          <div className="font-medium text-charcoal text-sm line-clamp-2">{text}</div>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <Tag color="magenta" className="text-[11px] rounded-sm m-0">
              {record.intent || "BEAUTY_ADVICE"}
            </Tag>
            <span className="text-[11px] text-gray-400">
              Chuẩn hóa: <code className="text-gray-500 bg-gray-50 px-1 py-0.5 rounded">{record.normalized_query?.slice(0, 35)}...</code>
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Câu trả lời của Chatbot",
      dataIndex: "response",
      key: "response",
      render: (text: string) => (
        <Paragraph
          ellipsis={{ rows: 2, expandable: false }}
          className="!m-0 text-xs text-gray-600 leading-relaxed font-sans"
        >
          {text}
        </Paragraph>
      ),
    },
    {
      title: "Nguồn",
      dataIndex: "source",
      key: "source",
      width: 120,
      render: (source: string) => {
        let color = "purple";
        let label = "LLM Tự học";
        if (source === "manual") {
          color = "blue";
          label = "Thủ công";
        } else if (source === "intent_engine") {
          color = "orange";
          label = "Rule Intent";
        }
        return <Tag color={color} className="text-xs">{label}</Tag>;
      },
    },
    {
      title: "Tái sử dụng",
      dataIndex: "use_count",
      key: "use_count",
      width: 100,
      align: "center" as const,
      sorter: (a: ChatKnowledgeItem, b: ChatKnowledgeItem) => a.use_count - b.use_count,
      render: (count: number) => (
        <Badge
          count={`${count} lần`}
          style={{
            backgroundColor: count > 1 ? "#52c41a" : "#d9d9d9",
            color: count > 1 ? "#fff" : "#666",
            fontSize: "11px",
            boxShadow: "none",
          }}
        />
      ),
    },
    {
      title: "Kích hoạt",
      dataIndex: "is_active",
      key: "is_active",
      width: 90,
      align: "center" as const,
      render: (active: boolean | number, record: ChatKnowledgeItem) => (
        <Switch
          size="small"
          checked={Boolean(active)}
          onChange={() => handleToggleActive(record.id)}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 130,
      align: "center" as const,
      render: (_: any, record: ChatKnowledgeItem) => (
        <Space size="small">
          <Tooltip title="Xem trước câu trả lời">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setPreviewItem(record)}
              className="text-gray-500 hover:text-primary"
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(record)}
              className="text-gray-500 hover:text-blue-500"
            />
          </Tooltip>
          <Popconfirm
            title="Xóa tri thức này?"
            description="Chatbot sẽ không còn tái sử dụng câu trả lời này nữa."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, size: "small" }}
            cancelButtonProps={{ size: "small" }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="text-gray-400 hover:text-red-500"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 font-serif text-charcoal flex items-center gap-2.5">
            <RobotOutlined className="text-[#BC8F8F]" />
            Bộ Nhớ Tri Thức Chatbot & Huấn Luyện AI
          </Title>
          <Text className="text-gray text-sm">
            Tự động ghi nhớ câu trả lời của LLM để phản hồi ngay lập tức (0ms) khi có câu hỏi tương tự, đồng thời trích xuất dataset để huấn luyện mô hình riêng.
          </Text>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={() => handleExportDataset("jsonl")}
            className="rounded-lg border-[#BC8F8F] text-[#BC8F8F] hover:!border-[#a37676] hover:!text-[#a37676] font-medium"
          >
            Xuất Dataset (JSONL)
          </Button>

          <Button
            icon={<FileTextOutlined />}
            loading={exporting}
            onClick={() => handleExportDataset("csv")}
            className="rounded-lg"
          >
            Xuất CSV
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            className="bg-[#BC8F8F] hover:!bg-[#a37676] border-none rounded-lg font-medium"
          >
            Thêm Tri Thức Mới
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-gray-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">
                  Mẫu tri thức đã lưu
                </Text>
                <div className="text-2xl font-bold font-serif text-charcoal mt-1">
                  {stats?.totalRecords || 0}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FAF3EC] text-[#BC8F8F] flex items-center justify-center text-lg">
                <FileTextOutlined />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Đang hoạt động: <strong className="text-green-600">{stats?.activeRecords || 0}</strong>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-gray-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">
                  Lượt tái sử dụng (Hits)
                </Text>
                <div className="text-2xl font-bold font-serif text-green-600 mt-1">
                  {stats?.totalHitCount || 0}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-lg">
                <ThunderboltOutlined />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Tiết kiệm token LLM & phản hồi dưới 30ms
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-gray-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">
                  Mô hình học tự động
                </Text>
                <div className="text-2xl font-bold font-serif text-purple-600 mt-1">
                  {stats?.sourceBreakdown?.find((s) => s.source === "llm")?.count || 0}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                <RobotOutlined />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Được tự động lưu sau mỗi phiên chat
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-gray-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">
                  Chuẩn hóa Dataset
                </Text>
                <div className="text-2xl font-bold font-serif text-blue-600 mt-1">
                  JSONL
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                <CheckCircleOutlined />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Chuẩn OpenAI / LLaMA ChatML
            </div>
          </Card>
        </Col>
      </Row>

      {/* FILTER & TABLE */}
      <Card className="rounded-2xl border-gray-100 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <Input
              placeholder="Tìm theo câu hỏi hoặc câu trả lời..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleSearch}
              className="rounded-lg"
              allowClear
            />
            <Button onClick={handleSearch} className="rounded-lg">
              Tìm kiếm
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={selectedSource}
              onChange={(v) => {
                setSelectedSource(v);
                setPage(1);
              }}
              style={{ width: 140 }}
              className="rounded-lg"
            >
              <Option value="ALL">Mọi nguồn</Option>
              <Option value="llm">LLM Tự học</Option>
              <Option value="manual">Thủ công</Option>
            </Select>

            <Select
              value={selectedActive}
              onChange={(v) => {
                setSelectedActive(v);
                setPage(1);
              }}
              style={{ width: 140 }}
              className="rounded-lg"
            >
              <Option value="ALL">Mọi trạng thái</Option>
              <Option value="1">Đang bật</Option>
              <Option value="0">Đang tắt</Option>
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadKnowledgeList(page);
                loadStats();
              }}
              className="rounded-lg"
            />
          </div>
        </div>

        <Table
          dataSource={list}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            onChange: (p) => setPage(p),
            showTotal: (tot) => `Tổng cộng ${tot} bản ghi`,
          }}
          scroll={{ x: 800 }}
          className="overflow-hidden"
        />
      </Card>

      {/* MODAL THÊM / SỬA TRI THỨC */}
      <Modal
        title={
          <span className="font-serif text-lg text-charcoal flex items-center gap-2">
            <RobotOutlined className="text-[#BC8F8F]" />
            {editingItem ? "Chỉnh sửa Tri Thức Chatbot" : "Thêm Tri Thức & Mẫu Phản Hồi Mới"}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        centered
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveModal}
          className="mt-4"
        >
          <Form.Item
            name="user_query"
            label="Câu hỏi của khách hàng (Mẫu câu hỏi tương tự)"
            rules={[{ required: true, message: "Vui lòng nhập câu hỏi mẫu" }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="Ví dụ: Da dầu mụn nhạy cảm nên dùng loại kem dưỡng nào nhẹ nhàng không bí da?"
              className="rounded-lg"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="intent"
                label="Nhãn Intent (Phân loại ý định)"
                rules={[{ required: true, message: "Vui lòng nhập hoặc chọn Intent" }]}
              >
                <Select placeholder="Chọn intent" className="rounded-lg">
                  <Option value="BEAUTY_ADVICE">Tư vấn sắc đẹp chung (BEAUTY_ADVICE)</Option>
                  <Option value="SKINCARE_OILY_ACNE">Da dầu mụn (SKINCARE_OILY_ACNE)</Option>
                  <Option value="ANTI_AGING">Chống lão hóa (ANTI_AGING)</Option>
                  <Option value="SUNSCREEN_ADVICE">Kem chống nắng (SUNSCREEN_ADVICE)</Option>
                  <Option value="LIPSTICK_MAKEUP">Son môi & Trang điểm (LIPSTICK_MAKEUP)</Option>
                  <Option value="CLEANSING_ROUTINE">Làm sạch & Tẩy trang (CLEANSING_ROUTINE)</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="source" label="Nguồn tạo">
                <Select className="rounded-lg">
                  <Option value="manual">Thủ công do Admin biên soạn</Option>
                  <Option value="llm">Trích xuất từ LLM</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="response"
            label="Câu trả lời chuẩn (Hỗ trợ định dạng Markdown và Link sản phẩm)"
            rules={[{ required: true, message: "Vui lòng nhập nội dung câu trả lời chuẩn" }]}
          >
            <Input.TextArea
              rows={8}
              placeholder="Nhập câu trả lời chi tiết. Nàng có thể gắn link sản phẩm dạng [Tên sản phẩm](/products/ID)..."
              className="rounded-lg font-sans"
            />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked">
            <Switch checkedChildren="Bật sử dụng" unCheckedChildren="Tắt" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button onClick={() => setModalVisible(false)} className="rounded-lg">
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-[#BC8F8F] hover:!bg-[#a37676] border-none rounded-lg"
            >
              {editingItem ? "Lưu thay đổi" : "Thêm tri thức"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL XEM TRƯỚC CÂU TRẢ LỜI */}
      <Modal
        title={
          <span className="font-serif text-lg text-charcoal flex items-center gap-2">
            <EyeOutlined className="text-[#BC8F8F]" />
            Xem Trước Phản Hồi Chatbot
          </span>
        }
        open={Boolean(previewItem)}
        onCancel={() => setPreviewItem(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewItem(null)} className="rounded-lg">
            Đóng
          </Button>,
        ]}
        centered
        width={650}
      >
        {previewItem && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <Text className="text-xs text-gray-400 block font-semibold uppercase">
                Câu hỏi của khách:
              </Text>
              <Text strong className="text-sm text-charcoal block mt-0.5">
                {previewItem.user_query}
              </Text>
            </div>

            <div className="p-4 bg-[#FAF3EC]/30 rounded-xl border border-[#BC8F8F]/30">
              <div className="text-xs text-[#BC8F8F] font-semibold mb-2 flex items-center gap-1.5">
                <CustomerServiceOutlined />
                <span>Trợ lý Linh Beauty Advisor trả lời:</span>
              </div>
              <div className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed">
                <ReactMarkdown>{previewItem.response}</ReactMarkdown>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Đã tái sử dụng: <strong>{previewItem.use_count}</strong> lần</span>
              <span>Cập nhật lần cuối: {new Date(previewItem.updated_at).toLocaleString("vi-VN")}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AiKnowledgePage;

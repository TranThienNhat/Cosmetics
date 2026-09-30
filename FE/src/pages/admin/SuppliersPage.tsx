import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Typography,
  Input,
  Select,
  Tag,
  message,
  Card,
  Modal,
  Form,
  Row,
  Col,
  Space,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import api from "../../utils/api";

const { Title, Text } = Typography;
const { Search } = Input;

interface Supplier {
  id: number;
  name: string;
  contact_name?: string;
  phone: string;
  email?: string;
  address?: string;
  note?: string;
  status: "active" | "inactive";
  created_at: string;
}

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data.data || []);
    } catch (err: any) {
      message.error("Không thể tải danh sách nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, values);
        message.success("Cập nhật đối tác thành công");
      } else {
        await api.post("/suppliers", values);
        message.success("Thêm nhà cung cấp mới thành công");
      }
      handleCancel();
      fetchSuppliers();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (record: Supplier) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/suppliers/${id}`);
      message.success("Đã xóa nhà cung cấp");
      fetchSuppliers();
    } catch (err: any) {
      message.error(
        err.response?.data?.message || "Không thể xóa do ràng buộc dữ liệu",
      );
    }
  };

  const filteredSuppliers = suppliers.filter((item) => {
    const matchesSearch =
      searchText.trim() === "" ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phone.includes(searchText) ||
      item.contact_name?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: "Nhà cung cấp",
      dataIndex: "name",
      key: "name",
      ellipsis: { showTitle: true },
      render: (text: string, record: Supplier) => (
        <div className="max-w-[220px]">
          <Text strong className="truncate block" title={text}>{text}</Text>
          <div style={{ fontSize: "12px", color: "#999" }} className="truncate" title={record.contact_name}>
            Người đại diện: {record.contact_name || "---"}
          </div>
        </div>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      ellipsis: { showTitle: true },
      render: (_: any, record: Supplier) => (
        <div style={{ fontSize: "13px" }} className="max-w-[180px]">
          <div className="truncate">{record.phone}</div>
          <div className="text-gray-400 truncate" title={record.email}>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Đang hợp tác" : "Tạm ngưng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      align: "right" as const,
      render: (_: any, record: Supplier) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa đối tác này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <Title level={2} className="!mb-0 !text-xl sm:!text-2xl !font-serif">
          Nhà cung cấp
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Thêm đối tác
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-6">
          <Search
            placeholder="Tìm tên, SĐT hoặc người đại diện..."
            allowClear
            className="w-full sm:w-80"
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            className="w-full sm:w-44"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value="active">Đang hợp tác</Select.Option>
            <Select.Option value="inactive">Tạm ngưng</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchSuppliers} className="w-full sm:w-auto">
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingId ? "Cập nhật đối tác" : "Thêm nhà cung cấp mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText="Lưu thông tin"
        cancelText="Hủy"
        width={window.innerWidth < 700 ? "95%" : 650}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: "active" }}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col xs={24} sm={14}>
              <Form.Item
                name="name"
                label="Tên nhà cung cấp"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="Ví dụ: Mỹ phẩm Ohui" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item name="contact_name" label="Người đại diện">
                <Input placeholder="Tên quản lý" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
              >
                <Input placeholder="090x xxx xxx" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: "email", message: "Email không hợp lệ" }]}
              >
                <Input placeholder="partner@gmail.com" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="address" label="Địa chỉ">
                <Input.TextArea rows={2} placeholder="Số nhà, tên đường..." />
              </Form.Item>
            </Col>

            {/* Trạng thái hợp tác với 2 nút màu */}
            <Col span={24}>
              <Form.Item label="Trạng thái hợp tác" required>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) => prev.status !== curr.status}
                >
                  {({ getFieldValue, setFieldsValue }) => {
                    const status = getFieldValue("status");
                    return (
                      <div className="flex gap-2">
                        <Button
                          size="small"
                          className={`rounded-full px-5 h-7 text-[12px] transition-all border-none ${
                            status === "active"
                              ? "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f] shadow-sm font-medium"
                              : "bg-transparent text-gray-400 hover:text-[#52c41a]"
                          }`}
                          style={{
                            border:
                              status === "active"
                                ? "1px solid #b7eb8f"
                                : "1px solid #d9d9d9",
                          }}
                          onClick={() => setFieldsValue({ status: "active" })}
                        >
                          Đang hợp tác
                        </Button>

                        <Button
                          size="small"
                          className={`rounded-full px-5 h-7 text-[12px] transition-all border-none ${
                            status === "inactive"
                              ? "bg-[#f5f5f5] text-[#8c8c8c] border-[#d9d9d9] shadow-sm font-medium"
                              : "bg-transparent text-gray-400 hover:text-gray-600"
                          }`}
                          style={{
                            border:
                              status === "inactive"
                                ? "1px solid #d9d9d9"
                                : "1px solid #d9d9d9",
                          }}
                          onClick={() => setFieldsValue({ status: "inactive" })}
                        >
                          Tạm ngưng
                        </Button>
                      </div>
                    );
                  }}
                </Form.Item>
                <Form.Item name="status" noStyle>
                  <input type="hidden" />
                </Form.Item>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="note" label="Ghi chú nội bộ">
                <Input.TextArea
                  rows={2}
                  placeholder="Chính sách chiết khấu, công nợ..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Typography,
} from "antd";
import {
  GiftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/helpers";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed_amount";
  value: number;
  min_order_value?: number;
  max_discount_value?: number;
  total_limit?: number;
  used_count: number;
  start_date?: string;
  end_date?: string;
  is_active: number;
  created_at: string;
}

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get("/coupons");
      setCoupons(response.data.coupons || []);
    } catch (error: any) {
      message.error("Không thể tải danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Handle create/update coupon
  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        start_date: values.dateRange?.[0]?.format("YYYY-MM-DD HH:mm:ss"),
        end_date: values.dateRange?.[1]?.format("YYYY-MM-DD HH:mm:ss"),
      };
      delete formData.dateRange;

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, formData);
        message.success("Cập nhật mã giảm giá thành công");
      } else {
        await api.post("/coupons", formData);
        message.success("Tạo mã giảm giá thành công");
      }

      setModalVisible(false);
      setEditingCoupon(null);
      form.resetFields();
      fetchCoupons();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra";
      message.error(errorMessage);
    }
  };

  // Handle delete coupon
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/coupons/${id}`);
      message.success("Xóa mã giảm giá thành công");
      fetchCoupons();
    } catch (error: any) {
      message.error("Không thể xóa mã giảm giá");
    }
  };

  // Handle edit
  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.setFieldsValue({
      ...coupon,
      dateRange:
        coupon.start_date && coupon.end_date
          ? [dayjs(coupon.start_date), dayjs(coupon.end_date)]
          : null,
    });
    setModalVisible(true);
  };

  // Handle create new
  const handleCreate = () => {
    setEditingCoupon(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <Tag color="blue" className="font-mono">
          {code}
        </Tag>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "percentage" ? "green" : "orange"}>
          {type === "percentage" ? "Phần trăm" : "Số tiền cố định"}
        </Tag>
      ),
    },
    {
      title: "Giá trị",
      dataIndex: "value",
      key: "value",
      render: (value: number, record: Coupon) =>
        record.type === "percentage" ? `${value}%` : formatCurrency(value),
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "min_order_value",
      key: "min_order_value",
      render: (value: number) => (value ? formatCurrency(value) : "-"),
    },
    {
      title: "Giảm tối đa",
      dataIndex: "max_discount_value",
      key: "max_discount_value",
      render: (value: number) => (value ? formatCurrency(value) : "-"),
    },
    {
      title: "Số lượng",
      dataIndex: "total_limit",
      key: "total_limit",
      render: (total_limit: number, record: Coupon) => (
        <span>
          {record.used_count || 0} / {total_limit || "∞"}
        </span>
      ),
    },
    {
      title: "Thời gian",
      key: "duration",
      render: (record: Coupon) => (
        <div className="text-xs">
          {record.start_date && (
            <div>Từ: {dayjs(record.start_date).format("DD/MM/YYYY")}</div>
          )}
          {record.end_date && (
            <div>Đến: {dayjs(record.end_date).format("DD/MM/YYYY")}</div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (is_active: number) => (
        <Tag color={is_active ? "green" : "red"}>
          {is_active ? "Hoạt động" : "Tạm dừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (record: Coupon) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ fontSize: 16 }} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa mã giảm giá này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy">
            <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: 16 }} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <Title level={2} className="!mb-0 flex items-center gap-2">
            <GiftOutlined style={{ fontSize: 24, color: "#BC8F8F" }} />
            Quản lý mã giảm giá
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="bg-primary border-primary">
            Tạo mã giảm giá
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={coupons}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng ${total} mã giảm giá`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCoupon ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCoupon(null);
          form.resetFields();
        }}
        footer={null}
        width={600}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4">
          <Form.Item
            name="code"
            label="Mã giảm giá"
            rules={[
              { required: true, message: "Vui lòng nhập mã giảm giá" },
              {
                pattern: /^[A-Z0-9]+$/,
                message: "Mã chỉ được chứa chữ hoa và số",
              },
            ]}>
            <Input placeholder="VD: WELCOME10" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại giảm giá"
            rules={[{ required: true, message: "Vui lòng chọn loại" }]}>
            <Select placeholder="Chọn loại giảm giá">
              <Option value="percentage">Phần trăm (%)</Option>
              <Option value="fixed_amount">Số tiền cố định (VNĐ)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="value"
            label="Giá trị"
            rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}>
            <InputNumber
              min={0}
              className="w-full"
              placeholder="VD: 10 (cho 10%) hoặc 50000 (cho 50,000đ)"
            />
          </Form.Item>

          <Form.Item name="min_order_value" label="Giá trị đơn hàng tối thiểu">
            <InputNumber
              min={0}
              className="w-full"
              placeholder="VD: 100000 (cho 100,000đ)"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>

          <Form.Item
            name="max_discount_value"
            label="Giảm giá tối đa"
            tooltip="Chỉ áp dụng cho loại phần trăm">
            <InputNumber
              min={0}
              className="w-full"
              placeholder="VD: 50000 (cho 50,000đ)"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>

          <Form.Item
            name="total_limit"
            label="Số lượng sử dụng"
            tooltip="Để trống nếu không giới hạn">
            <InputNumber min={1} className="w-full" placeholder="VD: 100" />
          </Form.Item>

          <Form.Item name="dateRange" label="Thời gian hiệu lực">
            <RangePicker
              showTime
              className="w-full"
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            />
          </Form.Item>

          <Form.Item name="is_active" label="Trạng thái" initialValue={1}>
            <Select>
              <Option value={1}>Hoạt động</Option>
              <Option value={0}>Tạm dừng</Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-primary border-primary">
                {editingCoupon ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouponManagement;

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
  Descriptions,
} from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/helpers";

const { Title, Text } = Typography;
const { Search } = Input;

interface Order {
  id: number;
  order_code: string;
  user_id: number;
  shipping_name: string;    // Trường mới
  shipping_phone: string;   // Trường mới
  shipping_address: string; // Trường mới
  notes?: string;           // Trường mới
  shipping_fee: number;     // Trường mới
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  coupon_id?: number;
  status: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  created_at: string;
  items: any[];
}

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders");
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      message.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      message.success("Cập nhật trạng thái đơn hàng thành công");
      loadOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchText.trim() === "" ||
      order.order_code.toLowerCase().includes(searchText.toLowerCase()) ||
      order.shipping_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      order.shipping_phone?.includes(searchText);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      processing: "blue",
      shipped: "cyan",
      completed: "green",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      shipped: "Đang giao",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "order_code",
      key: "order_code",
      render: (order_code: string) => (
        <span className="font-mono text-primary">{order_code}</span>
      ),
    },
    // THÊM CỘT KHÁCH HÀNG VÀO BẢNG
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: Order) => (
        <div>
          <div>{record.shipping_name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.shipping_phone}</div>
        </div>
      )
    },
    {
      title: "Tổng tiền",
      dataIndex: "final_amount",
      key: "final_amount",
      render: (final_amount: number) => formatCurrency(Number(final_amount)),
      sorter: (a: Order, b: Order) => Number(a.final_amount) - Number(b.final_amount),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Order) => {
        const isDisabled = status === "cancelled" || status === "completed";
        if (isDisabled) {
          return <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>;
        }

        return (
          <Select
            value={status}
            onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
            size="small"
            bordered={false}
            style={{ width: "auto", minWidth: "120px" }}
            className="status-select"
          >
            {(["pending", "processing", "shipped", "completed", "cancelled"] as const).map((s) => (
              <Select.Option key={s} value={s}>
                <Tag color={getStatusColor(s)} className="m-0">{getStatusText(s)}</Tag>
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
      sorter: (a: Order, b: Order) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      render: (_: any, record: Order) => (
        <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => handleViewOrder(record)} />
      ),
    },
  ];

  return (
    <>
      <style>
        {`
          .status-select .ant-select-selector { border: none !important; box-shadow: none !important; background: transparent !important; padding: 0 !important; height: auto !important; }
          .status-select .ant-select-selection-item { padding: 0 !important; }
          .status-select .ant-select-arrow { display: none; }
        `}
      </style>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Title level={2} className="!mb-0">Quản lý đơn hàng</Title>
        </div>

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <Search
              placeholder="Tìm mã đơn, tên hoặc SĐT khách..."
              allowClear
              style={{ width: 400 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select style={{ width: 150 }} value={statusFilter} onChange={setStatusFilter}>
              <Select.Option value="all">Tất cả trạng thái</Select.Option>
              <Select.Option value="pending">Chờ xử lý</Select.Option>
              <Select.Option value="processing">Đang xử lý</Select.Option>
              <Select.Option value="shipped">Đang giao</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
            </Select>
            <Button icon={<SearchOutlined />} onClick={loadOrders}>Làm mới</Button>
          </div>

          <Table
            dataSource={filteredOrders}
            columns={columns}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* MODAL CHI TIẾT - GIỮ NGUYÊN GIAO DIỆN CHỈ THÊM TRƯỜNG */}
        <Modal
          title={`Chi tiết đơn hàng ${selectedOrder?.order_code}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedOrder && (
            <div className="space-y-6">
              <Descriptions title="Thông tin đơn hàng" bordered column={2}>
                <Descriptions.Item label="Khách hàng">
                  <Text strong>{selectedOrder.shipping_name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedOrder.shipping_phone}
                </Descriptions.Item>
                
                <Descriptions.Item label="Địa chỉ giao hàng" span={2}>
                  {selectedOrder.shipping_address}
                </Descriptions.Item>

                <Descriptions.Item label="Ghi chú" span={2}>
                  <Text italic type="secondary">{selectedOrder.notes || "Không có ghi chú"}</Text>
                </Descriptions.Item>

                <Descriptions.Item label="Tổng tiền hàng">
                  {formatCurrency(Number(selectedOrder.total_amount))}
                </Descriptions.Item>
                <Descriptions.Item label="Phí vận chuyển">
                  + {formatCurrency(Number(selectedOrder.shipping_fee))}
                </Descriptions.Item>
                <Descriptions.Item label="Giảm giá">
                  - {formatCurrency(Number(selectedOrder.discount_amount))}
                </Descriptions.Item>
                <Descriptions.Item label="Thực trả">
                  <Text type="danger" strong>{formatCurrency(Number(selectedOrder.final_amount))}</Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(selectedOrder.status)}>{getStatusText(selectedOrder.status)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                   {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}
                </Descriptions.Item>
              </Descriptions>

              {selectedOrder.items?.length > 0 && (
                <Descriptions title="Sản phẩm đã đặt" bordered column={1}>
                  {selectedOrder.items.map((item: any) => (
                    <Descriptions.Item key={item.id} label={item.name}>
                      <div className="flex justify-between w-full">
                        <span>
                            {item.variant_name && <Tag color="pink">{item.variant_name}</Tag>}
                            {formatCurrency(Number(item.price))} x {item.quantity}
                        </span>
                        <Text strong>{formatCurrency(Number(item.price) * item.quantity)}</Text>
                      </div>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              )}
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default AdminOrdersPage;
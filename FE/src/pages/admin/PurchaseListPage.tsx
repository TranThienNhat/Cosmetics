import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Modal,
  message,
  Tooltip,
} from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import dayjs from "dayjs";

const { Title } = Typography;

interface PurchaseReceipt {
  id: number;
  supplier_name: string;
  user_name: string;
  total_amount: number;
  created_at: string;
}

const PurchaseListPage: React.FC = () => {
  const [data, setData] = useState<PurchaseReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();

  const fetchPurchases = async (
    page: number = 1,
    limit: number = 10
  ) => {
    setLoading(true);

    try {
      /**
       * Nếu route backend của bạn là:
       * router.get("/", purchaseReceiptController.index)
       * thì dùng "/purchase-receipts"
       *
       * Nếu bạn map index vào "/purchase-receipts/all"
       * thì đổi lại thành "/purchase-receipts/all"
       */
      const res = await api.get("/purchase-receipts/all", {
        params: {
          page,
          limit,
        },
      });

      setData(res.data.data || []);

      setPagination({
        current: res.data.meta?.page || page,
        pageSize: res.data.meta?.limit || limit,
        total: res.data.meta?.total || 0,
      });
    } catch (e) {
      console.error("Lỗi tải danh sách phiếu nhập:", e);
      message.error("Không thể tải danh sách phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(
      Number(pagination.current) || 1,
      Number(pagination.pageSize) || 10
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const page = newPagination.current || 1;
    const pageSize = newPagination.pageSize || 10;

    fetchPurchases(page, pageSize);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa phiếu nhập?",
      content:
        "Hệ thống sẽ hoàn tác tồn kho tương ứng. Thao tác này không thể khôi phục.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await api.delete(`/purchase-receipts/${id}`);

          message.success("Xóa phiếu nhập thành công");

          const currentPage = Number(pagination.current) || 1;
          const pageSize = Number(pagination.pageSize) || 10;

          fetchPurchases(currentPage, pageSize);
        } catch (e) {
          console.error("Lỗi khi xóa phiếu:", e);
          message.error("Lỗi khi xóa phiếu");
        }
      },
    });
  };

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "id",
      key: "id",
      render: (id: number) => <b>#{id}</b>,
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplier_name",
      key: "supplier_name",
      render: (text: string) => text || "Không có",
    },
    {
      title: "Người lập",
      dataIndex: "user_name",
      key: "user_name",
      render: (text: string) => text || "Không có",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (val: any) => (
        <Tag color="blue">
          {Number(val || 0).toLocaleString("vi-VN")}đ
        </Tag>
      ),
    },
    {
      title: "Ngày nhập",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "Không có",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: PurchaseReceipt) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa & hoàn tác kho">
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/purchase/edit/${record.id}`)}
            />
          </Tooltip>

          <Tooltip title="Xóa phiếu nhập">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <Title level={2} className="!mb-0 !text-xl sm:!text-2xl !font-serif">
          Quản lý Phiếu Nhập Hàng
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/admin/purchase/create")}
        >
          Tạo phiếu mới
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 700 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            responsive: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total}`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default PurchaseListPage;
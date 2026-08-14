import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  message,
  Card,
  Modal,
  Form,
  Switch,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../../utils/api";

const { Title } = Typography;
const { Search } = Input;

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean | number;
  created_at: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      message.success("Xóa người dùng thành công");
      loadUsers();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Không thể xóa người dùng"
      );
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, values);
        message.success("Cập nhật người dùng thành công");
      }
      setModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      loadUsers();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Không thể cập nhật người dùng"
      );
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      is_active: user.is_active === 1 || user.is_active === true,
    });
    setModalVisible(true);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          {name}
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => phone || "-",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        // Cập nhật hàm render để hiển thị màu theo 3 quyền
        let color = "blue";
        let label = "Người dùng";

        if (role === "admin") {
          color = "red";
          label = "Quản trị viên";
        } else if (role === "staff") {
          color = "orange";
          label = "Nhân viên";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean | number) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Bị khóa"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={2} className="!mb-0">
          Quản lý người dùng
        </Title>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Search
            placeholder="Tìm kiếm theo tên hoặc email..."
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Vai trò"
            style={{ width: 150 }}
            value={roleFilter}
            onChange={setRoleFilter}
          >
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="admin">Quản trị viên</Select.Option>
            <Select.Option value="staff">Nhân viên</Select.Option> {/* Thêm lọc Nhân viên */}
            <Select.Option value="user">Người dùng</Select.Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={loadUsers}>
            Làm mới
          </Button>
        </div>

        <Table
          dataSource={filteredUsers}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="Sửa thông tin người dùng"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="Nhập tên người dùng" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item name="role" label="Vai trò">
            <Select>
              <Select.Option value="user">Người dùng</Select.Option>
              <Select.Option value="staff">Nhân viên</Select.Option> {/* Thêm tùy chọn Nhân viên vào Form */}
              <Select.Option value="admin">Quản trị viên</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Bị khóa" />
          </Form.Item>

          <div className="flex justify-end gap-4">
            <Button
              onClick={() => {
                setModalVisible(false);
                setEditingUser(null);
                form.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
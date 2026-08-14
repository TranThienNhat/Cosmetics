import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Typography,
  Input,
  message,
  Card,
  Modal,
  Form,
  Row,
  Col,
  Space,
  Popconfirm,
  Upload,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,

  ReloadOutlined,

} from "@ant-design/icons";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/helpers";

const { Title, Text } = Typography;
const { Search } = Input;

// Helper tạo Slug
const createSlug = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

interface Blog {
  id: number;
  title: string;
  slug: string;
  content: string;
  cover_image: string;
  created_at: string;
}

const BlogAdmin: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/blogs");
      setBlogs(res.data.data || []);
    } catch (err: any) {
      message.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Blog) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      cover_image: record.cover_image
        ? [
          {
            uid: "-1",
            name: "image.png",
            status: "done",
            url: getImageUrl(record.cover_image),
            thumbUrl: getImageUrl(record.cover_image),
          },
        ]
        : [],
    });
    setIsModalOpen(true);
  };

  const onFinish = async (values: any) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("slug", values.slug);
    formData.append("content", values.content);

    const file = values.cover_image?.[0]?.originFileObj;
    if (file) {
      formData.append("cover_image", file);
    }

    try {
      if (editingId) {
        await api.put(`/blogs/${editingId}`, formData);
        message.success("Cập nhật bài viết thành công");
      } else {
        await api.post("/blogs", formData);
        message.success("Đăng bài viết thành công");
      }
      handleCancel();
      fetchBlogs();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/blogs/${id}`);
      message.success("Đã xóa bài viết");
      fetchBlogs();
    } catch (err) {
      message.error("Không thể xóa bài viết");
    }
  };

  // Logic lọc bài viết
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchText.toLowerCase()) ||
      blog.slug.toLowerCase().includes(searchText.toLowerCase()),
  );

  const columns = [
    {
      title: "Ảnh bìa",
      dataIndex: "cover_image",
      key: "cover_image",
      width: 120,
      render: (img: string) => (
        <img
          src={getImageUrl(img)}
          className="w-16 h-10 object-cover rounded shadow-sm border"
          alt="blog"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/150";
          }}
        />
      ),
    },
    {
      title: "Thông tin bài viết",
      key: "info",
      render: (_: any, record: Blog) => (
        <div className="flex flex-col">
          <Text strong>{record.title}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            slug: {record.slug}
          </Text>
        </div>
      ),
    },
    {
      title: "Ngày đăng",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
      sorter: (a: Blog, b: Blog) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      align: "right" as const,
      render: (_: any, record: Blog) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa bài viết này?"
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
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-0">
            Quản lý Blog
          </Title>
          <Text type="secondary">
            Chia sẻ bí quyết làm đẹp và xu hướng mỹ phẩm
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Viết bài mới
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Search
            placeholder="Tìm kiếm tiêu đề bài viết..."
            allowClear
            style={{ width: 400 }}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchBlogs}>
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredBlogs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={editingId ? "Chỉnh sửa bài viết" : "Soạn thảo bài viết mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        width={800}
        okText={editingId ? "Cập nhật" : "Đăng bài"}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-4"
          onValuesChange={(changedValues) => {
            if (changedValues.title) {
              form.setFieldsValue({
                slug: createSlug(changedValues.title),
              });
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tiêu đề bài viết"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input placeholder="VD: 5 bước chăm sóc da buổi sáng..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="slug"
                label="Đường dẫn tĩnh (Slug)"
                rules={[
                  { required: true, message: "Slug không được để trống" },
                ]}
              >
                <Input
                  placeholder="5-buoc-cham-soc-da"
                  disabled
                  className="bg-gray-50"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="cover_image"
                label="Ảnh bìa"
                valuePropName="fileList"
                getValueFromEvent={(e: any) =>
                  Array.isArray(e) ? e : e?.fileList
                }
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                  accept="image/*"
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="content"
                label="Nội dung bài viết"
                rules={[
                  { required: true, message: "Nội dung không được để trống" },
                ]}
              >
                <Input.TextArea
                  rows={10}
                  placeholder="Viết nội dung bài viết tại đây..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default BlogAdmin;

import React, { useEffect, useState } from "react";
import { Table, Button, Space, Typography, Input, Popconfirm, message, Card, Modal, Form, Upload, Image, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/helpers";
import { Category } from "../../types";

const { Title } = Typography;
const { Search, TextArea } = Input;

const createSlug = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "").replace(/(\s+)/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
};

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories");
      setCategories(res.data.data || []);
    } catch (e: any) {
      // Lấy message từ backend trả về, nếu không có thì dùng câu mặc định
      message.error(e.response?.data?.message || "Lỗi tải danh mục");
    }
    finally { setLoading(false); }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("slug", values.slug);
      formData.append("description", values.description || "");
      formData.append("parent_id", values.parent_id || "");

      if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
        formData.append("image", values.image[0].originFileObj);
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData, config);
        message.success("Cập nhật thành công");
      } else {
        await api.post("/categories", formData, config);
        message.success("Tạo mới thành công");
      }
      setModalVisible(false);
      loadCategories();
      form.resetFields();
    } catch (e: any) {
      // Lấy message từ backend
      message.error(e.response?.data?.message || "Thao tác thất bại");
    }
  };

  // Tách riêng hàm xóa để bắt lỗi backend
  const handleDelete = async (id?: number) => {
    if (!id) return; // Nếu không có id thì dừng luôn, không gọi API

    try {
      await api.delete(`/categories/${id}`);
      message.success("Xóa danh mục thành công");
      loadCategories();
    } catch (e: any) {
      message.error(e.response?.data?.message || "Không thể xóa danh mục này");
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "image_url",
      width: 80,
      render: (url: string) => <Image src={getImageUrl(url)} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} fallback="/placeholder.jpg" />
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      ellipsis: { showTitle: true },
      render: (name: string) => <span className="font-medium text-charcoal truncate block max-w-[220px]" title={name}>{name}</span>
    },
    {
      title: "Slug",
      dataIndex: "slug",
      ellipsis: { showTitle: true },
      render: (slug: string) => <span className="text-gray-500 font-mono text-xs truncate block max-w-[160px]" title={slug}>{slug}</span>
    },
    {
      title: "Danh mục cha",
      dataIndex: "parent_id",
      ellipsis: { showTitle: true },
      render: (pid: number) => {
        const parent = categories.find(c => c.id === pid);
        return parent ? <span className="truncate block max-w-[180px]" title={parent.name}>{parent.name}</span> : "-";
      }
    },
    {
      title: "Thao tác",
      width: 120,
      render: (_: any, record: Category) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => {
            setEditingCategory(record);
            form.setFieldsValue({
              ...record,
              image: record.image_url ? [{ uid: '-1', status: 'done', url: getImageUrl(record.image_url) }] : []
            });
            setModalVisible(true);
          }} />
          <Popconfirm title="Xóa danh mục này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>Danh mục sản phẩm</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCategory(null); form.resetFields(); setModalVisible(true); }}>Thêm mới</Button>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <Search placeholder="Tìm danh mục..." allowClear style={{ width: 300 }} onSearch={setSearchText} onChange={e => setSearchText(e.target.value)} />
          <Button icon={<ReloadOutlined />} onClick={loadCategories} loading={loading}>Làm mới</Button>
        </div>
        <Table dataSource={categories.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase()))} columns={columns} loading={loading} rowKey="id" />
      </Card>

      <Modal title={editingCategory ? "Sửa danh mục" : "Thêm danh mục"} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} destroyOnClose width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={v => v.name && form.setFieldsValue({ slug: createSlug(v.name) })}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="parent_id" label="Danh mục cha">
            <Select placeholder="Chọn danh mục cha (nếu có)" allowClear>
              {categories.filter(c => c.id !== editingCategory?.id).map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Mô tả"><TextArea rows={3} /></Form.Item>
          <Form.Item name="image" label="Hình ảnh" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}>
            <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} accept="image/*">
              <div><PlusOutlined /><div style={{ marginTop: 8 }}>Chọn ảnh</div></div>
            </Upload>
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu lại</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
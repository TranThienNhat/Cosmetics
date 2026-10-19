import React, { useEffect, useState } from "react";
import { Table, Button, Space, Typography, Input, Popconfirm, message, Card, Modal, Form, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../utils/api";
import { Category } from "../../types";

const { Title } = Typography;
const { Search } = Input;

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
      message.error(e.response?.data?.message || "Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        parent_id: values.parent_id || null,
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        message.success("Cập nhật thành công");
      } else {
        await api.post("/categories", payload);
        message.success("Tạo mới thành công");
      }
      setModalVisible(false);
      loadCategories();
      form.resetFields();
    } catch (e: any) {
      message.error(e.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

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
              name: record.name,
              slug: record.slug,
              parent_id: record.parent_id || undefined,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <Title level={2} style={{ margin: 0 }} className="!text-xl sm:!text-2xl !font-serif">Danh mục sản phẩm</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCategory(null); form.resetFields(); setModalVisible(true); }}>Thêm mới</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Search placeholder="Tìm danh mục..." allowClear className="w-full sm:w-72" onSearch={setSearchText} onChange={e => setSearchText(e.target.value)} />
          <Button icon={<ReloadOutlined />} onClick={loadCategories} loading={loading}>Làm mới</Button>
        </div>
        <Table 
          dataSource={categories.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase()))} 
          columns={columns} 
          loading={loading} 
          rowKey="id" 
          scroll={{ x: 650 }}
        />
      </Card>

      <Modal 
        title={editingCategory ? "Sửa danh mục" : "Thêm danh mục"} 
        open={modalVisible} 
        onCancel={() => setModalVisible(false)} 
        footer={null} 
        destroyOnClose 
        width={window.innerWidth < 640 ? "95%" : 520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={v => v.name && form.setFieldsValue({ slug: createSlug(v.name) })}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}>
            <Input placeholder="Ví dụ: Chăm sóc da" />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: "Vui lòng nhập slug" }]}>
            <Input placeholder="cham-soc-da" />
          </Form.Item>
          <Form.Item name="parent_id" label="Danh mục cha">
            <Select placeholder="Chọn danh mục cha (nếu có)" allowClear>
              {categories.filter(c => c.id !== editingCategory?.id).map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
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
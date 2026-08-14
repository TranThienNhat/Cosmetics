import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Popconfirm,
  message,
  Card,
  Modal,
  Form,
  Upload,
  Image,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,

  ReloadOutlined,
} from "@ant-design/icons";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/helpers";
import { Brand } from "../../types";

const { Title } = Typography;
const { Search, TextArea } = Input;

// Hàm tạo Slug tự động
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

const BrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get("/brands");
      setBrands(response.data.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách thương hiệu");
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const handleSubmit = async (values: any) => {
    const hide = message.loading("Đang lưu dữ liệu...", 0);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("slug", values.slug);
      formData.append("description", values.description || "");

      // Bốc file từ mảng fileList của Upload Antd
      if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
        formData.append("image", values.image[0].originFileObj);
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (editingBrand) {
        await api.put(`/brands/${editingBrand.id}`, formData, config);
        message.success("Cập nhật thành công");
      } else {
        await api.post("/brands", formData, config);
        message.success("Tạo thương hiệu thành công");
      }

      setModalVisible(false);
      loadBrands();
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Thao tác thất bại");
    } finally {
      hide();
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    // Hiển thị ảnh cũ trong khung Upload
    const initialValues = {
      ...brand,
      image: brand.image_url ? [{
        uid: '-1',
        name: 'image.png',
        status: 'done',
        url: getImageUrl(brand.image_url),
      }] : []
    };
    form.setFieldsValue(initialValues);
    setModalVisible(true);
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Logo",
      dataIndex: "image_url",
      key: "image",
      width: 100,
      render: (url: string) => (
        <Image
          src={getImageUrl(url)}
          width={50}
          height={50}
          style={{ objectFit: "cover", borderRadius: "4px" }}
          fallback="/placeholder.jpg"
        />
      ),
    },
    {
      title: "Tên thương hiệu",
      dataIndex: "name",
      key: "name",
      ellipsis: { showTitle: true },
      render: (name: string) => <span className="font-medium text-charcoal truncate block max-w-[200px]" title={name}>{name}</span>
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      ellipsis: { showTitle: true },
      render: (slug: string) => <span className="text-gray-500 font-mono text-xs truncate block max-w-[150px]" title={slug}>{slug}</span>
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: { showTitle: true },
      render: (text: string) => text ? <span className="text-gray-600 truncate block max-w-[280px]" title={text}>{text}</span> : "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_: any, record: Brand) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Xóa thương hiệu này?"
            onConfirm={async () => {
              await api.delete(`/brands/${record.id}`);
              message.success("Đã xóa");
              loadBrands();
            }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Quản lý Thương hiệu</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingBrand(null); form.resetFields(); setModalVisible(true); }}
        >
          Thêm thương hiệu
        </Button>
      </div>

      <Card>
        {/* Search & Refresh Group */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: 24, alignItems: 'center' }}>
          <Search
            placeholder="Tìm kiếm thương hiệu..."
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadBrands}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>

        <Table
          dataSource={filteredBrands}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={editingBrand ? "Cập nhật thương hiệu" : "Thêm thương hiệu mới"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(v) => v.name && form.setFieldsValue({ slug: createSlug(v.name) })}
        >
          <Form.Item name="name" label="Tên thương hiệu" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
            <Input placeholder="Ví dụ: Chanel" />
          </Form.Item>

          <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true }]}>
            <Input placeholder="chanel-paris" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả ngắn gọn về thương hiệu..." />
          </Form.Item>

          <Form.Item
            name="image"
            label="Logo thương hiệu"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Chọn ảnh</div>
              </div>
            </Upload>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu lại</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandsPage;
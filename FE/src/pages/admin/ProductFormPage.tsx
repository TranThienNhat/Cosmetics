import React, { useEffect, useState } from "react";
import { Form, Input, InputNumber, Select, Button, Card, Typography, message, Row, Col, Space, Upload, Tag } from "antd";
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/helpers";
import { Category, Brand } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

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

const ProductFormPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Shadow & Border Style đồng nhất
  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #f0f0f0",
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        api.get("/categories"),
        api.get("/brands")
      ]);

      setCategories(cRes.data.data || []);
      setBrands(bRes.data.data || []);

      if (isEdit) {
        const pRes = await api.get(`/products/${id}`);
        const product = pRes.data.data;

        if (!product) {
          throw new Error("Sản phẩm không tồn tại");
        }

        const formattedImages = product.galleries?.map((g: any) => ({
          uid: g.id,
          name: g.image_url.split('/').pop(),
          status: 'done',
          url: getImageUrl(g.image_url),
          thumbUrl: getImageUrl(g.image_url),
        })) || [];

        // Đưa dữ liệu vào form
        form.setFieldsValue({
          name: product.name,
          slug: product.slug,
          description: product.description,
          category_id: product.category_id,
          brand_id: product.brand_id,
          status: product.status,
          variants: product.variants || [],
          images: formattedImages // Hiển thị ảnh cũ trong danh sách fileList
        });
      }
    } catch (e: any) {
      console.error("Lỗi chi tiết:", e);
      message.error(e.response?.data?.message || "Không thể tải dữ liệu sản phẩm");
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      // Gom nhóm append data
      Object.keys(values).forEach(key => {
        if (key !== 'images' && key !== 'variants') {
          formData.append(key, values[key] || "");
        }
      });

      formData.append("variants", JSON.stringify(values.variants || []));

      if (values.images) {
        values.images.forEach((fileItem: any) => {
          if (fileItem.originFileObj) {
            formData.append("images", fileItem.originFileObj);
          } else {
            // Trường hợp cập nhật (isEdit) mà ảnh cũ được giữ lại, bạn có thể truyền link hoặc id ảnh cũ nếu BE yêu cầu
            formData.append("existing_images[]", fileItem.uid || fileItem.url);
          }
        });
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (isEdit) await api.put(`/products/${id}`, formData, config);
      else await api.post("/products", formData, config);

      message.success("Lưu sản phẩm thành công");
      navigate("/admin/products");
    } catch (e) {
      message.error("Lỗi khi lưu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={(v) => v.name && form.setFieldsValue({ slug: createSlug(v.name) })}
      autoComplete="off"
    >
      {/* Sticky Header - Giúp nút "Lưu" luôn ở tầm mắt khi scroll dài */}
      <div className="flex justify-between items-center mb-8 sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md py-4">
        <Space size="middle">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="hover:scale-110 transition-transform"
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>{isEdit ? "Chỉnh sửa" : "Thêm mới"} sản phẩm</Title>
            <Text type="secondary">{isEdit ? `ID: ${id}` : "Tạo sản phẩm mới cho cửa hàng của bạn"}</Text>
          </div>
        </Space>

        <Space>
          <Button size="large" onClick={() => navigate(-1)}>Hủy</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<SaveOutlined />}
            className="bg-blue-600 hover:bg-blue-500 shadow-lg px-8 rounded-lg"
          >
            Lưu thay đổi
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" className="w-full">
            <Card title="Thông tin cơ bản" style={cardStyle}>
              <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                <Input size="large" placeholder="Ví dụ: Nước hoa Chanel No.5" />
              </Form.Item>
              <Form.Item name="slug" label="Đường dẫn (Slug)">
                <Input placeholder="nuoc-hoa-chanel-no5" disabled className="bg-gray-50" />
              </Form.Item>
              <Form.Item name="description" label="Mô tả chi tiết">
                <TextArea rows={6} placeholder="Viết gì đó hấp dẫn về sản phẩm..." showCount maxLength={2000} />
              </Form.Item>
            </Card>

            {/* BỘ SƯU TẬP ẢNH - ĐÃ THÊM LUẬT BẮT BUỘC 1 ẢNH */}
            <Card title="Bộ sưu tập ảnh" style={cardStyle} extra={<Text type="secondary">Yêu cầu từ 1 đến 5 ảnh</Text>}>
              <Form.Item
                name="images"
                valuePropName="fileList"
                getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}
                rules={[
                  {
                    validator: (_, value) => {
                      if (value && value.length > 5) {
                        return Promise.reject(new Error("Bạn chỉ được tải lên tối đa 5 hình ảnh!"));
                      }
                      if (!value || value.length === 0) {
                        return Promise.reject(new Error("Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm!"));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  multiple
                  accept="image/*"
                  className="product-uploader"
                >
                  {/* Ẩn nút "Tải lên" nếu danh sách ảnh đã đạt tối đa 5 ảnh */}
                  {form.getFieldValue("images")?.length >= 5 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Tải lên</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Card>

            <Card title="Biến thể & Kho hàng" style={cardStyle}>
              <Form.List name="variants">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="relative mb-4 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                        <Row gutter={16} align="bottom">
                          <Col xs={24} md={10}>
                            <Form.Item {...restField} name={[name, 'variant_name']} label="Phân loại (Size/Màu)" rules={[{ required: true }]}>
                              <Input placeholder="VD: 50ml hoặc Đỏ" />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={6}>
                            <Form.Item {...restField} name={[name, 'price']} label="Giá bán">
                              <InputNumber
                                className="w-full"
                                min={0}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                addonAfter="đ"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={5}>
                            <Form.Item {...restField} name={[name, 'stock_quantity']} label="Số lượng">
                              <InputNumber className="w-full" min={0} disabled={isEdit} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={3}>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                              className="mb-6"
                            >Xóa</Button>
                          </Col>
                        </Row>
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      className="h-12 border-2 hover:border-blue-400 rounded-lg"
                    >
                      Thêm biến thể mới
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Phân loại" style={cardStyle}>
            <Form.Item name="category_id" label="Danh mục" rules={[{ required: true }]}>
              <Select
                size="large"
                placeholder="Chọn danh mục"
                options={categories.map(c => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item name="brand_id" label="Thương hiệu">
              <Select
                size="large"
                placeholder="Chọn thương hiệu"
                options={brands.map(b => ({ label: b.name, value: b.id }))}
              />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái hiển thị" initialValue="active">
              <Select size="large">
                <Select.Option value="active"><Tag color="success">Đang kinh doanh</Tag></Select.Option>
                <Select.Option value="hidden"><Tag color="default">Tạm ẩn</Tag></Select.Option>
              </Select>
            </Form.Item>
          </Card>
        </Col>
      </Row>
    </Form>
  );
};

export default ProductFormPage;
import React, { useEffect, useState } from "react";
import { Form, Input, InputNumber, Select, Button, Card, Typography, message, Row, Col, Space, Upload, Tag, Dropdown, MenuProps } from "antd";
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, ThunderboltOutlined, DownOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/helpers";
import { Category, Brand } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

const PRODUCT_TEMPLATES = [
  {
    name: "Serum Phục Hồi Da B5 & Hyaluronic Acid Dưỡng Ẩm Chuyên Sâu",
    description: "Tinh chất phục hồi làm dịu da mẩn đỏ nhạy cảm, cấp ẩm tầng sâu và tái tạo hàng rào bảo vệ da với Vitamin B5 và HA đa phân tử.",
    categoryKeyword: "chăm sóc da",
    brandKeyword: "la roche",
    variants: [
      { variant_name: "Chai 30ml", price: 385000, stock_quantity: 50 },
      { variant_name: "Chai 50ml Tiết Kiệm", price: 560000, stock_quantity: 30 },
    ],
  },
  {
    name: "Kem Chống Nắng Kiềm Dầu Nâng Tông Tự Nhiên SPF50+ PA++++",
    description: "Bảo vệ quang phổ rộng chống tia UVA/UVB và ánh sáng xanh, finish mịn ráo tự nhiên kiềm dầu suốt 10 tiếng không gây bóng nhờn.",
    categoryKeyword: "chống nắng",
    brandKeyword: "anessa",
    variants: [
      { variant_name: "Tuýp 60ml", price: 460000, stock_quantity: 40 },
    ],
  },
  {
    name: "Son Kem Lì Velvet Mịn Môi Cao Cấp Lâu Trôi",
    description: "Chất son kem nhung mịn siêu nhẹ tênh, lên màu chuẩn sắc từ lần chạm đầu tiên, không làm lộ vân môi.",
    categoryKeyword: "trang điểm",
    brandKeyword: "3ce",
    variants: [
      { variant_name: "Màu 01 - Đỏ Ruby", price: 290000, stock_quantity: 45 },
      { variant_name: "Màu 02 - Cam Cháy", price: 290000, stock_quantity: 35 },
      { variant_name: "Màu 03 - Hồng Đất", price: 290000, stock_quantity: 40 },
    ],
  },
  {
    name: "Nước Tẩy Trang Micellar Water Dịu Nhẹ Cho Da Nhạy Cảm",
    description: "Làm sạch sâu 99% bụi mịn và lớp makeup cứng đầu mà vẫn giữ độ ẩm mượt tự nhiên, không cồn, không paraben.",
    categoryKeyword: "làm sạch",
    brandKeyword: "bioderma",
    variants: [
      { variant_name: "Chai 100ml", price: 150000, stock_quantity: 30 },
      { variant_name: "Chai 500ml", price: 395000, stock_quantity: 60 },
    ],
  },
  {
    name: "Sữa Rửa Mặt Tạo Bọt Cân Bằng Độ Ẩm Dịu Nhẹ pH 5.5",
    description: "Làm sạch bã nhờn sâu trong lỗ chân lông mà không gây cảm giác khô căng nhờ 3 loại Ceramides thiết yếu.",
    categoryKeyword: "sữa rửa mặt",
    brandKeyword: "cerave",
    variants: [
      { variant_name: "Chai 236ml", price: 280000, stock_quantity: 50 },
      { variant_name: "Chai 473ml", price: 430000, stock_quantity: 40 },
    ],
  },
];

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

  const handleApplyTemplate = (template: typeof PRODUCT_TEMPLATES[0]) => {
    const matchedCat = categories.find(c => 
      c.name.toLowerCase().includes(template.categoryKeyword) || template.categoryKeyword.includes(c.name.toLowerCase())
    ) || categories[0];

    const matchedBrand = brands.find(b => 
      b.name.toLowerCase().includes(template.brandKeyword) || template.brandKeyword.includes(b.name.toLowerCase())
    ) || brands[0];

    form.setFieldsValue({
      name: template.name,
      slug: createSlug(template.name),
      description: template.description,
      category_id: matchedCat?.id,
      brand_id: matchedBrand?.id,
      status: "active",
      variants: template.variants,
    });
    message.success(`Đã nạp mẫu sản phẩm "${template.name}"!`);
  };

  const templateMenuItems: MenuProps["items"] = PRODUCT_TEMPLATES.map((tmpl, idx) => ({
    key: `template-${idx}`,
    label: (
      <div className="py-1">
        <div className="font-semibold text-xs text-gray-800">{tmpl.name}</div>
        <div className="text-[11px] text-gray-500">{tmpl.variants.length} biến thể • Giá từ {tmpl.variants[0].price.toLocaleString()}đ</div>
      </div>
    ),
    onClick: () => handleApplyTemplate(tmpl),
  }));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={(v) => v.name && form.setFieldsValue({ slug: createSlug(v.name) })}
      autoComplete="off"
    >
      {/* Sticky Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 sm:mb-8 sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md py-3 sm:py-4">
        <Space size="middle">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="hover:scale-110 transition-transform"
          />
          <div>
            <Title level={3} style={{ margin: 0 }} className="!text-xl sm:!text-2xl !font-serif">{isEdit ? "Chỉnh sửa" : "Thêm mới"} sản phẩm</Title>
            <Text type="secondary" className="text-xs sm:text-sm">{isEdit ? `ID: ${id}` : "Tạo sản phẩm mới cho cửa hàng của bạn"}</Text>
          </div>
        </Space>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {!isEdit && (
            <Dropdown menu={{ items: templateMenuItems }} placement="bottomRight">
              <Button
                icon={<ThunderboltOutlined />}
                className="bg-gradient-to-r from-amber-500 to-[#BC8F8F] text-white font-semibold border-none hover:opacity-90 rounded-lg h-9 sm:h-10 shadow-sm flex items-center gap-1 text-xs sm:text-sm"
              >
                Gợi Ý Mẫu Hot Trend <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
          )}

          <Button size="large" onClick={() => navigate(-1)} className="rounded-lg h-9 sm:h-10 text-xs sm:text-sm">Hủy</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            className="bg-[#BC8F8F] hover:bg-[#a67c7c] text-white font-semibold rounded-lg px-6 sm:px-8 shadow-md border-0 h-9 sm:h-10 flex items-center justify-center transition-all text-xs sm:text-sm"
          >
            Lưu sản phẩm
          </Button>
        </div>
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
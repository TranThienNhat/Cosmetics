import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Typography,
  message,
  Row,
  Col,
  Space,
  Modal,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  PlusSquareOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";

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

const PurchaseReceiptFormPage: React.FC = () => {
  const [form] = Form.useForm();
  const [quickProductForm] = Form.useForm();
  const [quickVariantForm] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  // Shadow & Border Style đồng nhất hoàn toàn với ProductFormPage
  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #f0f0f0",
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sRes, vRes, pRes, cRes, bRes] = await Promise.all([
        api.get("/suppliers?status=active"),
        api.get("/products/purchase/all-variants"),
        api.get("/products"),
        api.get("/categories"),
        api.get("/brands"),
      ]);

      setSuppliers(sRes.data?.data || []);
      setVariants(vRes.data?.data || []);
      setProducts(pRes.data?.data || []);
      setCategories(cRes.data?.data || []);
      setBrands(bRes.data?.data || []);

      if (isEdit) {
        const res = await api.get(`/purchase-receipts/${id}`);
        const data = res.data.data;

        form.setFieldsValue({
          supplier_id: data.supplier_id,
          note: data.note,
          items:
            data.details?.map((d: any) => ({
              product_variant_id: d.variant_id,
              quantity: d.quantity,
              unit_price: Math.round(d.unit_price), // Loại bỏ phần thập phân nếu dữ liệu DB trả về dạng float
            })) || [],
        });
      }
    } catch (e: any) {
      message.error("Không thể tải dữ liệu trang");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickProduct = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("slug", createSlug(values.name));
      formData.append("category_id", values.category_id || "");
      formData.append("brand_id", values.brand_id || "");
      formData.append("status", "active");

      const defaultVariants = [
        {
          variant_name: values.variant_name || "Mặc định",
          price: 0,
          stock_quantity: 0,
        },
      ];
      formData.append("variants", JSON.stringify(defaultVariants));

      if (values.images) {
        values.images.forEach((fileItem: any) => {
          if (fileItem.originFileObj) {
            formData.append("images", fileItem.originFileObj);
          }
        });
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      await api.post("/products", formData, config);

      message.success("Tạo nhanh sản phẩm mới thành công");
      setIsProductModalOpen(false);
      quickProductForm.resetFields();
      loadInitialData();
    } catch (e) {
      message.error("Lỗi khi tạo nhanh sản phẩm");
    }
  };

  const handleQuickVariant = async (values: any) => {
    try {
      await api.put(`/products/${values.product_id}/variants`, {
        variant_name: values.variant_name,
        price: 0,
        stock_quantity: 0,
      });
      message.success("Thêm biến thể mới thành công");
      setIsVariantModalOpen(false);
      quickVariantForm.resetFields();
      loadInitialData();
    } catch (e) {
      message.error("Lỗi khi thêm biến thể");
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        supplier_id: values.supplier_id,
        note: values.note,
        items: values.items.map((item: any) => ({
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
          cost_price: item.unit_price, // Đảm bảo gửi số nguyên lên server
        })),
      };

      if (isEdit) {
        await api.put(`/purchase-receipts/${id}`, payload);
        message.success("Cập nhật phiếu nhập thành công");
      } else {
        await api.post("/purchase-receipts", payload);
        message.success("Tạo phiếu nhập hàng thành công");
      }
      navigate("/admin/purchases");
    } catch (e: any) {
      message.error("Lỗi khi lưu phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  const itemsWatch = Form.useWatch("items", form);
  const totalAmount =
    itemsWatch?.reduce(
      (acc: number, cur: any) =>
        acc + Number(cur?.quantity || 0) * Math.round(Number(cur?.unit_price || 0)),
      0,
    ) || 0;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ items: [{ quantity: 1, unit_price: 0 }] }}
      autoComplete="off"
    >
      {/* Sticky Header - Đồng bộ 100% hiệu ứng chuyển động và cấu trúc văn bản */}
      <div className="flex justify-between items-center mb-8 sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md py-4">
        <Space size="middle">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="hover:scale-110 transition-transform"
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {isEdit ? "Chỉnh sửa" : "Tạo mới"} phiếu nhập hàng
            </Title>
            <Text type="secondary">
              {isEdit
                ? `ID: ${id}`
                : "Nhập kho sản phẩm và quản lý nhà cung cấp"}
            </Text>
          </div>
        </Space>

        <Space size="middle">
          <Button
            icon={<PlusSquareOutlined />}
            onClick={() => setIsProductModalOpen(true)}
            className="border-[#BC8F8F] text-[#BC8F8F] hover:bg-[#BC8F8F]/5 hover:border-[#BC8F8F] font-medium rounded-lg h-10 transition-colors"
          >
            Tạo SP mới
          </Button>

          <Button
            icon={<AppstoreAddOutlined />}
            onClick={() => setIsVariantModalOpen(true)}
            className="border-[#BC8F8F] text-[#BC8F8F] hover:bg-[#BC8F8F]/5 hover:border-[#BC8F8F] font-medium rounded-lg h-10 transition-colors"
          >
            Thêm biến thể
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<SaveOutlined />}
            className="bg-[#BC8F8F] hover:bg-[#a67c7c] text-white font-semibold rounded-lg px-8 shadow-md border-0 h-10 flex items-center justify-center transition-all"
          >
            Lưu phiếu nhập
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: DANH SÁCH HÀNG HOÁ */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" className="w-full">
            <Card title="Danh sách hàng nhập" style={cardStyle}>
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div
                        key={key}
                        className="relative mb-4 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <Row gutter={16} align="bottom">
                          <Col xs={24} md={11}>
                            <Form.Item
                              {...restField}
                              name={[name, "product_variant_id"]}
                              label="Sản phẩm & Biến thể"
                              rules={[
                                { required: true, message: "Vui lòng chọn!" },
                              ]}
                            >
                              <Select
                                showSearch
                                placeholder="Tìm kiếm sản phẩm..."
                                options={variants.map((v: any) => ({
                                  label: `${v.product_name} - ${v.variant_name}`,
                                  value: v.id,
                                }))}
                                filterOption={(input, option) =>
                                  (option?.label ?? "")
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={4}>
                            <Form.Item
                              {...restField}
                              name={[name, "quantity"]}
                              label="Số lượng"
                              rules={[{ required: true, message: "Nhập SL" }]}
                            >
                              <InputNumber
                                className="w-full"
                                min={1}
                                precision={0}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={6}>
                            <Form.Item
                              {...restField}
                              name={[name, "unit_price"]}
                              label="Giá nhập / SP"
                              rules={[{ required: true, message: "Nhập giá" }]}
                            >
                              <InputNumber
                                className="w-full"
                                min={0}
                                precision={0} // Ép buộc không cho nhập số thập phân
                                formatter={(value) =>
                                  `${value}`.replace(
                                    /\B(?=(\d{3})+(?!\d))/g,
                                    ",",
                                  )
                                }
                                addonAfter="đ"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={3}>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                              className="mb-6"
                            >
                              Xóa
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add({ quantity: 0, unit_price: 0 })}
                      block
                      icon={<PlusOutlined />}
                      className="h-12 border-2 hover:border-blue-400 rounded-lg"
                    >
                      Thêm dòng sản phẩm mới
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>
          </Space>
        </Col>

        {/* CỘT PHẢI: THÔNG TIN CHUNG & TỔNG TIỀN */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" className="w-full">
            <Card title="Thông tin chung" style={cardStyle}>
              <Form.Item
                name="supplier_id"
                label="Nhà cung cấp"
                rules={[{ required: true, message: "Vui lòng chọn NCC!" }]}
              >
                <Select
                  size="large"
                  showSearch
                  placeholder="Chọn nhà cung cấp"
                  options={suppliers.map((s: any) => ({
                    label: s.name,
                    value: s.id,
                  }))}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
              <Form.Item name="note" label="Ghi chú">
                <TextArea
                  rows={4}
                  placeholder="Ghi chú thêm về đơn nhập hàng..."
                />
              </Form.Item>
            </Card>

            <Card title="Thanh toán" style={cardStyle}>
              <div className="flex justify-between items-center py-2">
                <Text type="secondary">TỔNG TIỀN:</Text>
                <Text strong className="text-xl text-blue-600">
                  {/* Sử dụng định dạng mặc định cho tiền tệ vi-VN, loại bỏ .00 */}
                  {Math.round(totalAmount).toLocaleString("vi-VN")} đ
                </Text>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* MODAL 1: TẠO NHANH SẢN PHẨM MỚI */}
      <Modal
        title={
          <Space>
            <PlusSquareOutlined className="text-blue-500" />
            <span>Tạo nhanh Sản phẩm mới</span>
          </Space>
        }
        open={isProductModalOpen}
        onCancel={() => setIsProductModalOpen(false)}
        onOk={() => quickProductForm.submit()}
        okText="Tạo sản phẩm"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={quickProductForm}
          layout="vertical"
          onFinish={handleQuickProduct}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm!" }]}
          >
            <Input placeholder="Ví dụ: Nước hoa Chanel No.5" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category_id"
                label="Danh mục"
                rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
              >
                <Select
                  showSearch
                  placeholder="Chọn danh mục"
                  options={categories.map((c: any) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand_id" label="Thương hiệu">
                <Select
                  showSearch
                  placeholder="Chọn thương hiệu"
                  options={brands.map((b: any) => ({
                    label: b.name,
                    value: b.id,
                  }))}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="variant_name"
            label="Tên biến thể"
            initialValue="Mặc định"
            rules={[{ required: true, message: "Vui lòng nhập tên biến thể!" }]}
          >
            <Input placeholder="Ví dụ: 50ml, Màu Đỏ hoặc Mặc định" />
          </Form.Item>

          <Form.Item
            name="images"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              multiple
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải ảnh</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 2: THÊM BIẾN THỂ CHO SẢN PHẨM ĐÃ CÓ */}
      <Modal
        title={
          <Space>
            <AppstoreAddOutlined className="text-green-500" />
            <span>Thêm biến thể mới</span>
          </Space>
        }
        open={isVariantModalOpen}
        onCancel={() => setIsVariantModalOpen(false)}
        onOk={() => quickVariantForm.submit()}
        okText="Thêm biến thể"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={quickVariantForm}
          layout="vertical"
          onFinish={handleQuickVariant}
          className="mt-4"
        >
          <Form.Item
            name="product_id"
            label="Chọn sản phẩm gốc"
            rules={[{ required: true, message: "Vui lòng chọn sản phẩm gốc!" }]}
          >
            <Select
              showSearch
              placeholder="Gõ để tìm kiếm..."
              options={products.map((p: any) => ({
                label: p.name,
                value: p.id,
                  }))}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="variant_name"
            label="Tên phân loại (Size/Màu/Dung tích)"
            rules={[
              { required: true, message: "Vui lòng nhập tên phân loại!" },
            ]}
          >
            <Input placeholder="Ví dụ: 100ml, Màu Xanh dương..." />
          </Form.Item>
        </Form>
      </Modal>
    </Form>
  );
};

export default PurchaseReceiptFormPage;
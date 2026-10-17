import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Form,
  Input,
  Divider,
  Steps,
  message,
  Tag,
  Modal,
  Checkbox,
  Popconfirm,
  Spin,
  Select,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  EnvironmentOutlined,
  CreditCardOutlined,
  UserOutlined,
  LeftOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  PlusOutlined,
  DeleteOutlined,
  HomeOutlined,
  CheckOutlined,
  WalletOutlined,
  QrcodeOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import { getImageUrl, formatCurrency } from "../utils/helpers";
import { UserAddress } from "../types";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Danh mục 63 Tỉnh / Thành phố Việt Nam
const VIETNAM_PROVINCES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Hải Phòng", "Đà Nẵng", "Cần Thơ",
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông",
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang",
  "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình",
  "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
  "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên",
  "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
  "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

// Helper: Tìm kiếm Tỉnh / Thành phố không phân biệt dấu tiếng Việt
const filterProvinceOption = (input: string, option?: { label: string; value: string }) => {
  const normInput = (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
  const normLabel = (option?.label || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
  return normLabel.includes(normInput);
};

const CheckoutPage: React.FC = () => {
  const [form] = Form.useForm();
  const [addressModalForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    items,
    discount,
    removeFromCart,
    isLoading: cartLoading,
  } = useCart();

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // --- QUẢN LÝ SỔ ĐỊA CHỈ ---
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  // --- PHƯƠNG THỨC THANH TOÁN ---
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "momo">("cod");

  const selectedVariantIds = (location.state as any)?.selectedVariantIds as
    | number[]
    | undefined;

  const checkoutItems = useMemo(() => {
    if (!selectedVariantIds || selectedVariantIds.length === 0) {
      return items;
    }
    return items.filter((item) =>
      selectedVariantIds.includes(Number(item.variant_id))
    );
  }, [items, selectedVariantIds]);

  const checkoutSubtotal = useMemo(() => {
    return checkoutItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
  }, [checkoutItems]);

  const totalCartSubtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
  }, [items]);

  const applicableDiscount = useMemo(() => {
    if (totalCartSubtotal === 0 || discount === 0) return 0;
    return Math.round((checkoutSubtotal / totalCartSubtotal) * discount);
  }, [checkoutSubtotal, totalCartSubtotal, discount]);

  const shippingFee = checkoutSubtotal >= 500000 ? 0 : 30000;
  const finalTotal = Math.max(
    0,
    checkoutSubtotal - applicableDiscount + (checkoutItems.length > 0 ? shippingFee : 0)
  );

  // Kiểm tra giỏ hàng
  useEffect(() => {
    if (items.length > 0 && checkoutItems.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      navigate("/cart", { replace: true });
    }
  }, [checkoutItems, items, navigate]);

  // Tải danh sách địa chỉ đã lưu của người dùng
  const loadAddresses = async () => {
    if (!user) return;
    try {
      setLoadingAddresses(true);
      const res = await api.get("/addresses");
      if (res.data?.success && Array.isArray(res.data.data)) {
        const addrList: UserAddress[] = res.data.data;
        setAddresses(addrList);

        // Tự động chọn địa chỉ mặc định hoặc địa chỉ đầu tiên
        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a) => Boolean(a.is_default)) || addrList[0];
          applyAddressToForm(defaultAddr);
        } else {
          // Nếu chưa có địa chỉ nào, điền thông tin profile ban đầu
          form.setFieldsValue({
            name: user.name,
            phone: user.phone || "",
            email: user.email,
          });
        }
      }
    } catch (err) {
      console.warn("Không thể tải danh sách địa chỉ:", err);
      if (user) {
        form.setFieldsValue({
          name: user.name,
          phone: user.phone || "",
          email: user.email,
        });
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  // Áp dụng thông tin từ địa chỉ được chọn vào Form (Tỉnh, Xã, Chi tiết)
  const applyAddressToForm = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    form.setFieldsValue({
      name: addr.recipient_name,
      phone: addr.phone,
      province: addr.province || "",
      ward: addr.ward || "",
      address_line: addr.address_line,
      address: [addr.address_line, addr.ward, addr.province].filter(Boolean).join(", "),
      email: user?.email || "",
    });
  };

  // Tạo địa chỉ mới qua Modal (chỉ gồm Tỉnh/Thành phố, Xã/Phường và Địa chỉ chi tiết)
  const handleCreateNewAddress = async (values: any) => {
    try {
      setSavingNewAddress(true);
      const res = await api.post("/addresses", {
        recipient_name: values.recipient_name?.trim(),
        phone: values.phone?.trim(),
        province: values.province?.trim() || null,
        ward: values.ward?.trim() || null,
        address_line: values.address_line?.trim(),
        is_default: Boolean(values.is_default),
      });

      if (res.data?.success) {
        message.success("Thêm địa chỉ mới thành công!");
        setAddressModalVisible(false);
        addressModalForm.resetFields();

        // Tải lại danh sách và chọn luôn địa chỉ mới vừa tạo
        const updatedList: UserAddress[] = res.data.data || [];
        setAddresses(updatedList);
        const newCreated = updatedList.find((a) => a.id === res.data.addressId) || updatedList[0];
        if (newCreated) {
          applyAddressToForm(newCreated);
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi lưu địa chỉ");
    } finally {
      setSavingNewAddress(false);
    }
  };

  // Xóa địa chỉ
  const handleDeleteAddress = async (addressId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/addresses/${addressId}`);
      if (res.data?.success) {
        message.success("Đã xóa địa chỉ khỏi sổ!");
        const updatedList: UserAddress[] = res.data.data || [];
        setAddresses(updatedList);

        // Nếu xóa trúng địa chỉ đang chọn, đổi sang địa chỉ khác
        if (selectedAddressId === addressId) {
          if (updatedList.length > 0) {
            applyAddressToForm(updatedList[0]);
          } else {
            setSelectedAddressId(null);
            form.setFieldsValue({ address: "" });
          }
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể xóa địa chỉ");
    }
  };

  // Đặt làm mặc định
  const handleSetDefaultAddress = async (addressId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/addresses/${addressId}/default`);
      if (res.data?.success) {
        message.success("Đã đặt làm địa chỉ mặc định!");
        const updatedList: UserAddress[] = res.data.data || [];
        setAddresses(updatedList);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể cập nhật");
    }
  };

  // Thực hiện đặt hàng
  const handlePlaceOrder = async (values: any) => {
    if (checkoutItems.length === 0) {
      message.error("Không có sản phẩm nào được chọn để thanh toán");
      return;
    }

    try {
      setLoading(true);

      // Tổng hợp địa chỉ từ Tỉnh/Thành phố, Xã/Phường và Địa chỉ chi tiết
      const fullAddressParts = [
        values.address_line?.trim(),
        values.ward?.trim(),
        values.province?.trim(),
      ].filter(Boolean);

      const fullAddress =
        fullAddressParts.length > 0
          ? fullAddressParts.join(", ")
          : values.address?.trim() || "";

      // Gửi CẢ HAI trường shipping_info và shipping_address để đảm bảo tương thích 100%
      const shippingPayload = {
        name: values.name?.trim(),
        phone: values.phone?.trim(),
        email: values.email?.trim() || user?.email,
        address: fullAddress,
        address_line: values.address_line?.trim() || fullAddress,
        province: values.province?.trim() || null,
        ward: values.ward?.trim() || null,
      };

      const payload = {
        shipping_info: shippingPayload,
        shipping_address: shippingPayload,
        items: checkoutItems.map((item) => ({
          variant_id: Number(item.variant_id),
          quantity: Number(item.quantity),
        })),
        notes: values.notes?.trim() || null,
        payment_method: paymentMethod,
        save_address: Boolean(values.save_address),
      };

      const response = await api.post("/orders/checkout", payload);

      if (response.data && response.data.order) {
        // Xóa các sản phẩm đã thanh toán khỏi giỏ hàng tuần tự
        for (const item of checkoutItems) {
          await removeFromCart(item.variant_id);
        }

        // Nếu chọn thanh toán qua Ví MoMo và có payUrl
        if (paymentMethod === "momo" && response.data.payUrl) {
          message.loading("Đang chuyển sang cổng thanh toán MoMo...", 2);
          setTimeout(() => {
            window.location.href = response.data.payUrl;
          }, 800);
          return;
        }

        message.success("Đặt hàng thành công! Đơn hàng đang được chuẩn bị ✨");
        navigate("/checkout/success", {
          state: { order: response.data.order },
        });
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng kiểm tra lại thông tin giao hàng."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderLabel = (
    icon: React.ReactNode,
    labelText: string,
    isRequired: boolean = false
  ) => (
    <span className="flex items-center gap-2">
      {icon}
      <span className="font-semibold text-charcoal">
        {labelText}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </span>
    </span>
  );

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-gray">Đang tải dữ liệu thanh toán...</Text>
      </div>
    );
  }

  if (checkoutItems.length === 0 || !user) return null;

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div>
            <Button
              type="text"
              icon={<LeftOutlined style={{ fontSize: 14 }} />}
              onClick={() => navigate("/cart")}
              className="text-gray hover:text-primary p-0 flex items-center mb-2 transition-colors"
            >
              Quay lại giỏ hàng
            </Button>

            <Title level={2} className="!font-serif !text-charcoal !m-0 !text-2xl sm:!text-3xl">
              Thanh toán đơn hàng
            </Title>
          </div>

          <div className="w-full md:w-80">
            <Steps current={0} size="small" responsive className="custom-steps">
              <Step title="Thông tin" />
              <Step title="Hoàn tất" />
            </Steps>
          </div>
        </div>

        <Row gutter={[{ xs: 16, sm: 24, lg: 32 }, { xs: 20, sm: 24, lg: 32 }]}>
          {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG & SỔ ĐỊA CHỈ */}
          <Col xs={24} lg={14}>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden mb-6" bodyStyle={{ padding: 0 }}>
              <div className="p-4 sm:p-6 md:p-8">
                {/* TIÊU ĐỀ & NÚT THÊM ĐỊA CHỈ */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <HomeOutlined className="text-lg text-[#BC8F8F]" />
                    <Title level={4} className="!m-0 !font-serif">
                      Sổ địa chỉ nhận hàng
                    </Title>
                    {addresses.length > 0 && (
                      <Tag color="rose" className="rounded-full px-2 text-xs">
                        {addresses.length} địa chỉ
                      </Tag>
                    )}
                  </div>

                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setAddressModalVisible(true)}
                    className="border-[#BC8F8F] text-[#BC8F8F] hover:!border-[#BC8F8F] hover:!text-[#BC8F8F] rounded-lg text-xs flex items-center"
                  >
                    Thêm địa chỉ
                  </Button>
                </div>

                {/* DANH SÁCH THẺ ĐỊA CHỈ ĐÃ LƯU */}
                {loadingAddresses ? (
                  <div className="py-6 text-center">
                    <Spin size="small" />
                    <Text className="text-gray text-xs block mt-2">Đang tải sổ địa chỉ...</Text>
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-1 gap-2.5">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => applyAddressToForm(addr)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                              isSelected
                                ? "border-[#BC8F8F] bg-[#FAF3EC]/40 shadow-xs ring-1 ring-[#BC8F8F]"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                                    isSelected
                                      ? "bg-[#BC8F8F] border-[#BC8F8F] text-white"
                                      : "border-gray-300 bg-white"
                                  }`}
                                >
                                  {isSelected && <CheckOutlined className="text-[10px]" />}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Text strong className="text-charcoal text-sm">
                                      {addr.recipient_name}
                                    </Text>
                                    <Text type="secondary" className="text-xs">
                                      • {addr.phone}
                                    </Text>
                                    {Boolean(addr.is_default) && (
                                      <Tag color="success" className="text-[10px] m-0 py-0 px-1.5 rounded">
                                        Mặc định
                                      </Tag>
                                    )}
                                  </div>

                                  <Paragraph className="text-gray-600 text-xs !m-0 mt-1 leading-relaxed">
                                    {[addr.address_line, addr.ward, addr.province].filter(Boolean).join(", ")}
                                  </Paragraph>
                                </div>
                              </div>

                              {/* ACTIONS */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {!Boolean(addr.is_default) && (
                                  <Button
                                    type="text"
                                    size="small"
                                    onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                                    className="text-[11px] text-gray-400 hover:text-primary px-1.5 h-6"
                                  >
                                    Đặt mặc định
                                  </Button>
                                )}

                                <Popconfirm
                                  title="Xóa địa chỉ này?"
                                  description="Bạn có chắc muốn xóa địa chỉ này khỏi sổ?"
                                  onConfirm={(e: any) => handleDeleteAddress(addr.id, e)}
                                  okText="Xóa"
                                  cancelText="Hủy"
                                  okButtonProps={{ danger: true, size: "small" }}
                                  cancelButtonProps={{ size: "small" }}
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined className="text-xs" />}
                                    className="p-1 h-6 w-6 flex items-center justify-center text-gray-400 hover:text-red-500"
                                  />
                                </Popconfirm>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FAF3EC]/30 p-4 rounded-xl border border-dashed border-[#BC8F8F]/40 mb-6 text-center">
                    <Text className="text-gray-600 text-xs block mb-2">
                      Bạn chưa có địa chỉ nhận hàng nào được lưu trong sổ.
                    </Text>
                    <Button
                      type="link"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setAddressModalVisible(true)}
                      className="text-[#BC8F8F] font-medium p-0"
                    >
                      Thêm địa chỉ ngay
                    </Button>
                  </div>
                )}

                <Divider className="my-5 border-gray-100" />

                {/* FORM CHI TIẾT NGƯỜI NHẬN HÀNG */}
                <Title level={5} className="!mb-4 !font-serif text-charcoal">
                  Chi tiết thông tin giao hàng
                </Title>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handlePlaceOrder}
                  requiredMark={false}
                >
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="name"
                        label={renderLabel(<UserOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />, "Họ và tên người nhận", true)}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập họ và tên",
                          },
                        ]}
                      >
                        <Input
                          className="rounded-lg h-12"
                          placeholder="Nguyễn Văn A"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="phone"
                        label={renderLabel(<PhoneOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />, "Số điện thoại", true)}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập số điện thoại",
                          },
                          {
                            pattern: /^[0-9]{9,11}$/,
                            message: "Số điện thoại không hợp lệ (9 - 11 chữ số)",
                          },
                        ]}
                      >
                        <Input
                          className="rounded-lg h-12"
                          placeholder="0901234567"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="email"
                    label={renderLabel(<MailOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />, "Email nhận thông báo")}
                    rules={[
                      {
                        type: "email",
                        message: "Vui lòng nhập email hợp lệ",
                      },
                    ]}
                  >
                    <Input className="rounded-lg h-12" placeholder="your-email@gmail.com" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="province"
                        label={renderLabel(<EnvironmentOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />, "Tỉnh / Thành phố", true)}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn Tỉnh / Thành phố",
                          },
                        ]}
                      >
                        <Select
                          showSearch
                          allowClear
                          size="large"
                          placeholder="Chọn Tỉnh / Thành phố"
                          optionFilterProp="label"
                          filterOption={filterProvinceOption}
                          options={VIETNAM_PROVINCES.map((p) => ({ label: p, value: p }))}
                          className="w-full rounded-lg"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="ward"
                        label={renderLabel(<EnvironmentOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />, "Xã / Phường", true)}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập Xã / Phường",
                          },
                        ]}
                      >
                        <Input
                          className="rounded-lg h-12"
                          placeholder="Ví dụ: Phường Trung Hòa"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="address_line"
                    label={renderLabel(<HomeOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />, "Địa chỉ chi tiết (Số nhà, ngõ/ngách, đường, thôn/xóm)", true)}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số nhà, ngõ/ngách, tên đường hoặc thôn/xóm",
                      },
                    ]}
                  >
                    <Input
                      className="rounded-lg h-12"
                      placeholder="Ví dụ: Số 25 ngõ 120 đường Trần Duy Hưng"
                    />
                  </Form.Item>

                  <Form.Item name="save_address" valuePropName="checked" className="mb-4">
                    <Checkbox className="text-xs text-gray-600">
                      Lưu địa chỉ này vào sổ địa chỉ để sử dụng cho các lần mua hàng sau
                    </Checkbox>
                  </Form.Item>

                  <Form.Item
                    name="notes"
                    label={renderLabel(<FileTextOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />, "Ghi chú cho shipper")}
                  >
                    <Input.TextArea
                      rows={2}
                      className="rounded-lg"
                      placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến 15 phút..."
                    />
                  </Form.Item>

                  {/* CHỌN PHƯƠNG THỨC THANH TOÁN */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCardOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />
                        <Text strong className="text-charcoal text-sm">
                          Phương thức thanh toán <span className="text-red-500">*</span>
                        </Text>
                      </div>
                      <Tag color="success" className="text-[10px] m-0 py-0.5 px-2 rounded-full border-0 bg-green-50 text-green-700 flex items-center gap-1 font-medium">
                        <SafetyCertificateOutlined />
                        <span>Bảo mật 100%</span>
                      </Tag>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* LỰA CHỌN 1: COD */}
                      <div
                        onClick={() => setPaymentMethod("cod")}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                          paymentMethod === "cod"
                            ? "border-[#BC8F8F] bg-[#FAF3EC]/50 shadow-md ring-2 ring-[#BC8F8F]/40 -translate-y-0.5"
                            : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-xs"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                  paymentMethod === "cod"
                                    ? "bg-[#BC8F8F] text-white shadow-xs"
                                    : "bg-[#FAF3EC] text-[#BC8F8F]"
                                }`}
                              >
                                <WalletOutlined className="text-lg" />
                              </div>
                              <div>
                                <Text strong className="text-sm text-charcoal block leading-tight">
                                  Tiền mặt (COD)
                                </Text>
                                <span className="text-[11px] text-gray-400">
                                  Thanh toán khi nhận
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center">
                              {paymentMethod === "cod" ? (
                                <CheckCircleFilled className="text-lg text-[#BC8F8F]" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white" />
                              )}
                            </div>
                          </div>

                          <Text className="text-gray-500 text-xs leading-relaxed block">
                            Nhận hàng, kiểm tra sản phẩm chính hãng rồi mới thanh toán trực tiếp cho shipper.
                          </Text>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Phí thu hộ: <strong>0₫</strong></span>
                          <Tag className="m-0 text-[10px] py-0 px-1.5 rounded bg-gray-100 border-0 text-gray-600 font-medium">
                            An tâm mua sắm
                          </Tag>
                        </div>
                      </div>

                      {/* LỰA CHỌN 2: MOMO */}
                      <div
                        onClick={() => setPaymentMethod("momo")}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                          paymentMethod === "momo"
                            ? "border-[#D82D8B] bg-[#FDF2F8]/60 shadow-md ring-2 ring-[#D82D8B]/40 -translate-y-0.5"
                            : "border-gray-200 hover:border-[#D82D8B]/40 bg-white hover:shadow-xs"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                  paymentMethod === "momo"
                                    ? "bg-[#D82D8B] text-white shadow-xs"
                                    : "bg-[#FDF2F8] text-[#D82D8B]"
                                }`}
                              >
                                <QrcodeOutlined className="text-lg" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <Text strong className="text-sm text-charcoal block leading-tight">
                                    Cổng Ví MoMo
                                  </Text>
                                  <Tag color="magenta" className="text-[10px] py-0 px-1.5 rounded-full border-0 bg-[#D82D8B]/10 text-[#D82D8B] font-semibold m-0">
                                    Khuyên dùng
                                  </Tag>
                                </div>
                                <span className="text-[11px] text-gray-400">
                                  Quét QR / App MoMo
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center">
                              {paymentMethod === "momo" ? (
                                <CheckCircleFilled className="text-lg text-[#D82D8B]" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white" />
                              )}
                            </div>
                          </div>

                          <Text className="text-gray-500 text-xs leading-relaxed block">
                            Quét mã QR bằng App MoMo hoặc ứng dụng ngân hàng bất kỳ để xác nhận thanh toán tức thì.
                          </Text>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Tốc độ: <strong>Tức thì 0s</strong></span>
                          <Tag className="m-0 text-[10px] py-0 px-1.5 rounded bg-[#D82D8B]/10 border-0 text-[#D82D8B] font-medium">
                            Xử lý ưu tiên
                          </Tag>
                        </div>
                      </div>
                    </div>

                    {/* DẢI CAM KẾT BẢO MẬT & ĐỒNG BỘ */}
                    <div className="mt-3.5 p-3 bg-gray-50/70 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <SafetyCertificateOutlined className="text-green-600 text-sm" />
                        <span>Mã hóa bảo mật giao dịch SSL 256-bit chuẩn Quốc tế</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <ThunderboltOutlined className="text-amber-500" />
                        <span>Khởi tạo & giao hàng nhanh chóng</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={checkoutItems.length === 0}
                    icon={paymentMethod === "momo" ? <QrcodeOutlined /> : <CheckOutlined />}
                    className={`w-full h-12 sm:h-14 rounded-xl font-medium text-base sm:text-lg shadow-md transition-all flex items-center justify-center gap-2 border-0 ${
                      paymentMethod === "momo"
                        ? "bg-gradient-to-r from-[#D82D8B] to-[#b82274] hover:opacity-95 text-white"
                        : "bg-gradient-to-r from-[#BC8F8F] to-[#a37676] hover:opacity-95 text-white"
                    }`}
                  >
                    {paymentMethod === "momo"
                      ? `Thanh toán qua MoMo • ${formatCurrency(finalTotal)}`
                      : `Xác nhận đặt hàng (COD) • ${formatCurrency(finalTotal)}`}
                  </Button>
                </Form>
              </div>
            </Card>
          </Col>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <Col xs={24} lg={10}>
            <Card className="border-0 shadow-lg rounded-2xl sticky top-8 overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
              <div className="p-4 sm:p-6 border-b border-gray/5">
                <Title
                  level={4}
                  className="!m-0 !font-serif flex items-center gap-2"
                >
                  <CheckCircleOutlined style={{ fontSize: 20, color: "#BC8F8F" }} />
                  Sản phẩm đã chọn ({checkoutItems.length})
                </Title>
              </div>

              <div className="p-4 sm:p-6">
                <div className="max-h-[350px] overflow-y-auto mb-6 space-y-4">
                  {checkoutItems.map((item) => (
                    <div
                      key={item.variant_id}
                      className="flex gap-4 items-center"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-gray/10 flex-shrink-0">
                        <img
                          src={getImageUrl(item.image_url || "")}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/200x200?text=Product";
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Text strong className="block text-xs sm:text-sm truncate font-serif">
                          {item.name}
                        </Text>

                        <Text type="secondary" className="text-[10px] sm:text-[11px] uppercase">
                          {item.variant_name || "Mặc định"} × {item.quantity}
                        </Text>
                      </div>

                      <Text className="font-medium whitespace-nowrap text-xs sm:text-sm">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </Text>
                    </div>
                  ))}
                </div>

                <div className="bg-background p-4 sm:p-6 rounded-2xl border border-gray/10 space-y-3">
                  <div className="flex justify-between">
                    <Text className="text-gray">Tạm tính</Text>

                    <Text className="text-charcoal font-medium">
                      {formatCurrency(checkoutSubtotal)}
                    </Text>
                  </div>

                  {applicableDiscount > 0 && (
                    <div className="flex justify-between">
                      <Text className="text-primary">Ưu đãi mã giảm giá</Text>

                      <Text className="text-primary font-medium">
                        -{formatCurrency(applicableDiscount)}
                      </Text>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Text className="text-gray">Phí vận chuyển</Text>

                    <Text className="text-charcoal font-medium">
                      {shippingFee === 0 ? (
                        <Tag color="green" className="m-0 font-medium">
                          Miễn phí vận chuyển
                        </Tag>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </Text>
                  </div>

                  <Divider className="my-2 border-gray/10" />

                  <div className="flex justify-between items-end pt-2">
                    <Text className="text-charcoal font-serif text-lg">
                      Tổng thanh toán
                    </Text>

                    <Text className="text-2xl font-serif text-primary font-bold">
                      {formatCurrency(finalTotal)}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* MODAL THÊM ĐỊA CHỈ MỚI */}
      <Modal
        title={
          <span className="font-serif text-lg text-charcoal flex items-center gap-2">
            <EnvironmentOutlined className="text-[#BC8F8F]" />
            Thêm địa chỉ nhận hàng mới
          </span>
        }
        open={addressModalVisible}
        onCancel={() => {
          setAddressModalVisible(false);
          addressModalForm.resetFields();
        }}
        footer={null}
        destroyOnClose
        centered
      >
        <Form
          form={addressModalForm}
          layout="vertical"
          onFinish={handleCreateNewAddress}
          className="mt-4"
          initialValues={{
            recipient_name: user.name,
            phone: user.phone || "",
            is_default: addresses.length === 0,
          }}
        >
          <Form.Item
            name="recipient_name"
            label="Họ và tên người nhận"
            rules={[{ required: true, message: "Vui lòng nhập tên người nhận" }]}
          >
            <Input placeholder="Ví dụ: Nguyễn Văn A" className="rounded-lg h-10" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại người nhận"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{9,11}$/, message: "Số điện thoại không hợp lệ (9-11 số)" },
            ]}
          >
            <Input placeholder="Ví dụ: 0901234567" className="rounded-lg h-10" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="province"
                label="Tỉnh / Thành phố"
                rules={[{ required: true, message: "Vui lòng chọn Tỉnh / Thành phố" }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="Chọn Tỉnh / Thành phố"
                  optionFilterProp="label"
                  filterOption={filterProvinceOption}
                  options={VIETNAM_PROVINCES.map((p) => ({ label: p, value: p }))}
                  className="w-full rounded-lg"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="ward"
                label="Xã / Phường"
                rules={[{ required: true, message: "Vui lòng nhập Xã / Phường" }]}
              >
                <Input placeholder="Ví dụ: Phường Bến Nghé" className="rounded-lg h-10" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address_line"
            label="Địa chỉ chi tiết (Số nhà, đường, thôn/xóm)"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ chi tiết" }]}
          >
            <Input
              placeholder="Ví dụ: Số 123 đường Nguyễn Huệ"
              className="rounded-lg h-10"
            />
          </Form.Item>

          <Form.Item name="is_default" valuePropName="checked" className="mb-5">
            <Checkbox>Đặt làm địa chỉ nhận hàng mặc định</Checkbox>
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              onClick={() => {
                setAddressModalVisible(false);
                addressModalForm.resetFields();
              }}
              className="rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={savingNewAddress}
              className="bg-primary rounded-lg"
            >
              Lưu địa chỉ
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
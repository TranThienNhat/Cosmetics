import React, { useState, useMemo, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  InputNumber,
  Divider,
  Input,
  message,
  Tag,
  Checkbox,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  ShoppingOutlined,
  GiftOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useCart } from "../contexts/CartContext";
import { getImageUrl, formatCurrency } from "../utils/helpers";
import api from "../utils/api";

const { Title, Text, Paragraph } = Typography;

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    isLoading,
    couponCode,
    discount,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");

  // 1. STATE QUẢN LÝ CÁC SẢN PHẨM ĐƯỢC CHỌN (LƯU VARIANT_ID)
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const { addToCart } = useCart();
  const [cartRecommendations, setCartRecommendations] = useState<any[]>([]);
  const [addingRecId, setAddingRecId] = useState<number | null>(null);

  // Load smart cross-sell recommendations for cart
  useEffect(() => {
    const loadCartRecommendations = async () => {
      try {
        const prodIds = items.map((i: any) => i.product_id).filter(Boolean);
        const res = await api.post("/analytics/cart-recommendations", { productIds: prodIds });
        const recs = res.data?.data?.topRules || [];
        // Map unique consequent products
        const uniqueProds: any[] = [];
        const seen = new Set();
        for (const rule of recs) {
          if (rule.consequent && !seen.has(rule.consequent.productId)) {
            seen.add(rule.consequent.productId);
            uniqueProds.push(rule.consequent);
          }
          if (uniqueProds.length >= 3) break;
        }
        setCartRecommendations(uniqueProds);
      } catch (err) {
        console.error("Cart recommendations error:", err);
      }
    };
    if (items.length > 0) {
      loadCartRecommendations();
    }
  }, [items.length]);

  const handleQuickAdd = async (prod: any) => {
    if (!prod.defaultVariantId) return;
    try {
      setAddingRecId(prod.productId);
      await addToCart(prod.defaultVariantId, 1);
      message.success(`Đã thêm ${prod.productName} vào giỏ hàng!`);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingRecId(null);
    }
  };

  // 2. LOGIC TÍNH TOÁN DỰA TRÊN SẢN PHẨM ĐÃ CHỌN
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedItemIds.includes(Number(item.variant_id)));
  }, [items, selectedItemIds]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [selectedItems]);

  const shippingFee = selectedItems.length > 0 && selectedSubtotal < 500000 ? 30000 : 0;

  // Tránh việc discount lớn hơn tổng tiền của sản phẩm được chọn gây số âm
  const applicableDiscount = Math.min(discount, selectedSubtotal);
  const finalTotal = Math.max(selectedSubtotal - applicableDiscount + shippingFee, 0);

  // Thêm useEffect vào trong component CartPage
  useEffect(() => {
    // Gọi hàm xóa coupon từ Context mỗi khi component mount
    removeCoupon();
  }, []);

  // 3. XỬ LÝ CHỌN SẢN PHẨM
  const handleSelectToggle = (variantId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(variantId)
        ? prev.filter((id) => id !== variantId)
        : [...prev, variantId]
    );
  };

  // Hàm chọn tất cả / bỏ chọn tất cả
  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedItemIds(items.map((item) => Number(item.variant_id)));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleQuantityChange = (variantId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(variantId, newQuantity);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return message.warning("Vui lòng nhập mã giảm giá!");
    try {
      await applyCoupon(couponInput);
      setCouponInput("");
    } catch (error) { }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center bg-white p-10 md:p-14 rounded-2xl shadow-sm border border-gray/10 max-w-md w-full">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingOutlined style={{ fontSize: 36, color: "#BC8F8F" }} />
          </div>
          <Title level={3} className="!font-serif !text-charcoal mb-3">Giỏ hàng trống</Title>
          <Paragraph className="text-gray mb-8">Bạn chưa chọn được sản phẩm nào sao?</Paragraph>
          <Link to="/products">
            <Button type="primary" size="large" className="bg-primary border-primary hover:bg-primary/90 rounded-lg h-12 px-10 font-medium w-full">
              Mua sắm ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">

        {/* HEADER */}
        <div className="mb-10 border-b border-gray/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <Title level={2} className="!font-serif !text-charcoal !mb-2">Giỏ hàng của bạn</Title>
            <Text className="text-gray uppercase tracking-widest text-xs">Muse Cosmetics / Shopping Cart</Text>
          </div>

          {/* NÚT CHỌN TẤT CẢ */}
          <div className="bg-white px-4 py-2 rounded-xl border border-gray/10 shadow-sm flex items-center gap-3">
            <Checkbox
              onChange={handleSelectAll}
              checked={selectedItemIds.length === items.length && items.length > 0}
              indeterminate={selectedItemIds.length > 0 && selectedItemIds.length < items.length}
              className="font-medium text-charcoal"
            >
              Chọn tất cả
            </Checkbox>
            {selectedItemIds.length > 0 && (
              <Button
                type="text"
                size="small"
                danger
                className="text-xs hover:bg-red-50"
                onClick={() => setSelectedItemIds([])}
              >
                Bỏ chọn
              </Button>
            )}
          </div>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} lg={15}>
            <div className="space-y-4">
              {items.map((item) => {
                const isSelected = selectedItemIds.includes(Number(item.variant_id));
                return (
                  <Card
                    key={item.variant_id}
                    className={`border transition-all duration-300 overflow-hidden bg-white rounded-2xl ${isSelected ? "border-primary shadow-md ring-1 ring-primary/10" : "border-gray/10 shadow-sm"
                      }`}
                    bodyStyle={{ padding: "20px" }}
                  >
                    <div className="flex items-center gap-4">
                      {/* CHECKBOX RIÊNG LẺ */}
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectToggle(Number(item.variant_id))}
                        className="scale-125"
                      />

                      {/* Ảnh sản phẩm */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray/5 flex-shrink-0 border border-gray/5">
                        <img
                          src={getImageUrl(item.image_url || "")}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Product"; }}
                        />
                      </div>

                      {/* Thông tin */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.product_id}`} className="text-charcoal font-serif text-base hover:text-primary transition-colors block mb-1 truncate">
                          {item.name}
                        </Link>
                        <Tag className="bg-primary/5 text-primary border-none rounded-md px-2 py-0.5 text-[10px] font-medium">
                          {item.variant_name || "Mặc định"}
                        </Tag>
                      </div>

                      {/* Giá & Điều chỉnh số lượng */}
                      <div className="flex flex-col items-end gap-3">
                        <Text className="text-primary font-bold text-base">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </Text>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-background rounded-lg border border-gray/20 p-0.5">
                            <Button
                              type="text" size="small" icon={<MinusOutlined style={{ fontSize: 10 }} />}
                              onClick={() => handleQuantityChange(Number(item.variant_id), item.quantity - 1)}
                              disabled={item.quantity <= 1 || isLoading}
                              className="text-gray hover:text-charcoal"
                            />
                            <InputNumber
                              min={1} value={item.quantity} controls={false} readOnly
                              className="w-8 border-0 bg-transparent text-center font-medium !text-charcoal text-xs"
                            />
                            <Button
                              type="text" size="small" icon={<PlusOutlined style={{ fontSize: 10 }} />}
                              onClick={() => handleQuantityChange(Number(item.variant_id), item.quantity + 1)}
                              disabled={isLoading}
                              className="text-gray hover:text-charcoal"
                            />
                          </div>

                          <Button
                            type="text"
                            icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                            onClick={() => removeFromCart(item.variant_id)}
                            disabled={isLoading}
                            className="text-gray/40 hover:text-red-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* AI GỢI Ý MUA KÈM THÔNG MINH (CART CROSS-SELL RECOMMENDATIONS) */}
              {cartRecommendations.length > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-br from-[#FDFBF7] to-[#FAF3EC] border border-[#E6CCB2] rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#BC8F8F] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Gợi ý thông minh
                        </span>
                        <span className="text-xs font-semibold text-charcoal">Khách hàng thường mua kèm:</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cartRecommendations.map((rec: any) => (
                      <div key={rec.productId} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex gap-3 items-center">
                          <img
                            src={rec.imageUrl ? getImageUrl(rec.imageUrl) : "https://via.placeholder.com/60"}
                            alt={rec.productName}
                            className="w-14 h-14 rounded-lg object-contain border p-1 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-charcoal line-clamp-2 leading-tight">
                              {rec.productName}
                            </div>
                            <div className="text-xs font-bold text-[#BC8F8F] mt-1">
                              {formatCurrency(rec.price)}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="dashed"
                          size="small"
                          block
                          loading={addingRecId === rec.productId}
                          onClick={() => handleQuickAdd(rec)}
                          className="mt-3 text-xs font-medium border-[#BC8F8F] text-[#BC8F8F] hover:!bg-[#BC8F8F]/10 rounded-lg"
                        >
                          + Thêm vào giỏ
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Col>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <Col xs={24} lg={9}>
            <div className="sticky top-24 space-y-6">
              {/* Voucher Card */}
              <Card className="border border-gray/10 shadow-sm rounded-2xl bg-white" bodyStyle={{ padding: "20px" }}>
                <div className="flex items-center gap-2 mb-4 text-charcoal font-medium">
                  <GiftOutlined style={{ fontSize: 18, color: "#BC8F8F" }} />
                  <span>Mã ưu đãi</span>
                </div>
                {!couponCode ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã..."
                      className="rounded-lg h-10"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    />
                    <Button type="primary" className="h-10 px-4" onClick={handleApplyCoupon} loading={isLoading}>
                      Áp dụng
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <div>
                      <Text type="secondary" className="text-[10px] block uppercase">Ưu đãi áp dụng</Text>
                      <Text className="text-primary font-bold">{couponCode}</Text>
                    </div>
                    <Button type="text" icon={<CloseOutlined style={{ fontSize: 12 }} />} onClick={removeCoupon} className="text-gray hover:text-red-500" />
                  </div>
                )}
              </Card>

              {/* Summary Card */}
              <Card className="border border-gray/10 shadow-sm rounded-2xl bg-white" bodyStyle={{ padding: "24px" }}>
                <Title level={4} className="!font-serif !text-charcoal !mb-6">Tóm tắt đơn hàng</Title>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Text className="text-gray">Tạm tính ({selectedItems.length} sản phẩm)</Text>
                    <Text className="text-charcoal font-medium">{formatCurrency(selectedSubtotal)}</Text>
                  </div>

                  {applicableDiscount > 0 && (
                    <div className="flex justify-between">
                      <Text className="text-primary">Giảm giá</Text>
                      <Text className="text-primary font-medium">-{formatCurrency(applicableDiscount)}</Text>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Text className="text-gray">Phí vận chuyển</Text>
                    <Text className="text-charcoal font-medium">
                      {selectedItems.length === 0 ? "-" : (shippingFee === 0 ? <Tag color="green" className="m-0 border-none">Miễn phí</Tag> : formatCurrency(30000))}
                    </Text>
                  </div>

                  <Divider className="my-4 border-gray/10" />

                  <div className="flex justify-between items-end mb-2">
                    <Text className="text-charcoal font-serif text-lg">Tổng cộng</Text>
                    <Text className="text-2xl font-serif text-primary font-bold">
                      {formatCurrency(finalTotal)}
                    </Text>
                  </div>

                  {selectedItems.length > 0 && selectedSubtotal < 500000 && (
                    <div className="bg-primary/5 p-3 rounded-lg text-center mt-2 border border-primary/10">
                      <Text className="text-primary text-[11px]">
                        Mua thêm <span className="font-bold">{formatCurrency(500000 - selectedSubtotal)}</span> để được **Freeship** ✨
                      </Text>
                    </div>
                  )}

                  <Button
                    type="primary"
                    size="large"
                    block
                    className="h-12 rounded-xl font-medium text-base mt-6 bg-primary"
                    onClick={() => navigate("/checkout", { state: { selectedVariantIds: selectedItemIds } })}
                    loading={isLoading}
                    disabled={selectedItemIds.length === 0}
                  >
                    {selectedItemIds.length === 0 ? "Vui lòng chọn sản phẩm" : `Thanh toán (${selectedItemIds.length})`}
                  </Button>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CartPage;
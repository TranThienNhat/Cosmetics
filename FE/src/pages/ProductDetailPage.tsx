import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Row,
  Col,
  Typography,
  Button,
  InputNumber,
  Tabs,
  Rate,
  Tag,
  Spin,
  message,
  Breadcrumb,
  Divider,
} from "antd";
import { ShoppingCart, Heart, Zap, Star, CheckCircle2, ShieldCheck, Truck } from "lucide-react"; 
import { ProductVariant } from "../types";
import api from "../utils/api";
import { getImageUrl, formatCurrency } from "../utils/helpers";
import { useCart } from "../contexts/CartContext";
import CartDrawer from "../components/CartDrawer";

const { Title, Paragraph, Text } = Typography;

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Frequently Bought Together (FBT) Bundle states
  const [bundleData, setBundleData] = useState<any | null>(null);
  const [selectedBundleItemIds, setSelectedBundleItemIds] = useState<number[]>([]);
  const [addingBundle, setAddingBundle] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
      loadFrequentlyBoughtTogether(id);
    }
  }, [id]);

  const loadFrequentlyBoughtTogether = async (productId: string) => {
    try {
      const res = await api.get(`/analytics/frequently-bought-together/${productId}`);
      const bundle = res.data?.data?.targetBundle;
      if (bundle && bundle.recommendedItems?.length > 0) {
        setBundleData(bundle);
        const allIds = [bundle.mainProduct.productId, ...bundle.recommendedItems.map((r: any) => r.productId)];
        setSelectedBundleItemIds(allIds);
      } else {
        setBundleData(null);
      }
    } catch (err) {
      console.error("FBT load error:", err);
      setBundleData(null);
    }
  };

  const handleToggleBundleItem = (itemId: number) => {
    if (selectedBundleItemIds.includes(itemId)) {
      if (selectedBundleItemIds.length <= 1) {
        message.info("Cần chọn ít nhất 1 sản phẩm trong combo.");
        return;
      }
      setSelectedBundleItemIds(selectedBundleItemIds.filter((x) => x !== itemId));
    } else {
      setSelectedBundleItemIds([...selectedBundleItemIds, itemId]);
    }
  };

  const handleAddBundleToCart = async () => {
    if (!bundleData) return;
    try {
      setAddingBundle(true);
      const allPossible = [bundleData.mainProduct, ...bundleData.recommendedItems];
      const itemsToAdd = allPossible.filter((item: any) => selectedBundleItemIds.includes(item.productId));

      for (const itm of itemsToAdd) {
        const vId = itm.productId === Number(id) && selectedVariant ? selectedVariant.id : itm.defaultVariantId;
        if (vId) {
          await addToCart(vId, 1);
        }
      }
      message.success(`Đã thêm combo ${itemsToAdd.length} món vào giỏ hàng!`);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error("Add bundle error:", err);
    } finally {
      setAddingBundle(false);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productRes = await api.get(`/products/${id}`);
      const productData = productRes.data.data;

      if (!productData) {
        message.error("Sản phẩm không tồn tại hoặc đã bị xóa!");
        navigate("/products");
        return;
      }

      setProduct(productData);
      
      // Mặc định chọn phiên bản đầu tiên
      if (productData.variants?.length > 0) {
          setSelectedVariant(productData.variants[0]);
      }
      
      // Lấy ảnh chính
      const mainImg = productData.galleries?.find((g: any) => g.is_main === 1) || productData.galleries?.[0];
      setSelectedImage(mainImg?.image_url || productData.thumb_image || "");

      // Tải đánh giá
      try {
        const reviewsRes = await api.get(`/reviews/product/${id}`);
        setReviews(reviewsRes.data.data || []);
      } catch (revErr) { 
        setReviews([]); 
      }

    } catch (error: any) {
      message.error("Không thể tải thông tin sản phẩm lúc này.");
      navigate("/products");
    } finally { 
      setLoading(false); 
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return message.warning("Vui lòng chọn phiên bản sản phẩm!");
    try {
      setActionLoading(true);
      await addToCart(selectedVariant.id, quantity);
      setIsDrawerOpen(true);
    } catch (error) { 
      // Lỗi đã xử lý trong context
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) return message.warning("Vui lòng chọn phiên bản sản phẩm!");
    try {
      setActionLoading(true);
      await addToCart(selectedVariant.id, quantity);
      navigate("/cart");
    } catch (error) { 
      // Lỗi đã xử lý
    } finally { 
      setActionLoading(false); 
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length 
    : 0;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Spin size="large" className="text-primary" />
      <Text className="mt-4 text-gray italic font-serif text-sm">Đang tải thông tin sản phẩm...</Text>
    </div>
  );
  
  if (!product) return null;

  const allImages = product.galleries?.map((g: any) => g.image_url) || [product.thumb_image];

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8 text-[11px] uppercase tracking-widest text-gray">
          <Breadcrumb.Item><Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link></Breadcrumb.Item>
          <Breadcrumb.Item><Link to="/products" className="hover:text-primary transition-colors">Cửa hàng</Link></Breadcrumb.Item>
          <Breadcrumb.Item className="text-charcoal font-medium">{product.name}</Breadcrumb.Item>
        </Breadcrumb>

        <Row gutter={[48, 48]}>
          {/* CỘT TRÁI: GALLERY ẢNH */}
          <Col xs={24} lg={11}>
            <div className="sticky top-24">
              {/* KHUNG ẢNH CHÍNH: Ép aspect-square (1:1) hoặc 4:5, dùng object-contain để ảnh luôn hiển thị toàn bộ, không bị cắt xén làm mờ */}
              <div className="aspect-square md:aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-gray/10 p-2 flex items-center justify-center">
                <img
                  src={getImageUrl(selectedImage)}
                  alt={product.name}
                  className="w-full h-full object-contain transition-all duration-700 hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x800?text=Linh"; }}
                />
              </div>
              
              {/* LIST ẢNH THUMBNAIL CŨNG ĐƯỢC CHUẨN HÓA LẠI */}
              <div className="flex gap-3 mt-4 overflow-x-auto pb-4 custom-scrollbar">
                {allImages.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-24 rounded-lg overflow-hidden border-2 flex-shrink-0 bg-white transition-all ${
                        selectedImage === img ? "border-primary opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={getImageUrl(img)} alt={`thumb-${i}`} className="w-full h-full object-contain p-1" />
                  </button> 
                ))}
              </div>
            </div>
          </Col>

          {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
          <Col xs={24} lg={13}>
            <div className="space-y-8">
              <div>
                <Title level={1} className="!font-serif !text-3xl md:!text-4xl !text-charcoal !mb-4 leading-tight">
                  {product.name}
                </Title>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Rate disabled allowHalf value={averageRating} className="text-sm text-yellow-400" />
                    <Text className="text-gray text-xs font-medium">({reviews.length} đánh giá)</Text>
                  </div>
                  <Divider type="vertical" className="bg-gray/20 h-4" />
                </div>
              </div>

              {/* Box Giá */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray/10 inline-block min-w-[300px]">
                <Text className="text-gray line-through text-sm block mb-1">
                  {formatCurrency(Number(selectedVariant?.price || 0) * 1.2)}
                </Text>
                <div className="flex items-baseline gap-3">
                    <Text className="text-3xl md:text-4xl font-serif text-primary font-bold">
                        {formatCurrency(Number(selectedVariant?.price || product.min_price || 0))}
                    </Text>
                    <Tag className="bg-primary/10 text-primary border-none rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                      -20%
                    </Tag>
                </div>
              </div>

              {/* Lựa chọn phiên bản */}
              {product.variants?.length > 0 && (
                <div className="space-y-3">
                  <Text strong className="text-xs uppercase tracking-widest text-charcoal">Phiên bản</Text>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v: any) => (
                      <Button
                        key={v.id}
                        onClick={() => {
                            setSelectedVariant(v);
                            if(v.image_url) setSelectedImage(v.image_url);
                        }}
                        className={`h-10 px-5 rounded-lg font-medium transition-all ${
                            selectedVariant?.id === v.id 
                            ? "bg-primary border-primary text-white" 
                            : "bg-background border-gray/20 text-gray hover:!text-primary hover:!border-primary"
                        }`}
                      >
                        {v.variant_name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Số lượng */}
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center bg-background border border-gray/20 rounded-lg p-0.5">
                    <Button 
                        type="text" 
                        size="small"
                        icon={<Text className="font-medium">-</Text>} 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-gray hover:text-charcoal"
                    />
                    <InputNumber 
                        min={1} 
                        max={selectedVariant?.stock_quantity || 10} 
                        value={quantity} 
                        onChange={(v) => setQuantity(v || 1)} 
                        controls={false}
                        bordered={false}
                        className="w-12 text-center font-medium !text-charcoal text-sm"
                    />
                    <Button 
                        type="text" 
                        size="small"
                        icon={<Text className="font-medium">+</Text>} 
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= (selectedVariant?.stock_quantity || 0)}
                        className="text-gray hover:text-charcoal"
                    />
                </div>
                <Text className="text-gray text-xs">
                    {selectedVariant?.stock_quantity && selectedVariant.stock_quantity > 0 
                        ? `Còn lại ${selectedVariant.stock_quantity} sản phẩm` 
                        : <span className="text-red-500 font-medium">Tạm hết hàng</span>}
                </Text>
              </div>

              {/* Nút Action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<Zap size={18} fill="currentColor" />} 
                  className="bg-charcoal border-charcoal h-12 flex-1 rounded-lg font-medium shadow-sm hover:!bg-black transition-all"
                  onClick={handleBuyNow}
                  loading={actionLoading}
                  disabled={!selectedVariant?.stock_quantity}
                >
                  Mua ngay
                </Button>

                <Button 
                  size="large" 
                  icon={<ShoppingCart size={18} />} 
                  className="bg-transparent border-primary text-primary h-12 flex-1 rounded-lg font-medium hover:!bg-primary/5 hover:!border-primary hover:!text-primary transition-all"
                  onClick={handleAddToCart}
                  loading={actionLoading}
                  disabled={!selectedVariant?.stock_quantity}
                >
                  Thêm vào giỏ
                </Button>
              </div>

              {/* Cam kết shop */}
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray/10">
                  <div className="flex items-center gap-3 text-xs text-gray">
                    <ShieldCheck size={18} className="text-primary" /> Cam kết chính hãng
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray">
                    <Truck size={18} className="text-primary" /> Miễn phí vận chuyển
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray">
                    <CheckCircle2 size={18} className="text-primary" /> Đổi trả 7 ngày
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray">
                    <Heart size={18} className="text-primary" /> Đóng gói an toàn
                  </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* FREQUENTLY BOUGHT TOGETHER (COMBO GỢI Ý MUA KÈM TỪ AI) */}
        {bundleData && bundleData.recommendedItems?.length > 0 && (
          <div className="mt-16 bg-gradient-to-br from-[#FDFBF7] to-[#FAF3EC] border border-[#E6CCB2] rounded-3xl p-6 md:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8 pb-4 border-b border-[#E6CCB2]/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 bg-[#BC8F8F] text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                    AI Combo Suggestion
                  </span>
                  <Tag color="volcano" className="font-semibold text-xs border-none">
                    Tiết kiệm thêm 10%
                  </Tag>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-charcoal font-bold mt-2">
                  Thường Được Mua Cùng Nhau
                </h3>
                <p className="text-xs text-gray/80 mt-0.5">
                  Khách hàng mua sản phẩm này thường chọn thêm các sản phẩm bổ trợ sau để tối ưu hiệu quả làm đẹp:
                </p>
              </div>
            </div>

            {(() => {
              const allBundle = [bundleData.mainProduct, ...bundleData.recommendedItems];
              const selectedItems = allBundle.filter((item: any) => selectedBundleItemIds.includes(item.productId));
              const originalTotal = selectedItems.reduce((sum: number, itm: any) => sum + (itm.price || 0), 0);
              const comboDiscount = selectedItems.length > 1 ? originalTotal * 0.1 : 0;
              const finalComboTotal = originalTotal - comboDiscount;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Product Images connected with '+' */}
                  <div className="lg:col-span-8 flex flex-wrap items-center gap-3 md:gap-4 justify-center md:justify-start">
                    {allBundle.map((item: any, idx: number) => {
                      const isChecked = selectedBundleItemIds.includes(item.productId);
                      const isMain = idx === 0;
                      return (
                        <React.Fragment key={item.productId}>
                          {idx > 0 && (
                            <span className="text-xl md:text-2xl font-bold text-[#BC8F8F] px-1">+</span>
                          )}
                          <div
                            onClick={() => handleToggleBundleItem(item.productId)}
                            className={`cursor-pointer transition-all duration-300 rounded-2xl p-3 border-2 bg-white flex flex-col items-center text-center w-36 md:w-44 ${
                              isChecked
                                ? "border-[#BC8F8F] shadow-md scale-105"
                                : "border-gray-200 opacity-50 hover:opacity-80"
                            }`}
                          >
                            <div className="relative w-24 h-24 md:w-28 md:h-28 mb-2">
                              <img
                                src={item.imageUrl ? getImageUrl(item.imageUrl) : "https://via.placeholder.com/120"}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                              />
                              {isMain && (
                                <span className="absolute top-0 left-0 bg-[#2D2D2D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Đang xem
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-charcoal line-clamp-2 min-h-[32px]">
                              {item.productName}
                            </div>
                            <div className="text-xs font-bold text-[#BC8F8F] mt-1">
                              {formatCurrency(item.price)}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Right: Price & Add All Button */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E6CCB2]/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-gray uppercase tracking-wider font-semibold mb-1">
                        Tổng giá trị ({selectedItems.length} sản phẩm)
                      </div>
                      <div className="space-y-1">
                        {selectedItems.length > 1 && (
                          <div className="text-sm text-gray line-through">
                            {formatCurrency(originalTotal)}
                          </div>
                        )}
                        <div className="text-2xl font-extrabold text-[#BC8F8F]">
                          {formatCurrency(finalComboTotal)}
                        </div>
                        {selectedItems.length > 1 && (
                          <div className="text-xs text-emerald-600 font-semibold">
                            Tiết kiệm {formatCurrency(comboDiscount)} (-10%)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<ShoppingCart size={18} />}
                        loading={addingBundle}
                        onClick={handleAddBundleToCart}
                        disabled={selectedItems.length === 0}
                        className="bg-[#BC8F8F] hover:bg-[#a57a7a] border-none h-12 rounded-xl font-medium shadow-md flex items-center justify-center gap-2"
                      >
                        Thêm {selectedItems.length} sản phẩm vào giỏ
                      </Button>
                      <p className="text-[11px] text-gray text-center italic">
                        Bấm vào từng món phía trên để chọn hoặc bỏ chọn khỏi combo
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TABS CHI TIẾT & REVIEW */}
        <div className="mt-24">
        <Tabs
          defaultActiveKey="1"
          size="large"
          centered
          className="Linh-tabs"
          items={[
            {
              key: "1",
              label: <span className="px-6 font-serif text-lg tracking-wide">Mô tả sản phẩm</span>,
              children: (
                <div className="max-w-4xl mx-auto py-8">
                  <div 
                    className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray/10"
                  >
                    <div
                      className="description-container leading-loose text-charcoal/80 text-base font-light"
                      style={{ 
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word' 
                      }}
                    >
                      {product.description || "Nội dung đang được cập nhật từ Linh Cosmetics..."}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "2",
              label: <span className="px-6 font-serif text-lg tracking-wide">Đánh giá ({reviews.length})</span>,
              children: (
                <div className="max-w-4xl mx-auto py-8">
                  {reviews.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray/20 shadow-sm">
                      <Star size={32} className="text-gray/20 mx-auto mb-3" />
                      <Paragraph className="text-gray italic font-serif mb-0 text-base">
                        Chưa có đánh giá nào cho sản phẩm này.<br/>
                        Hãy là người đầu tiên chia sẻ cảm nhận nhé.
                      </Paragraph>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reviews.map((r: any) => (
                        <div 
                          key={r.id} 
                          className="bg-white p-6 rounded-2xl border border-gray/5 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary font-serif font-bold text-base border border-primary/10">
                                {r.user_name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <Text strong className="block text-charcoal font-serif text-base leading-none mb-1">
                                  {r.user_name}
                                </Text>
                                <Text className="text-[10px] text-gray uppercase tracking-widest font-medium">
                                  {new Date(r.created_at).toLocaleDateString("vi-VN")}
                                </Text>
                              </div>
                            </div>
                            <Rate disabled value={Number(r.rating)} className="text-[10px] text-yellow-500" />
                          </div>
                          
                          <div className="relative pt-2 pl-4 border-l-2 border-primary/10">
                            <Paragraph className="text-gray text-sm leading-relaxed italic mb-0">
                              "{r.comment}"
                            </Paragraph>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
      </div>

      {/* Cart Drawer trượt ra khi thêm hàng */}
      <CartDrawer 
        visible={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
};

export default ProductDetailPage;
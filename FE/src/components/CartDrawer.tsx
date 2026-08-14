import React from "react";
import { Drawer, Button, Typography, Space, Empty, Spin } from "antd";
import { ShoppingBag, X, Minus, Plus } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { getImageUrl, formatCurrency } from "../utils/helpers";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface CartDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ visible, onClose }) => {
  const navigate = useNavigate();
  // Lấy đầy đủ các hàm và trạng thái từ CartContext
  const { 
    items, 
    subtotal, 
    updateQuantity, 
    removeFromCart, 
    isLoading 
  } = useCart();

  const handleUpdateQty = (variantId: number, newQty: number) => {
    if (newQty >= 1) {
      updateQuantity(variantId, newQty);
    }
  };

  return (
    <Drawer
      title={
        <div className="flex justify-between items-center">
          <Space>
            <ShoppingBag size={20} className="text-primary" />
            <span className="font-serif text-lg text-charcoal">Giỏ hàng nhanh</span>
          </Space>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      extra={
        <X 
          size={20} 
          className="cursor-pointer text-gray-400 hover:text-charcoal transition-colors" 
          onClick={onClose} 
        />
      }
      closable={false}
      styles={{ 
        body: { padding: "10px 16px" },
        footer: { padding: 0 } 
      }}
      footer={
        items.length > 0 && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex justify-between mb-4">
              <Text className="text-gray-500 text-base">Tạm tính:</Text>
              <Text className="text-primary text-xl font-bold">{formatCurrency(subtotal)}</Text>
            </div>
            <Space direction="vertical" className="w-full" size="middle">
              <Button 
                block 
                size="large" 
                className="h-12 border-gray-300 rounded-lg hover:text-primary hover:border-primary"
                onClick={() => { onClose(); navigate("/cart"); }}
              >
                XEM CHI TIẾT GIỎ HÀNG
              </Button>
            </Space>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <Empty description="Giỏ hàng đang trống" />
          <Button type="link" onClick={onClose} className="mt-4 text-primary">
            Tiếp tục khám phá sản phẩm
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Overlay loading nhẹ khi đang cập nhật API */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center">
              <Spin size="small" />
            </div>
          )}
          
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.variant_id} className="py-5">
                <div className="flex gap-4">
                  {/* Ảnh sản phẩm */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                    <img
                      src={getImageUrl(item.image_url || "")}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Product"; }}
                    />
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Title 
                          level={5} 
                          className="!m-0 line-clamp-1 flex-1 !text-sm !text-charcoal hover:text-primary cursor-pointer"
                          onClick={() => { onClose(); navigate(`/products/${item.product_id}`); }}
                        >
                          {item.name}
                        </Title>
                        <button 
                          onClick={() => removeFromCart(item.variant_id)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                          disabled={isLoading}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Text type="secondary" className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.variant_name || "Mặc định"}
                        </Text>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      {/* Bộ tăng giảm số lượng mini */}
                      <div className="flex items-center border border-gray-200 rounded bg-white overflow-hidden">
                        <button 
                          className="px-2 py-1 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                          onClick={() => handleUpdateQty(item.variant_id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isLoading}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-xs font-bold border-x border-gray-200 min-w-[32px] text-center">
                          {item.quantity}
                        </span>
                        <button 
                          className="px-2 py-1 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                          onClick={() => handleUpdateQty(item.variant_id, item.quantity + 1)}
                          disabled={isLoading}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <Text strong className="text-charcoal text-xs">
                        {formatCurrency(Number(item.price || 0) * item.quantity)}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default CartDrawer;
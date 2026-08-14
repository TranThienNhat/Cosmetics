import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { CartItem } from "../types";
import api from "../utils/api";
import { message } from "antd";
import { useAuth } from "./AuthContext";

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  isLoading: boolean;
  addToCart: (variantId: number, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: number, quantity: number) => Promise<void>;
  removeFromCart: (variantId: number) => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  // Cập nhật: Chấp nhận tham số optional để xóa từng phần hoặc xóa hết
  clearCart: (variantIds?: number[]) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Tính toán số lượng và tổng tiền cuối cùng dựa trên state từ backend
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = subtotal - discount;

  // 1. Tải dữ liệu giỏ hàng từ Backend
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setSubtotal(0);
      setDiscount(0);
      setCouponCode(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get("/cart");
      const cartData = response.data;

      setItems(cartData.items || []);
      setSubtotal(cartData.subtotal || 0);
      setDiscount(cartData.discount || 0);
      setCouponCode(cartData.couponCode || null);
    } catch (error: any) {
      console.error("Error loading cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      refreshCart();
    }
  }, [refreshCart, authLoading]);

  // 2. Thêm sản phẩm vào giỏ
  const addToCart = useCallback(
    async (variantId: number, quantity: number = 1) => {
      if (!isAuthenticated) {
        message.warning("Nàng vui lòng đăng nhập để mua sắm nhé! ✨");
        return;
      }

      try {
        setIsLoading(true);
        await api.post("/cart/add", { variantId, quantity });
        await refreshCart();
      } catch (error: any) {
        message.error(error.response?.data?.message || "Không thể thêm vào giỏ");
      } finally {
        setIsLoading(false);
      }
    },
    [refreshCart, isAuthenticated]
  );

  // 3. Cập nhật số lượng
  const updateQuantity = useCallback(
    async (variantId: number, quantity: number) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        await api.put(`/cart/${variantId}`, { quantity });
        await refreshCart();
      } catch (error: any) {
        message.error(error.response?.data?.message || "Lỗi cập nhật số lượng");
      } finally {
        setIsLoading(false);
      }
    },
    [refreshCart, isAuthenticated]
  );

  // 4. Xóa sản phẩm khỏi giỏ
  const removeFromCart = useCallback(
    async (variantId: number) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        await api.delete(`/cart/${variantId}`);
        await refreshCart();
      } catch (error: any) {
        message.error("Không thể xóa sản phẩm");
      } finally {
        setIsLoading(false);
      }
    },
    [refreshCart, isAuthenticated]
  );

  // 5. Áp dụng mã giảm giá
  const applyCoupon = useCallback(async (couponCode: string) => {
    try {
      setIsLoading(true);
      const response = await api.post("/cart/coupon/apply", { couponCode });
      if (response.data.success) {
        await refreshCart();
        message.success("Áp dụng mã thành công! ✨");
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Mã giảm giá không hợp lệ");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCart]);

  // 6. Hủy mã giảm giá
  const removeCoupon = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.delete("/cart/coupon");
      await refreshCart();
    } catch (error) {
      message.error("Không thể gỡ mã lúc này");
    } finally {
      setIsLoading(false);
    }
  }, [refreshCart]);

  /**
   * 7. Làm sạch giỏ hàng (CẬP NHẬT MỚI)
   * @param variantIds - Nếu có, chỉ xóa các ID này. Nếu không, xóa hết.
   */
  const clearCart = useCallback(async (variantIds?: number[]) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      
      if (variantIds && variantIds.length > 0) {
        // Trường hợp 1: Xóa các sản phẩm đã chọn sau khi thanh toán
        // Nếu Backend của bạn sau khi Order thành công đã tự xóa giỏ, 
        // thì ở đây chỉ cần gọi refreshCart() là đủ.
        await refreshCart();
      } else {
        // Trường hợp 2: Người dùng nhấn nút "Xóa hết giỏ hàng"
        await api.delete("/cart/clear");
        setItems([]);
        setSubtotal(0);
        setDiscount(0);
        setCouponCode(null);
      }
    } catch (error) {
      console.error("Lỗi khi dọn dẹp giỏ hàng:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshCart]);

  const value: CartContextType = {
    items,
    totalItems,
    totalAmount,
    subtotal,
    discount,
    couponCode,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
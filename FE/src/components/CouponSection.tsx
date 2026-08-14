import React, { useState } from "react";
import { Input, Button, message, Tag } from "antd";
import { Gift, X } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { formatCurrency } from "../utils/helpers";
import api from "../utils/api";

const CouponSection: React.FC = () => {
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const { refreshCart, discount, couponCode: appliedCouponCode } = useCart();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      message.error("Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      setIsApplying(true);
      const response = await api.post("/cart/coupon/apply", {
        couponCode: couponCode.trim(),
      });

      if (response.data.success) {
        setCouponCode("");
        message.success(response.data.message);
        await refreshCart();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể áp dụng mã giảm giá";
      message.error(errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await api.delete("/cart/coupon");
      message.success("Đã xóa mã giảm giá");
      await refreshCart();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể xóa mã giảm giá";
      message.error(errorMessage);
    }
  };

  return (
    <div className="space-y-3">
      {appliedCouponCode ? (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-green-600" />
              <span className="text-green-700 font-medium">
                {appliedCouponCode}
              </span>
              <Tag color="green">-{formatCurrency(discount)}</Tag>
            </div>
            <Button
              type="text"
              size="small"
              icon={<X size={14} />}
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-700"
            />
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Nhập mã giảm giá"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onPressEnter={handleApplyCoupon}
            prefix={<Gift size={16} className="text-gray-400" />}
          />
          <Button
            type="primary"
            onClick={handleApplyCoupon}
            loading={isApplying}
            className="bg-primary border-primary">
            Áp dụng
          </Button>
        </div>
      )}

      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Giảm giá:</span>
          <span className="font-medium">-{formatCurrency(discount)}</span>
        </div>
      )}
    </div>
  );
};

export default CouponSection;

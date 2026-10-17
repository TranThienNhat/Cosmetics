import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, Button, Typography, Tag, Spin, Result } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ShoppingOutlined,
  CopyOutlined,
  ArrowRightOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import api from "../utils/api";
import { formatCurrency } from "../utils/helpers";
import { Order } from "../types";

const { Title, Text, Paragraph } = Typography;

const MomoReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("orderId");
  const resultCode = searchParams.get("resultCode");
  const transId = searchParams.get("transId") || searchParams.get("momoTransId");
  const amountStr = searchParams.get("amount");
  const momoMessage = searchParams.get("message");

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const confirmPayment = async () => {
      const successFlag = resultCode === "0" || resultCode === 0 as any;
      setIsSuccess(successFlag);

      if (orderId) {
        try {
          const res = await api.post("/orders/momo-return-confirm", {
            orderId,
            resultCode: Number(resultCode ?? 0),
            transId,
          });

          if (res.data?.order) {
            setOrder(res.data.order);
          }
        } catch (err) {
          console.error("Lỗi khi xác nhận giao dịch MoMo:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [orderId, resultCode, transId]);

  const handleCopyCode = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finalAmount = order?.final_amount
    ? Number(order.final_amount)
    : amountStr
    ? Number(amountStr)
    : 0;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background px-4">
        <Spin size="large" />
        <Text className="mt-4 text-charcoal font-medium text-base">
          Đang xác thực kết quả thanh toán từ Ví MoMo...
        </Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white text-center p-4 sm:p-8">
          {isSuccess ? (
            <div>
              {/* SUCCESS ICON WITH MOMO BADGE */}
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#D82D8B]/10 flex items-center justify-center mx-auto text-[#D82D8B]">
                  <CheckCircleFilled className="text-5xl sm:text-6xl text-[#D82D8B]" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#D82D8B] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md">
                  MoMo
                </div>
              </div>

              <Title level={2} className="!font-serif !text-charcoal !m-0 !mb-2 !text-2xl sm:!text-3xl">
                Thanh toán thành công!
              </Title>
              <Paragraph className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-6">
                Cảm ơn nàng đã tin tưởng Linh Cosmetics. Đơn hàng của nàng đã được thanh toán qua Ví MoMo và đang được chuẩn bị để giao sớm nhất.
              </Paragraph>

              {/* THÔNG TIN CHI TIẾT GIAO DỊCH */}
              <div className="bg-[#FAF3EC]/60 border border-[#BC8F8F]/20 rounded-2xl p-5 sm:p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray/10">
                  <Text className="text-gray-500 text-xs sm:text-sm">Mã đơn hàng:</Text>
                  <div
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 cursor-pointer font-mono font-bold text-sm sm:text-base text-primary hover:text-primary/80 transition-colors"
                  >
                    <span>{orderId || order?.order_code || "---"}</span>
                    <CopyOutlined style={{ fontSize: 13 }} />
                    {copied && <span className="text-[11px] text-green-600 font-normal">Đã chép!</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray/10">
                  <Text className="text-gray-500 text-xs sm:text-sm">Số tiền thanh toán:</Text>
                  <Text strong className="font-serif text-lg sm:text-xl text-[#D82D8B]">
                    {formatCurrency(finalAmount)}
                  </Text>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray/10">
                  <Text className="text-gray-500 text-xs sm:text-sm">Phương thức thanh toán:</Text>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#D82D8B] text-white flex items-center justify-center font-bold text-[9px]">
                      m
                    </div>
                    <Text strong className="text-xs sm:text-sm text-charcoal">Ví MoMo</Text>
                  </div>
                </div>

                {transId && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray/10">
                    <Text className="text-gray-500 text-xs sm:text-sm">Mã giao dịch MoMo:</Text>
                    <Text className="font-mono text-xs sm:text-sm text-gray-700">{transId}</Text>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Text className="text-gray-500 text-xs sm:text-sm">Trạng thái thanh toán:</Text>
                  <Tag color="success" className="rounded-full px-3 py-0.5 text-xs font-medium">
                    ✓ Đã thanh toán
                  </Tag>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingOutlined />}
                  onClick={() => navigate("/orders")}
                  className="bg-primary hover:!bg-[#a37676] border-primary h-12 rounded-xl font-medium px-8"
                >
                  Xem đơn hàng của tôi
                </Button>

                <Button
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={() => navigate("/products")}
                  className="h-12 rounded-xl font-medium px-8 border-gray/20 hover:border-primary text-charcoal"
                >
                  Tiếp tục mua sắm
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* FAILED / CANCELLED STATE */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500 mb-6">
                <CloseCircleFilled className="text-5xl sm:text-6xl text-red-500" />
              </div>

              <Title level={2} className="!font-serif !text-charcoal !m-0 !mb-2 !text-2xl sm:!text-3xl">
                Thanh toán chưa hoàn tất
              </Title>
              <Paragraph className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-6">
                {momoMessage || "Giao dịch thanh toán qua Ví MoMo không thành công hoặc đã bị hủy. Đừng lo lắng, nàng vẫn có thể kiểm tra lại đơn hàng hoặc chọn phương thức COD."}
              </Paragraph>

              {orderId && (
                <div className="bg-[#FAF3EC]/60 border border-[#BC8F8F]/20 rounded-2xl p-4 mb-8 text-sm">
                  <Text className="text-gray-500">Mã đơn hàng của nàng: </Text>
                  <Text strong className="font-mono text-charcoal">{orderId}</Text>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingOutlined />}
                  onClick={() => navigate("/orders")}
                  className="bg-primary hover:!bg-[#a37676] border-primary h-12 rounded-xl font-medium px-8"
                >
                  Kiểm tra đơn hàng
                </Button>

                <Button
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={() => navigate("/cart")}
                  className="h-12 rounded-xl font-medium px-8 border-gray/20 hover:border-primary text-charcoal"
                >
                  Quay lại giỏ hàng
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MomoReturnPage;

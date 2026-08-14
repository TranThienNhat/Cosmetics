import React from "react";
import { Button, Card, Typography } from "antd";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, Package, Home, ArrowRight, ShieldCheck, Truck } from "lucide-react";

const { Title, Paragraph, Text } = Typography;

const CheckoutSuccessPage: React.FC = () => {
  const location = useLocation();
  const order = location.state?.order; // Nhận toàn bộ object order nếu có
  const orderId = order?.id || location.state?.orderId;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        
        {/* THẺ THÔNG BÁO CHÍNH */}
        <Card className="border border-gray/10 shadow-sm rounded-2xl bg-white text-center overflow-hidden p-4 md:p-8">
          
          {/* Icon Success */}
          <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" strokeWidth={2} />
          </div>
          
          <Title level={2} className="!font-serif !text-charcoal !mb-4">
            Đặt hàng thành công!
          </Title>
          
          <Paragraph className="text-gray text-base max-w-md mx-auto leading-relaxed mb-8">
            Cảm ơn bạn đã lựa chọn Linh Cosmetics. Đơn hàng của bạn đã được hệ thống ghi nhận và đang trong quá trình chuẩn bị.
          </Paragraph>

          {/* Box Mã đơn hàng */}
          {orderId && (
            <div className="bg-primary/5 px-6 py-4 rounded-xl inline-flex flex-col items-center justify-center border border-primary/10 mb-8 min-w-[200px]">
              <Text className="text-gray text-xs uppercase tracking-widest mb-1">Mã đơn hàng</Text>
              <Text className="text-primary font-serif font-bold text-xl tracking-wider">#{orderId}</Text>
            </div>
          )}

          {/* Box Thông tin tóm tắt */}
          <div className="bg-background p-6 rounded-xl text-left border border-gray/10 mb-10">
            <h4 className="text-charcoal font-medium mb-4 flex items-center gap-2">
              <Package size={18} className="text-primary" /> Thông tin giao hàng
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <Text className="text-gray text-sm">Thời gian dự kiến</Text>
                <Text className="text-charcoal text-sm font-medium text-right">1 - 3 ngày làm việc</Text>
              </div>
              <div className="flex justify-between items-start gap-4">
                <Text className="text-gray text-sm">Thanh toán</Text>
                <Text className="text-charcoal text-sm font-medium text-right">Thanh toán khi nhận hàng (COD)</Text>
              </div>
              <div className="flex justify-between items-start gap-4">
                <Text className="text-gray text-sm">Hotline hỗ trợ</Text>
                <Text className="text-charcoal text-sm font-medium text-right">1900 1234 (8:00 - 22:00)</Text>
              </div>
            </div>
          </div>

          {/* Nhóm Nút hành động */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <Link to="/orders" className="w-full sm:w-auto">
              <Button
                type="primary"
                size="large"
                className="bg-primary border-primary hover:bg-primary/90 rounded-lg h-12 px-8 font-medium w-full"
              >
                Theo dõi đơn hàng
              </Button>
            </Link>

            <Link to="/" className="w-full sm:w-auto">
              <Button
                size="large"
                icon={<Home size={18} />}
                className="border-gray/20 text-charcoal hover:!border-primary hover:!text-primary rounded-lg h-12 px-8 w-full transition-colors bg-transparent"
              >
                Về trang chủ
              </Button>
            </Link>
          </div>

          <div className="mt-8">
            <Link to="/products" className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-all group">
              Tiếp tục mua sắm <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Card>

        {/* THẺ CAM KẾT DỊCH VỤ (Additional Info) */}
        <div className="mt-8">
          <Card className="border border-gray/10 shadow-sm rounded-2xl bg-white/50 backdrop-blur-sm p-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              
              <div className="p-4 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                  <Package size={22} />
                </div>
                <h4 className="text-charcoal font-medium mb-2">Đóng gói chuẩn mực</h4>
                <p className="text-gray text-xs leading-relaxed">Sản phẩm được bảo vệ kỹ lưỡng, giữ trọn vẻ đẹp khi đến tay bạn.</p>
              </div>

              <div className="p-4 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                  <ShieldCheck size={22} />
                </div>
                <h4 className="text-charcoal font-medium mb-2">Chính hãng 100%</h4>
                <p className="text-gray text-xs leading-relaxed">Cam kết nguồn gốc minh bạch cùng chất lượng nguyên bản.</p>
              </div>

              <div className="p-4 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                  <Truck size={22} />
                </div>
                <h4 className="text-charcoal font-medium mb-2">Đổi trả dễ dàng</h4>
                <p className="text-gray text-xs leading-relaxed">Hỗ trợ đổi trả nhanh chóng trong 7 ngày nếu có phát sinh lỗi.</p>
              </div>

            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
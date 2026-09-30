import React, { useEffect, useState } from "react";
import { Card, Typography, Spin, Empty, Button, Modal, Divider, Row, Col, Rate, Input, message, Popconfirm } from "antd";
import { Link, Navigate } from "react-router-dom";
import { 
  ShoppingOutlined, 
  RightOutlined, 
  ClockCircleOutlined, 
  EnvironmentOutlined, 
  PhoneOutlined, 
  InboxOutlined, 
  CreditCardOutlined, 
  CheckCircleOutlined, 
  CopyOutlined 
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import { getImageUrl, formatCurrency } from "../utils/helpers";

const { Title, Text } = Typography;

const OrdersPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    variant_id: 0,
    order_id: 0,
    name: "",
    image_url: "",
    rating: 5,
    comment: ""
  });

  useEffect(() => {
    if (isAuthenticated) loadOrders();
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/my-orders");
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Hàm sao chép mã đơn hàng tối ưu
   * Hoạt động trên cả HTTP, HTTPS và Mobile
   */
  const handleCopyCode = async (code: string) => {
    try {
      // 1. Thử dùng Clipboard API hiện đại
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        // 2. Fallback cho môi trường không bảo mật (HTTP) hoặc trình duyệt cũ
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      // Hiển thị thông báo thành công
      message.success({
        content: `Đã sao chép: ${code}`,
        icon: <CheckCircleOutlined style={{ fontSize: 16, color: "#10B981" }} />,
        duration: 2,
      });
    } catch (err) {
      message.error("Không thể sao chép mã.");
      console.error("Copy error:", err);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      setSubmitting(true);
      await api.put(`/orders/${orderId}`, { status: "cancelled" });
      message.success("Đã hủy đơn hàng thành công.");
      
      const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o);
      setOrders(updatedOrders);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: "cancelled" });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể hủy đơn hàng lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleOpenReview = (item: any, orderId: number) => {
    setReviewData({
      variant_id: item.variant_id,
      order_id: orderId,
      name: item.name,
      image_url: item.image_url,
      rating: 5,
      comment: ""
    });
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);
      await api.post("/reviews", {
        variant_id: reviewData.variant_id,
        order_id: reviewData.order_id,
        rating: reviewData.rating,
        comment: reviewData.comment || "Sản phẩm tuyệt vời!"
      });
      
      message.success("Cảm ơn bạn đã gửi đánh giá ✨");
      setIsReviewModalOpen(false);

      const updateReviewStatus = (items: any[]) => 
        items.map(item => item.variant_id === reviewData.variant_id ? { ...item, is_reviewed: true } : item);

      setOrders(prev => prev.map(o => o.id === reviewData.order_id ? { ...o, items: updateReviewStatus(o.items) } : o));
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, items: updateReviewStatus(selectedOrder.items) });

    } catch (error: any) {
      message.error(error.response?.data?.message || "Bạn đã đánh giá sản phẩm này rồi.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string; bg: string }> = {
      pending: { color: "text-yellow-600", bg: "bg-yellow-50", text: "Chờ xác nhận" },
      processing: { color: "text-blue-600", bg: "bg-blue-50", text: "Đang xử lý" },
      shipped: { color: "text-cyan-600", bg: "bg-cyan-50", text: "Đang giao hàng" },
      completed: { color: "text-green-600", bg: "bg-green-50", text: "Hoàn tất" },
      cancelled: { color: "text-red-600", bg: "bg-red-50", text: "Đã hủy" },
    };
    const s = config[status] || config.pending;
    return <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${s.bg} ${s.color} border-${s.color.split('-')[1]}-100`}>{s.text}</span>;
  };

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />;
  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Spin size="large" className="text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        
        <div className="text-center mb-12">
          <Title level={2} className="!font-serif !text-charcoal !mb-2">Đơn hàng của bạn</Title>
          <div className="w-12 h-1 bg-primary/30 mx-auto mb-4 rounded-full"></div>
          <Text className="text-gray italic text-base">Quản lý và theo dõi lịch sử mua sắm của bạn.</Text>
        </div>

        {orders.length === 0 ? (
          <Empty 
            description={<span className="text-gray text-base">Bạn chưa có đơn hàng nào</span>} 
            className="bg-white p-12 md:p-16 rounded-2xl shadow-sm border border-gray/10"
          >
            <Link to="/products">
              <Button type="primary" size="large" className="bg-primary border-primary rounded-lg px-10 h-12 font-medium hover:!bg-primary/90 transition-all mt-4">
                Mua sắm ngay
              </Button>
            </Link>
          </Empty>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card 
                key={order.id} 
                className="border border-gray/10 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group bg-white"
                bodyStyle={{ padding: '24px' }}
              >
                <div className="cursor-pointer" onClick={() => openDetail(order)}>
                  <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6 border-b border-gray/10 pb-4 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <ShoppingOutlined style={{ fontSize: 20 }} />
                        </div>
                        <div className="flex flex-col">
                            <div 
                              className="flex items-center gap-2 group/copy cursor-pointer w-fit" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleCopyCode(order.order_code); 
                              }}
                            >
                                <Text strong className="block text-charcoal text-base group-hover/copy:text-primary transition-colors">
                                    {order.order_code}
                                </Text>
                                <CopyOutlined style={{ fontSize: 13 }} className="text-gray/40 group-hover/copy:text-primary opacity-0 group-hover/copy:opacity-100 transition-all" />
                            </div>
                            <Text className="text-xs text-gray flex items-center gap-1 mt-1">
                                <ClockCircleOutlined style={{ fontSize: 13 }} /> {new Date(order.created_at).toLocaleDateString("vi-VN")}
                            </Text>
                        </div>
                    </div>
                    {getStatusTag(order.status)}
                  </div>

                  <div className="space-y-4">
                    {order.items.slice(0, 1).map((item: any) => (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray/5 flex-shrink-0 border border-gray/10 p-1">
                                <img src={getImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover rounded-md" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Text strong className="block text-sm text-charcoal truncate mb-1">{item.name}</Text>
                                <Text type="secondary" className="text-[11px] uppercase tracking-wider bg-background border border-gray/10 px-2 py-0.5 rounded-md inline-block mb-1">{item.variant_name}</Text>
                                <div className="mt-1"><Text className="text-xs text-gray">SL: {item.quantity}</Text></div>
                            </div>
                          </div>
                          <div className="text-right sm:text-right">
                            <Text className="font-medium text-base text-primary">{formatCurrency(Number(item.price) * item.quantity)}</Text>
                          </div>
                        </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Button type="text" className="text-primary text-sm p-0 flex items-center gap-1 font-medium hover:text-primary/80 transition-colors">
                          Xem chi tiết <RightOutlined style={{ fontSize: 13 }} />
                      </Button>

                      {(order.status === "pending" || order.status === "processing") && (
                          <Popconfirm
                              title="Xác nhận hủy đơn hàng này?"
                              onConfirm={(e) => { e?.stopPropagation(); handleCancelOrder(order.id); }}
                              onCancel={(e) => e?.stopPropagation()}
                              okText="Hủy đơn"
                              cancelText="Đóng"
                              okButtonProps={{ danger: true, loading: submitting }}
                          >
                              <Button 
                                type="text" 
                                danger 
                                className="text-sm font-medium p-0" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                  Hủy đơn
                              </Button>
                          </Popconfirm>
                      )}
                    </div>
                    <div className="text-right">
                      <Text className="text-gray text-[10px] uppercase tracking-widest block mb-1">Tổng thanh toán</Text>
                      <Text className="text-xl font-serif text-primary font-bold leading-none">{formatCurrency(Number(order.final_amount))}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={typeof window !== "undefined" && window.innerWidth < 768 ? "95%" : 750}
        centered
        closeIcon={null}
        styles={{ content: { borderRadius: "16px", padding: "0", overflow: "hidden" } }}
      >
        {selectedOrder && (
          <div>
            <div className="bg-background p-6 md:p-8 border-b border-gray/10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <InboxOutlined style={{ fontSize: 22, color: "#BC8F8F" }} />
                        <Title level={3} className="!m-0 !font-serif text-charcoal">Chi tiết đơn hàng</Title>
                    </div>
                    <div 
                      className="flex items-center gap-2 cursor-pointer group/modalcopy w-fit" 
                      onClick={() => handleCopyCode(selectedOrder.order_code)}
                    >
                        <Text type="secondary" className="text-xs uppercase tracking-widest font-medium text-gray group-hover/modalcopy:text-primary transition-colors">
                            {selectedOrder.order_code}
                        </Text>
                        <CopyOutlined style={{ fontSize: 12 }} className="text-gray/30 group-hover/modalcopy:text-primary transition-all" />
                    </div>
                </div>
                <div>{getStatusTag(selectedOrder.status)}</div>
            </div>

            <div className="p-6 md:p-8">
              <Row gutter={[24, 24]} className="mb-8">
                <Col xs={24} md={12}>
                    <div className="flex items-center gap-2 mb-3">
                        <EnvironmentOutlined style={{ fontSize: 16, color: "#9ca3af" }} />
                        <Text strong className="text-xs text-charcoal uppercase tracking-widest">Địa chỉ giao hàng</Text>
                    </div>
                    <div className="bg-background p-5 rounded-xl border border-gray/10 space-y-2 h-full">
                        <Text strong className="block text-charcoal text-sm">{selectedOrder.shipping_name}</Text>
                        <Text className="text-gray flex items-center gap-2 text-sm"><PhoneOutlined style={{ fontSize: 13 }} /> {selectedOrder.shipping_phone}</Text>
                        <Text className="block text-gray text-sm leading-relaxed">{selectedOrder.shipping_address}</Text>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div className="flex items-center gap-2 mb-3">
                        <CreditCardOutlined style={{ fontSize: 16, color: "#9ca3af" }} />
                        <Text strong className="text-xs text-charcoal uppercase tracking-widest">Thanh toán</Text>
                    </div>
                    <div className="bg-background p-5 rounded-xl border border-gray/10 h-full flex flex-col justify-center">
                        <Text strong className="block text-charcoal mb-1 text-sm">
                          {selectedOrder.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
                        </Text>
                        <Text type="secondary" className="block text-xs text-gray">
                          Ngày đặt: {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}
                        </Text>
                    </div>
                </Col>
              </Row>

              <Divider className="border-gray/10" />

              <div className="my-8 space-y-4">
                <Title level={5} className="!font-serif !mb-4 text-charcoal flex items-center gap-2">
                    <ShoppingOutlined style={{ fontSize: 18, color: "#BC8F8F" }} /> Sản phẩm đã mua
                </Title>
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-xl border border-gray/10">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray/5 flex-shrink-0 border border-gray/10">
                      <img src={getImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <Text strong className="block text-sm text-charcoal truncate mb-1">{item.name}</Text>
                      <span className="border border-gray/10 bg-background text-gray text-[10px] rounded-md px-2 py-0.5 uppercase font-medium inline-block mb-1">
                        {item.variant_name}
                      </span>
                      <Text type="secondary" className="text-xs block">SL: {item.quantity}</Text>
                    </div>
                    <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-3">
                        <Text className="font-medium text-charcoal text-base">{formatCurrency(Number(item.price) * item.quantity)}</Text>
                        {selectedOrder.status === 'completed' && (
                            item.is_reviewed ? (
                                <div className="flex items-center gap-1 text-[11px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                    <CheckCircleOutlined style={{ fontSize: 14 }} /> Đã đánh giá
                                </div>
                            ) : (
                                <Button 
                                    size="small" 
                                    className="border-primary text-primary text-xs rounded-lg px-4 hover:!bg-primary hover:!text-white transition-colors"
                                    onClick={() => handleOpenReview(item, selectedOrder.id)}
                                >
                                    Đánh giá
                                </Button>
                            )
                        )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-background p-6 md:p-8 rounded-2xl border border-gray/10">
                  <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray">
                        <Text>Tạm tính</Text>
                        <Text>{formatCurrency(Number(selectedOrder.total_amount))}</Text>
                      </div>
                      <div className="flex justify-between text-sm text-gray">
                        <Text>Phí vận chuyển</Text>
                        <Text>{formatCurrency(Number(selectedOrder.shipping_fee))}</Text>
                      </div>
                      {Number(selectedOrder.discount_amount) > 0 && (
                        <div className="flex justify-between text-sm text-primary font-medium">
                            <Text>Giảm giá</Text>
                            <Text>-{formatCurrency(Number(selectedOrder.discount_amount))}</Text>
                        </div>
                      )}
                      <Divider className="my-4 border-gray/10" />
                      <div className="flex justify-between items-end">
                        <Text strong className="text-base text-charcoal">Tổng cộng</Text>
                        <Text className="text-2xl font-serif text-primary font-bold">{formatCurrency(Number(selectedOrder.final_amount))}</Text>
                      </div>
                  </div>
              </div>

              {(selectedOrder.status === "pending" || selectedOrder.status === "processing") && (
                <div className="mt-8 pt-6 border-t border-gray/10">
                    <Popconfirm
                        title="Xác nhận hủy đơn hàng này?"
                        onConfirm={() => handleCancelOrder(selectedOrder.id)}
                        okText="Hủy đơn"
                        cancelText="Đóng"
                        okButtonProps={{ danger: true, loading: submitting }}
                    >
                        <Button block danger type="primary" size="large" className="h-12 rounded-lg font-medium text-base shadow-sm">
                            Xác nhận hủy đơn
                        </Button>
                    </Popconfirm>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL REVIEW */}
      <Modal 
        open={isReviewModalOpen} 
        onCancel={() => setIsReviewModalOpen(false)} 
        footer={null} 
        centered 
        width={typeof window !== "undefined" && window.innerWidth < 480 ? "95%" : 450} 
        styles={{ content: { borderRadius: "16px", padding: "32px" } }}
      >
        <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden mb-5 bg-gray/5 border border-gray/10 p-1">
                <img src={getImageUrl(reviewData.image_url)} className="w-full h-full object-cover rounded-md" alt="Product" />
            </div>
            <Title level={4} className="!font-serif !mb-1 text-charcoal">Đánh giá sản phẩm</Title>
            <Text className="text-xs block mb-6 text-gray line-clamp-1 px-4">{reviewData.name}</Text>
            
            <div className="mb-8">
                <Rate 
                  value={reviewData.rating} 
                  onChange={(val) => setReviewData({...reviewData, rating: val})} 
                  className="text-yellow-400 text-3xl" 
                />
            </div>

            <Input.TextArea 
              rows={4} 
              placeholder="Chia sẻ trải nghiệm của bạn..." 
              className="rounded-lg border-gray/20 p-4 mb-6 bg-background" 
              value={reviewData.comment} 
              onChange={(e) => setReviewData({...reviewData, comment: e.target.value})} 
            />

            <Button 
              type="primary" 
              block 
              size="large" 
              loading={submitting} 
              className="bg-primary border-primary h-12 rounded-lg font-medium" 
              onClick={handleSubmitReview}
            >
              Gửi đánh giá
            </Button>
        </div>
      </Modal>
    </div>
  );
};

export default OrdersPage;
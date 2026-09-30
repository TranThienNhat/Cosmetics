import React, { useState } from "react";
import { Typography, Row, Col, Button, Input, Form, Card, message } from "antd";
import { Link } from "react-router-dom";
import { 
  EnvironmentOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  MessageOutlined,
  SendOutlined
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = (values: ContactFormData) => {
    setLoading(true);
    console.log("Dữ liệu liên hệ:", values);
    
    // Giả lập gửi API
    setTimeout(() => {
      message.success("Cảm ơn bạn đã gửi lời nhắn, chúng tôi sẽ phản hồi sớm nhất nhé! ✨");
      setLoading(false);
      form.resetFields();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-4xl">
        <Card className="border-0 shadow-lg p-2 sm:p-6" bodyStyle={{ padding: "16px" }}>
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-10">
            <Title level={2} className="!text-charcoal !text-2xl sm:!text-3xl !mb-2 font-serif">
              Liên hệ với chúng tôi
            </Title>
            <Paragraph className="text-gray text-sm sm:text-base">
              Dù là một câu hỏi nhỏ hay một lời góp ý chân thành, chúng tôi luôn sẵn lòng lắng nghe bạn.
            </Paragraph>
          </div>

          <Row gutter={[{ xs: 24, sm: 32, md: 48 }, { xs: 24, sm: 32, md: 48 }]}>
            {/* CỘT TRÁI: THÔNG TIN LIÊN HỆ */}
            <Col xs={24} md={10}>
              <div className="space-y-6 sm:space-y-8 mt-2">
                <Title level={4} className="!text-charcoal !mb-4 sm:!mb-6 font-serif">
                  Thông tin kết nối
                </Title>
                
                {[
                  { 
                    icon: <EnvironmentOutlined style={{ fontSize: 18, color: "#BC8F8F" }} />, 
                    title: "Địa chỉ", 
                    detail: "54 Triều khúc, Quận Thanh Xuân, Hà Nội" 
                  },
                  { 
                    icon: <PhoneOutlined style={{ fontSize: 18, color: "#BC8F8F" }} />, 
                    title: "Điện thoại", 
                    detail: "0987 654 321" 
                  },
                  { 
                    icon: <MailOutlined style={{ fontSize: 18, color: "#BC8F8F" }} />, 
                    title: "Email", 
                    detail: "admin@Linhcosmetics.vn" 
                  },
                  { 
                    icon: <ClockCircleOutlined style={{ fontSize: 18, color: "#BC8F8F" }} />, 
                    title: "Giờ làm việc", 
                    detail: "Thứ 2 - Chủ Nhật (09:00 - 21:00)" 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <Text strong className="block text-charcoal text-sm mb-1">
                        {item.title}
                      </Text>
                      <Text className="text-gray text-sm leading-relaxed">
                        {item.detail}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </Col>

            {/* CỘT PHẢI: FORM LIÊN HỆ */}
            <Col xs={24} md={14}>
              <div className="bg-white/50 p-4 sm:p-6 rounded-2xl border border-gray/20">
                <Form 
                  form={form}
                  layout="vertical" 
                  onFinish={onFinish} 
                  size="large"
                  requiredMark={false}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="name" 
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập tên của bạn' }]}
                      >
                        <Input 
                          prefix={<UserOutlined style={{ fontSize: 16, color: "#9ca3af" }} />} 
                          placeholder="Nguyễn Văn A" 
                          className="rounded-lg" 
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="email" 
                        label="Email"
                        rules={[
                          { required: true, message: 'Vui lòng nhập email' },
                          { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                      >
                        <Input 
                          prefix={<MailOutlined style={{ fontSize: 16, color: "#9ca3af" }} />} 
                          placeholder="your@email.com" 
                          className="rounded-lg" 
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item 
                    name="subject" 
                    label="Chủ đề quan tâm"
                  >
                    <Input 
                      prefix={<MessageOutlined style={{ fontSize: 16, color: "#9ca3af" }} />} 
                      placeholder="Tư vấn, Đặt hàng, Góp ý..." 
                      className="rounded-lg" 
                    />
                  </Form.Item>

                  <Form.Item 
                    name="message" 
                    label="Lời nhắn"
                    rules={[{ required: true, message: 'Vui lòng để lại lời nhắn cho chúng tôi' }]}
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="Nhập nội dung tin nhắn của bạn tại đây..." 
                      className="rounded-lg p-3" 
                    />
                  </Form.Item>

                  <Form.Item className="mb-0 mt-6">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      icon={<SendOutlined />}
                      className="w-full bg-primary border-primary hover:bg-primary/90 rounded-lg h-12 text-base font-medium flex items-center justify-center gap-2"
                    >
                      Gửi tin nhắn
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Nút Back to Home */}
        <div className="text-center mt-8">
          <Link to="/" className="text-gray hover:text-primary text-sm transition-colors">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
import React, { useEffect } from "react";
import { Form, Input, Button, Typography, Card, Divider } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const { Title, Paragraph, Text } = Typography;

// 1. Tách các quy tắc xác thực ra ngoài để dễ quản lý
const validationRules = {
  name: [{ required: true, message: "Vui lòng nhập họ và tên" }, { min: 2, message: "Tối thiểu 2 ký tự" }],
  email: [{ required: true, message: "Vui lòng nhập email" }, { type: "email" as const, message: "Email không hợp lệ" }],
  phone: [{ pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" }],
  password: [{ required: true, message: "Vui lòng nhập mật khẩu" }, { min: 6, message: "Tối thiểu 6 ký tự" }],
};

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const onFinish = async (v: any) => {
    if (await register(v.name, v.email, v.password, v.phone)) navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 rounded-xl">
        <div className="text-center mb-6">
          <Title level={2} className="!mb-1 font-serif">Đăng ký</Title>
          <Paragraph type="secondary">Tạo tài khoản để bắt đầu mua sắm</Paragraph>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
          {/* Group Name & Email */}
          <Form.Item name="name" label="Họ và tên" rules={validationRules.name}>
            <Input prefix={<User size={18} className="text-gray-400" />} placeholder="Nguyễn Văn A" />
                      </Form.Item>

          <Form.Item name="email" label="Email" rules={validationRules.email}>
            <Input prefix={<Mail size={18} className="text-gray-400" />} placeholder="example@mail.com" />
                      </Form.Item>

          <Form.Item name="phone" label="Số điện thoại" rules={validationRules.phone}>
            <Input prefix={<Phone size={18} className="text-gray-400" />} placeholder="090..." />
                      </Form.Item>

          {/* Group Passwords */}
          <Form.Item name="password" label="Mật khẩu" rules={validationRules.password}>
            <Input.Password prefix={<Lock size={18} className="text-gray-400" />} placeholder="••••••••" />
                  </Form.Item>

                  <Form.Item
            name="confirm" label="Xác nhận mật khẩu" dependencies={['password']}
            rules={[{ required: true, message: 'Vui lòng xác nhận!' }, 
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Mật khẩu không khớp!'));
              },
            })]}
                  >
            <Input.Password prefix={<Lock size={18} className="text-gray-400" />} placeholder="••••••••" />
                  </Form.Item>

          <Button type="primary" htmlType="submit" loading={isLoading} block className="h-12 text-base font-semibold mt-2">
            Đăng ký
                  </Button>
                </Form>

        <div className="text-center mt-4 text-xs text-gray-500">
          Đăng ký nghĩa là bạn đồng ý với <Link to="/terms" className="text-primary">Điều khoản</Link> & <Link to="/privacy" className="text-primary">Bảo mật</Link>
                  </div>
                  
        <Divider plain><Text type="secondary" className="text-xs">Hoặc bạn đã có tài khoản?</Text></Divider>

        <Link to="/login">
          <Button block size="large" className="border-primary text-primary hover:bg-primary/5">Đăng nhập ngay</Button>
        </Link>
        
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-400 hover:text-primary flex items-center justify-center gap-1 text-sm">
            <ArrowLeft size={14} /> Quay về trang chủ
          </Link>
              </div>
            </Card>
    </div>
  );
};

export default RegisterPage;
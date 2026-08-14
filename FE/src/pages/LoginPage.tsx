import React, { useEffect } from "react";
import { Form, Input, Button, Typography, Card, Divider, message } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

const { Title, Paragraph } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, user } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated && user) {
      // If user is admin and no specific redirect path, go to admin panel
      if (user.role === "admin" && from === "/") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (values: LoginFormData) => {
    const success = await login(values.email, values.password);
    if (success) {
      // Check if user is admin and show admin panel option
      const userData = localStorage.getItem("user_data");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.role === "admin") {
          // Show success message with admin panel link
          message.success({
            content: (
              <div>
                Đăng nhập thành công!
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate("/admin")}
                  className="p-0 ml-2">
                  Vào Admin Panel
                </Button>
              </div>
            ),
            duration: 5,
          });

          // Auto redirect to admin if no specific path
          if (from === "/") {
            setTimeout(() => navigate("/admin", { replace: true }), 1500);
          } else {
            navigate(from, { replace: true });
          }
        } else {
          navigate(from, { replace: true });
        }
      } else {
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <div className="text-center mb-8">
            <Title level={2} className="!text-charcoal !mb-2 font-serif">
              Đăng nhập
            </Title>
            <Paragraph className="text-gray">
              Chào mừng bạn quay trở lại với Linh Cosmetics
            </Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
            requiredMark={false}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}>
              <Input
                prefix={<MailOutlined style={{ fontSize: 16, color: "#9ca3af" }} />}
                placeholder="your@email.com"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}>
              <Input.Password
                prefix={<LockOutlined style={{ fontSize: 16, color: "#9ca3af" }} />}
                placeholder="Nhập mật khẩu"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="w-full bg-primary border-primary rounded-lg h-12 text-base font-medium">
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <Divider className="my-6">
            <span className="text-gray text-sm">hoặc</span>
          </Divider>

          <div className="text-center">
            <Paragraph className="text-gray mb-2">Chưa có tài khoản?</Paragraph>
            <Link to="/register">
              <Button
                size="large"
                className="w-full border-primary text-primary hover:bg-primary hover:text-white rounded-lg h-12">
                Đăng ký ngay
              </Button>
            </Link>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-gray hover:text-primary text-sm">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

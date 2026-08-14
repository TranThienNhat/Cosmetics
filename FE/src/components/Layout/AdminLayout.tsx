import React, { useState } from "react";
import {
  Layout,
  Menu,
  Button,
  Typography,
  Dropdown,
  Space,
  Breadcrumb,
} from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  ShoppingOutlined,
  TagsOutlined,
  BranchesOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  GiftOutlined,
  FileTextOutlined,
  TruckOutlined,
  ImportOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // PHÂN QUYỀN MENU TRONG SIDEBAR
  const menuItems = [
    // --- 1. CHỈ ADMIN MỚI THẤY DASHBOARD & DỰ BÁO AI ---
    ...(user?.role === "admin"
      ? [
          {
            key: "/admin",
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Dashboard</Link>,
          },
          {
            key: "/admin/ai-forecast",
            icon: <RiseOutlined />,
            label: <Link to="/admin/ai-forecast">Dự báo & Phân tích AI</Link>,
          },
        ]
      : []),

    // --- 2. CÁC MENU CHUNG (Admin & Staff đều thấy) ---
    {
      key: "/admin/categories",
      icon: <TagsOutlined />,
      label: <Link to="/admin/categories">Danh mục</Link>,
    },
    {
      key: "/admin/orders",
      icon: <ShoppingCartOutlined />,
      label: <Link to="/admin/orders">Đơn hàng</Link>,
    },
    {
      key: "/admin/blogs",
      icon: <FileTextOutlined />,
      label: <Link to="/admin/blogs">Bài viết Blog</Link>,
    },
    {
      key: "/admin/purchases",
      icon: <ImportOutlined />,
      label: <Link to="/admin/purchases">Nhập hàng kho</Link>,
    },

    // --- 3. CÁC MENU RIÊNG KHÁC (Chỉ Admin mới thấy) ---
    ...(user?.role === "admin"
      ? [
          {
            key: "/admin/products",
            icon: <ShoppingOutlined />,
            label: <Link to="/admin/products">Sản phẩm</Link>,
          },
          {
            key: "/admin/brands",
            icon: <BranchesOutlined />,
            label: <Link to="/admin/brands">Thương hiệu</Link>,
          },
          {
            key: "/admin/suppliers",
            icon: <TruckOutlined />,
            label: <Link to="/admin/suppliers">Nhà cung cấp</Link>,
          },
          {
            key: "/admin/coupons",
            icon: <GiftOutlined />,
            label: <Link to="/admin/coupons">Mã giảm giá</Link>,
          },
          {
            key: "/admin/users",
            icon: <UserOutlined />,
            label: <Link to="/admin/users">Người dùng</Link>,
          },
        ]
      : []),
  ];

  const userMenuItems = [
    { key: "profile", label: "Thông tin cá nhân", icon: <UserOutlined /> },
    {
      key: "user-site",
      label: <Link to="/">Về trang người dùng</Link>,
      icon: <HomeOutlined />,
    },
    { type: "divider" as const },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: logout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white shadow-lg fixed left-0 top-0 bottom-0 z-50"
        width={200} // Nới rộng thêm một chút cho đẹp chữ
        style={{ height: "100vh", overflow: "auto" }}
      >
        <div className="p-4 border-b border-gray-100">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#BC8F8F] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            {!collapsed && (
              <Title level={5} className="!mb-0 !text-[#2D2D2D] truncate">
                {user?.role === "admin" ? "Linh Admin" : "Linh Staff"}
              </Title>
            )}
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-none mt-2"
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: "all 0.2s" }}>
        <Header className="bg-white/80 backdrop-blur-md shadow-sm px-6 flex items-center justify-between sticky top-0 z-40">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-600"
          />
          <Space size="large">
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
              <Button type="text" className="flex items-center gap-2 font-medium">
                <UserOutlined /> {user?.name}
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content className="p-8 bg-[#FDFBF7]">
          <div className="mb-6">
            <Breadcrumb>
              <Breadcrumb.Item>
                <HomeOutlined />
              </Breadcrumb.Item>
              <Breadcrumb.Item>Admin Panel</Breadcrumb.Item>
              <Breadcrumb.Item className="capitalize">
                {location.pathname.split("/").pop()?.replace("-", " ")}
              </Breadcrumb.Item>
            </Breadcrumb>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm min-h-[80vh]">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
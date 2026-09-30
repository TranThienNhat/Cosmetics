import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Button,
  Typography,
  Dropdown,
  Space,
  Breadcrumb,
  Drawer,
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
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // PHÂN QUYỀN MENU TRONG SIDEBAR
  const menuItems = [
    // --- 1. CHỈ ADMIN MỚI THẤY DASHBOARD & DỰ BÁO AI ---
    ...(user?.role === "admin"
      ? [
          {
            key: "/admin",
            icon: <DashboardOutlined />,
            label: <Link to="/admin" onClick={() => isMobile && setMobileDrawerOpen(false)}>Dashboard</Link>,
          },
          {
            key: "/admin/ai-forecast",
            icon: <RiseOutlined />,
            label: <Link to="/admin/ai-forecast" onClick={() => isMobile && setMobileDrawerOpen(false)}>Dự báo & Phân tích AI</Link>,
          },
        ]
      : []),

    // --- 2. CÁC MENU CHUNG (Admin & Staff đều thấy) ---
    {
      key: "/admin/categories",
      icon: <TagsOutlined />,
      label: <Link to="/admin/categories" onClick={() => isMobile && setMobileDrawerOpen(false)}>Danh mục</Link>,
    },
    {
      key: "/admin/orders",
      icon: <ShoppingCartOutlined />,
      label: <Link to="/admin/orders" onClick={() => isMobile && setMobileDrawerOpen(false)}>Đơn hàng</Link>,
    },
    {
      key: "/admin/blogs",
      icon: <FileTextOutlined />,
      label: <Link to="/admin/blogs" onClick={() => isMobile && setMobileDrawerOpen(false)}>Bài viết Blog</Link>,
    },
    {
      key: "/admin/purchases",
      icon: <ImportOutlined />,
      label: <Link to="/admin/purchases" onClick={() => isMobile && setMobileDrawerOpen(false)}>Nhập hàng kho</Link>,
    },

    // --- 3. CÁC MENU RIÊNG KHÁC (Chỉ Admin mới thấy) ---
    ...(user?.role === "admin"
      ? [
          {
            key: "/admin/products",
            icon: <ShoppingOutlined />,
            label: <Link to="/admin/products" onClick={() => isMobile && setMobileDrawerOpen(false)}>Sản phẩm</Link>,
          },
          {
            key: "/admin/brands",
            icon: <BranchesOutlined />,
            label: <Link to="/admin/brands" onClick={() => isMobile && setMobileDrawerOpen(false)}>Thương hiệu</Link>,
          },
          {
            key: "/admin/suppliers",
            icon: <TruckOutlined />,
            label: <Link to="/admin/suppliers" onClick={() => isMobile && setMobileDrawerOpen(false)}>Nhà cung cấp</Link>,
          },
          {
            key: "/admin/coupons",
            icon: <GiftOutlined />,
            label: <Link to="/admin/coupons" onClick={() => isMobile && setMobileDrawerOpen(false)}>Mã giảm giá</Link>,
          },
          {
            key: "/admin/users",
            icon: <UserOutlined />,
            label: <Link to="/admin/users" onClick={() => isMobile && setMobileDrawerOpen(false)}>Người dùng</Link>,
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#BC8F8F] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          {(!collapsed || isMobile) && (
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
        className="border-none mt-2 flex-1"
      />
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {/* Mobile Drawer Sidebar */}
      {isMobile ? (
        <Drawer
          placement="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          width={240}
          closable={false}
          bodyStyle={{ padding: 0 }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        /* Desktop Fixed Sider */
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="bg-white shadow-lg fixed left-0 top-0 bottom-0 z-50"
          width={200}
          style={{ height: "100vh", overflow: "auto" }}
        >
          {sidebarContent}
        </Sider>
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 200,
          transition: "all 0.2s",
          minWidth: 0,
        }}
      >
        <Header className="bg-white/80 backdrop-blur-md shadow-sm px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 h-16">
          <div className="flex items-center gap-3">
            <Button
              type="text"
              icon={
                isMobile ? (
                  <MenuUnfoldOutlined style={{ fontSize: 18 }} />
                ) : collapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: 18 }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 18 }} />
                )
              }
              onClick={() => {
                if (isMobile) {
                  setMobileDrawerOpen(!mobileDrawerOpen);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="text-gray-600 p-1 flex items-center justify-center"
              aria-label="Toggle menu"
            />
            {isMobile && (
              <span className="font-semibold text-charcoal text-sm truncate">
                {user?.role === "admin" ? "Linh Admin" : "Linh Staff"}
              </span>
            )}
          </div>
          <Space size="middle">
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
              <Button type="text" className="flex items-center gap-2 font-medium px-2">
                <UserOutlined /> <span className="hidden sm:inline">{user?.name}</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content className="p-3 sm:p-6 md:p-8 bg-[#FDFBF7]">
          <div className="mb-4 sm:mb-6">
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
          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm min-h-[80vh] overflow-x-auto">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
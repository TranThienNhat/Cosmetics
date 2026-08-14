import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { antdTheme } from "./config/theme";
import MainLayout from "./components/Layout/MainLayout";
import AdminLayout from "./components/Layout/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import OrdersPage from "./pages/OrdersPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import BrandsPageProduct from "./pages/BrandsPage";
import BlogListPage from "./pages/BlogListPage";
import BlogDetailPage from "./pages/BlogDetailPage";

// Admin Pages
import DashboardPage from "./pages/admin/DashboardPage";
import AdminProductsPage from "./pages/admin/ProductsPage";
import ProductFormPage from "./pages/admin/ProductFormPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import BrandsPage from "./pages/admin/BrandsPage";
import AdminOrdersPage from "./pages/admin/OrdersPage";
import UsersPage from "./pages/admin/UsersPage";
import CouponManagement from "./pages/admin/CouponManagement";
import BlogAdmin from "./pages/admin/BlogAdmin";
import SuppliersPage from "./pages/admin/SuppliersPage";
import PurchaseListPage from "./pages/admin/PurchaseListPage";
import PurchaseReceiptFormPage from "./pages/admin/PurchaseReceiptFormPage";
import AiForecastPage from "./pages/admin/AiForecastPage";

import "./index.css";

// Tự động cuộn lên đầu trang khi chuyển Route
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

// Component xử lý trang mặc định khi vào /admin
const AdminIndexRedirect: React.FC = () => {
  const { user } = useAuth();
  
  // Nếu là nhân viên -> Đẩy về trang Đơn hàng đầu tiên
  if (user?.role === "staff") {
    return <Navigate to="/admin/orders" replace />;
  }
  
  // Nếu là admin -> Cho xem Dashboard
  return <DashboardPage />;
};

const App: React.FC = () => {
  return (
    <ConfigProvider theme={antdTheme}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* === AUTH ROUTES === */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

              {/* === ADMIN & STAFF ROUTES === */}
              <Route
                path="/admin/*"
                element={
                  // Cả Admin và Staff đều được vào layout quản trị
                  <ProtectedRoute allowedRoles={["admin", "staff"]}>
                    <AdminLayout>
                      <Routes>
                        {/* TRANG ĐẦU TIÊN TỰ ĐỘNG CHUYỂN HƯỚNG THEO ROLE */}
                        <Route path="/" element={<AdminIndexRedirect />} />

                        {/* QUYỀN CHUNG: ADMIN & STAFF ĐỀU VÀO ĐƯỢC */}
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/orders" element={<AdminOrdersPage />} />
                        <Route path="/blogs" element={<BlogAdmin />} />
                        <Route path="/purchases" element={<PurchaseListPage />} />
                        <Route path="/purchase/create" element={<PurchaseReceiptFormPage />} />
                        <Route path="/purchase/edit/:id" element={<PurchaseReceiptFormPage />} />

                        {/* QUYỀN RIÊNG: CHỈ ADMIN MỚI ĐƯỢC VÀO */}
                        <Route
                          path="/ai-forecast"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AiForecastPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/products"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminProductsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/products/create"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <ProductFormPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/products/:id/edit"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <ProductFormPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/brands"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <BrandsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/users"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <UsersPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/coupons"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <CouponManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/suppliers"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <SuppliersPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* 404 Admin */}
                        <Route
                          path="*"
                          element={
                            <div className="flex justify-center items-center h-full text-xl text-gray-500">
                              Trang quản trị không tồn tại hoặc bạn không có quyền truy cập
                            </div>
                          }
                        />
                      </Routes>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* === MAIN ROUTES (Khách & Người dùng thường) === */}
              <Route
                path="/*"
                element={
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/brands" element={<BrandsPageProduct />} />
                      <Route path="/blogs" element={<BlogListPage />} />
                      <Route path="/blogs/:id" element={<BlogDetailPage />} />

                      {/* 404 Main */}
                      <Route
                        path="*"
                        element={
                          <div className="min-h-[60vh] bg-background flex items-center justify-center">
                            <div className="text-center">
                              <h1 className="text-4xl font-bold text-charcoal mb-4">
                                404
                              </h1>
                              <p className="text-gray mb-6">
                                Trang không tồn tại
                              </p>
                              <a
                                href="/"
                                className="text-primary hover:text-primary/80 font-medium"
                              >
                                Về trang chủ
                              </a>
                            </div>
                          </div>
                        }
                      />
                    </Routes>
                  </MainLayout>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
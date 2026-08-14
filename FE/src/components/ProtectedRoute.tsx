import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spin, message } from "antd";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const RedirectWithMessage: React.FC<{ to: string; msg: string }> = ({ to, msg }) => {
  useEffect(() => {
    message.error(msg);
  }, [msg]);

  return <Navigate to={to} replace />;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const [isTokenExpiring, setIsTokenExpiring] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      setIsTokenExpiring(true);
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Nếu bỗng dưng mất quyền đăng nhập
  if (!isAuthenticated) {
    // Nếu nguyên nhân mất quyền là do vừa hết hạn Token, chặn đứng việc chuyển hướng của React Router
    if (isTokenExpiring) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" tip="Phiên đăng nhập hết hạn. Đang xử lý..." />
        </div>
      );
    }

    // Nếu chưa đăng nhập ngay từ đầu thì cho đá về login bình thường
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    if (user.role === "staff") {
      return <Navigate to="/admin/orders" replace />;
    }

    const redirectPath = "/"; 
    
    return (
      <RedirectWithMessage 
        to={redirectPath} 
        msg="Bạn không có quyền truy cập trang này!" 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
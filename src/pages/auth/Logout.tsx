import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Spin } from "antd";

const Logout = () => {
  const { logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const performLogout = async () => {
      if (isAuthenticated) {
        await logout();
      }
    };

    performLogout();
  }, [logout, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spin size="large" tip="Logging out..." />
    </div>
  );
};

export default Logout;

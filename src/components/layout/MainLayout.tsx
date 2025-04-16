import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";

const MainLayout = () => {
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Sidebar />

      <main className="flex-grow container mx-auto px-4 py-6 mt-24">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;

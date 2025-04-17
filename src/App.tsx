import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme, App as AntApp } from "antd";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

// Layouts
import MainLayout from "./components/layout/MainLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Logout from "./pages/auth/Logout";

// Protected Pages
import Profile from "./pages/profile/Profile";
import Packages from "./pages/packages/Packages";
import MyPackages from "./pages/packages/MyPackages";
import Wallet from "./pages/wallet/Wallet";
import Transactions from "./pages/transactions/Transactions";
import TradingView from "./pages/trading-view/TradingView";
import TradingViewSymbol from "./pages/trading-view/TradingViewSymbol";

// Shared Components
import ProtectedRoute from "./components/shared/ProtectedRoute";
import TokenExpirationChecker from "./components/TokenExpirationChecker";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#1677ff",
            borderRadius: 6,
          },
        }}
      >
        <AntApp>
          <TokenExpirationChecker />
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/logout" element={<Logout />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Packages />} />
                  <Route path="/trading-view" element={<TradingView />} />
                  <Route path="/trading-view/:symbol" element={<TradingViewSymbol />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/my-packages" element={<MyPackages />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Catch all - redirect to packages */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;

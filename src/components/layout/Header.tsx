import { Link, useLocation } from "react-router-dom";
import { Dropdown, Avatar, Button, Badge, Menu, Tooltip } from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  WalletOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  HistoryOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import { useWalletStore } from "../../store/walletStore";
import { useEffect, useState } from "react";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname.split("/")[1] || "home";

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
    }
  }, [isAuthenticated, fetchWallet]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <Link to="/profile" className="no-underline">
          Profile
        </Link>
      ),
      icon: <UserOutlined />,
    },
    {
      key: "settings",
      label: (
        <Link to="/profile/settings" className="no-underline">
          Settings
        </Link>
      ),
      icon: <SettingOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: (
        <a onClick={handleLogout} className="no-underline">
          Logout
        </a>
      ),
      icon: <LogoutOutlined />,
    },
  ];

  const navItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: "Home",
      path: "/",
    },
    {
      key: "packages",
      icon: <AppstoreOutlined />,
      label: "Packages",
      path: "/packages",
    },
    {
      key: "my-packages",
      icon: <ShoppingOutlined />,
      label: "My Packages",
      path: "/my-packages",
    },
    {
      key: "wallet",
      icon: <WalletOutlined />,
      label: "Wallet",
      path: "/wallet",
    },
    {
      key: "transactions",
      icon: <HistoryOutlined />,
      label: "Transactions",
      path: "/transactions",
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-white/95 py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            to="/"
            className="text-xl font-bold text-blue-600 flex items-center no-underline"
          >
            <span className="bg-blue-600 text-white p-2 rounded-lg mr-2 hidden sm:flex">
              TA
            </span>
            <span className="transition-all duration-300">Trade App</span>
          </Link>

          {isAuthenticated && (
            <nav className="ml-6 lg:ml-10 hidden md:flex">
              <div className="flex items-center">
                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`mx-1 lg:mx-2 px-3 py-2 flex items-center rounded-md transition-all no-underline ${
                      currentPath === item.key
                        ? "text-blue-600 bg-blue-50 font-medium"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {isAuthenticated ? (
            <>
              {wallet && (
                <Tooltip title="Your wallet balance">
                  <Link
                    to="/wallet"
                    className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-all border border-blue-100 no-underline"
                  >
                    <WalletOutlined />
                    <span className="font-semibold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(wallet.balance)}
                    </span>
                  </Link>
                </Tooltip>
              )}

              <Tooltip title="Notifications">
                <Badge count={3} size="small">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<BellOutlined />}
                    className="flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                  />
                </Badge>
              </Tooltip>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <a className="flex items-center space-x-2 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-all no-underline">
                  <Avatar
                    icon={<UserOutlined />}
                    size="default"
                    className="bg-blue-500"
                  />
                  <span className="hidden md:inline font-medium text-gray-700">
                    {user?.name || "User"}
                  </span>
                  <DownOutlined className="text-xs text-gray-500" />
                </a>
              </Dropdown>
            </>
          ) : (
            <div className="space-x-2">
              <Link to="/login" className="no-underline">
                <Button
                  type="text"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Login
                </Button>
              </Link>
              <Link to="/register" className="no-underline">
                <Button
                  type="primary"
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

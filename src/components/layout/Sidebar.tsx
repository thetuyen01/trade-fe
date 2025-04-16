import { Link } from "react-router-dom";
import { Drawer, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  AppstoreOutlined,
  ShoppingOutlined,
  WalletOutlined,
  HistoryOutlined,
  UserOutlined,
  MenuOutlined,
  HomeOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useWalletStore } from "../../store/walletStore";

const Sidebar = () => {
  const [visible, setVisible] = useState(false);
  const { isAuthenticated, logout, user } = useAuthStore();
  const { wallet } = useWalletStore();
  const location = useLocation();

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const handleLogout = async () => {
    await logout();
    setVisible(false);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: (
        <Link to="/" className="no-underline">
          Home
        </Link>
      ),
    },
    {
      key: "packages",
      icon: <AppstoreOutlined />,
      label: (
        <Link to="/packages" className="no-underline">
          Packages
        </Link>
      ),
    },
    {
      key: "my-packages",
      icon: <ShoppingOutlined />,
      label: (
        <Link to="/my-packages" className="no-underline">
          My Packages
        </Link>
      ),
    },
    {
      key: "wallet",
      icon: <WalletOutlined />,
      label: (
        <Link to="/wallet" className="no-underline">
          Wallet
        </Link>
      ),
    },
    {
      key: "transactions",
      icon: <HistoryOutlined />,
      label: (
        <Link to="/transactions" className="no-underline">
          Transactions
        </Link>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: (
        <Link to="/profile" className="no-underline">
          Profile
        </Link>
      ),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: (
        <Link to="/profile/settings" className="no-underline">
          Settings
        </Link>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: (
        <a onClick={handleLogout} className="no-underline">
          Logout
        </a>
      ),
      danger: true,
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  const currentPath = location.pathname.split("/")[1] || "home";

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-blue-600 text-white shadow-xl md:hidden flex items-center justify-center"
        onClick={showDrawer}
        aria-label="Open menu"
      >
        <MenuOutlined className="text-lg" />
      </button>

      <Drawer
        title={
          <div className="flex items-center">
            <div className="bg-blue-600 text-white p-2 rounded-lg mr-2 flex items-center justify-center">
              TA
            </div>
            <div>
              <div className="font-bold">Trade App</div>
              {user && <div className="text-sm text-gray-500">{user.name}</div>}
            </div>
          </div>
        }
        placement="left"
        onClose={onClose}
        open={visible}
        width={280}
        headerStyle={{ padding: "12px 16px" }}
        bodyStyle={{ padding: 0 }}
        footer={
          wallet && (
            <div className="p-4 border-t">
              <div className="text-sm text-gray-500 mb-1">Wallet Balance</div>
              <div className="text-blue-600 font-bold text-lg">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(wallet.balance)}
              </div>
            </div>
          )
        }
      >
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems}
          className="border-0"
        />
      </Drawer>
    </>
  );
};

export default Sidebar;

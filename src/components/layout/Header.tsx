import { Link, useLocation } from "react-router-dom";
import { Dropdown, Avatar, Button, Badge, Tooltip, List, Popover } from "antd";
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
  LineChartOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import { useWalletStore } from "../../store/walletStore";
import { useEffect, useState } from "react";
import { notificationService, Notification } from "../../services/notification";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { wallet, fetchWallet, startPolling, stopPolling } = useWalletStore();
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname.split("/")[1] || "home";

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getUserNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      // Update the local state to reflect the change immediately
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      fetchUnreadCount(); // Update the unread count
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Update the local state to reflect the change immediately
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
      setUnreadCount(0); // Reset unread count to zero
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchWallet();
      // Only fetch notifications when the dropdown is first opened
      // or when authentication state changes
      fetchUnreadCount();
      startPolling();

      // Poll for unread count only, not full notifications (for performance)
      const notificationInterval = setInterval(() => {
        fetchUnreadCount();
        fetchNotifications();
      }, 5000); // 5 seconds

      return () => {
        stopPolling();
        clearInterval(notificationInterval);
      };
    }
  }, [isAuthenticated, fetchWallet, startPolling, stopPolling]);

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
    stopPolling();
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
      key: "trading-view",
      icon: <LineChartOutlined />,
      label: "Charts",
      path: "/trading-view",
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

  const notificationContent = (
    <div className="w-80 max-h-96">
      <div className="flex justify-between items-center mb-2 pb-2 border-b">
        <h3 className="text-base font-medium m-0">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            onClick={markAllAsRead}
            icon={<CheckOutlined />}
          >
            Mark all as read
          </Button>
        )}
      </div>
      {notifications.length > 0 ? (
        <List
          className="max-h-72 overflow-y-auto"
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                !item.isRead ? "bg-blue-50" : ""
              }`}
              onClick={() => markAsRead(item.id)}
            >
              <List.Item.Meta
                title={
                  <span className={!item.isRead ? "font-medium" : ""}>
                    {item.title}
                  </span>
                }
                description={
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm mb-0 line-clamp-2">{item.content}</p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div className="py-8 text-center text-gray-500">No notifications</div>
      )}
      <div className="mt-2 pt-2 border-t text-center">
        <Link
          to="/notifications"
          className="text-blue-600 text-sm no-underline"
          onClick={() => setNotificationVisible(false)}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );

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
            <span className="transition-all duration-300">AI Bot Trade</span>
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

              <Popover
                content={notificationContent}
                title={null}
                trigger="click"
                open={notificationVisible}
                onOpenChange={(visible) => {
                  setNotificationVisible(visible);
                  if (visible) {
                    // Fetch notifications only when the popover is opened
                    fetchNotifications();
                  }
                }}
                placement="bottomRight"
                overlayClassName="notification-popover"
              >
                <Tooltip title="Notifications">
                  <Badge count={unreadCount} size="small">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<BellOutlined />}
                      className="flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                    />
                  </Badge>
                </Tooltip>
              </Popover>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <a className="flex items-center space-x-2 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-all no-underline">
                  <Avatar
                    icon={<UserOutlined />}
                    size="default"
                    className="bg-blue-500"
                  />
                  <span className="hidden md:inline font-medium text-gray-700">
                    {user?.fullName || "User"}
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

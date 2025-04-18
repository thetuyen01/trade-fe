import { useState, useEffect } from "react";
import { App, Tabs } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { packagesService, UserPackage } from "../../services/packages";
import {
  TradingAccount,
  tradingAccountService,
} from "../../services/tradingAccount";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import { useLocation, useNavigate } from "react-router-dom";
import PackagesList, { isActivePackage } from "./components/PackagesList";
import TradingAccountsList from "./components/TradingAccountsList";
import PackageConnectionModal from "./components/PackageConnectionModal";

const { TabPane } = Tabs;

const MyPackages = () => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<UserPackage | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountData, setAccountData] = useState<
    Record<string, TradingAccount | null>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { modal, notification } = App.useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy userPackageId từ query params nếu có
  const queryParams = new URLSearchParams(location.search);
  const connectPackageId = queryParams.get("connect");
  const isNewPurchase = queryParams.get("newPurchase") === "true";

  // Kiểm tra responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    data: userPackages,
    isLoading: isPackagesLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userPackages"],
    queryFn: () => packagesService.getUserPackages(),
  });

  useEffect(() => {
    if (userPackages) {
      loadAccountData(userPackages);
    }
  }, [userPackages]);

  // Sửa lại useEffect để không tự động mở modal khi load trang
  useEffect(() => {
    if (!isLoading && isFirstLoad && userPackages && userPackages.length > 0) {
      // Đánh dấu đã load lần đầu
      setIsFirstLoad(false);

      // Chỉ mở modal khi có query param connect hoặc newPurchase
      if (connectPackageId || isNewPurchase) {
        let packageToConnect = null;

        // Trường hợp có query param connect
        if (connectPackageId) {
          packageToConnect = userPackages.find(
            (pkg) => pkg.id === connectPackageId
          );
        }
        // Trường hợp vừa mua gói mới
        else if (isNewPurchase) {
          // Sắp xếp theo thời gian mua mới nhất
          const sortedPackages = [...userPackages].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          packageToConnect = sortedPackages[0];
        }

        if (packageToConnect && isActivePackage(packageToConnect)) {
          handleConnectAccount(packageToConnect);

          // Xóa query params sau khi đã xử lý
          navigate("/packages", { replace: true });
        }
      }
    }
  }, [
    isLoading,
    userPackages,
    accountData,
    isFirstLoad,
    connectPackageId,
    isNewPurchase,
    navigate,
  ]);

  const loadAccountData = async (packages: UserPackage[]) => {
    setIsLoading(true);
    try {
      const accountDataMap: Record<string, TradingAccount | null> = {};

      // Lấy tất cả tài khoản MT5 của user
      const accounts = await tradingAccountService.getUserAccounts();

      // Debug: Log account data to see what we're getting
      console.log("MT5 Accounts loaded:", accounts);

      // Create a new array with updated packages that include mt5Account
      const updatedPackages = [...packages];

      packages
        .filter((pkg) => isActivePackage(pkg))
        .forEach((pkg) => {
          // Tìm tài khoản phù hợp với packageId
          const account = accounts.find((acc) => acc.userPackageId === pkg.id);
          accountDataMap[pkg.id] = account || null;

          // Find the package in the updated array and add the mt5Account property
          const packageToUpdate = updatedPackages.find((p) => p.id === pkg.id);
          if (packageToUpdate && account) {
            packageToUpdate.mt5Account = account;
          }
        });

      setAccountData(accountDataMap);

      // If we need to update the packages list with the account data
      // This step is optional as we're already using accountData separately
    } catch (error) {
      console.error("Error loading account data:", error);
      notification.error({
        message: "Failed to load account data",
        description: "Please refresh the page and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (packageId: string) => {
    modal.confirm({
      title: "Are you sure you want to cancel this package?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, Cancel",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        setCancellingId(packageId);
        try {
          const response = await packagesService.cancelPackage(packageId);
          if (response.success) {
            notification.success({
              message: "Package cancelled successfully!",
            });
            refetch();
          } else {
            notification.error({
              message: "Failed to cancel package",
            });
          }
        } catch {
          notification.error({
            message: "Failed to cancel package",
          });
        } finally {
          setCancellingId(null);
        }
      },
    });
  };

  const handleConnectAccount = (pkg: UserPackage) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const handleAccountConnected = (account: TradingAccount) => {
    // Update accountData state
    setAccountData((prev) => ({
      ...prev,
      [account.userPackageId]: account,
    }));

    // Update the package object if we have userPackages
    if (userPackages) {
      // Find and update the package with the mt5Account property
      const updatedPackages = userPackages.map((pkg) => {
        if (pkg.id === account.userPackageId) {
          return {
            ...pkg,
            mt5Account: account,
          };
        }
        return pkg;
      });

      // No need to set state here as userPackages is from React Query
      // This is just to show the concept - in practice you might need to
      // update the data in React Query cache if needed
    }

    setIsModalOpen(false);
    notification.success({
      message: "Trading account connected successfully!",
    });
  };

  const handleDisconnect = (packageId: string) => {
    // Tìm accountId từ accountData
    const account = accountData[packageId];
    if (account) {
      tradingAccountService
        .disconnectAccount(account.id.toString())
        .then((response) => {
          if (response.success) {
            setAccountData((prev) => ({
              ...prev,
              [packageId]: null,
            }));
            notification.success({
              message: "Account disconnected successfully",
            });
          } else {
            notification.error({
              message: "Failed to disconnect account",
            });
          }
        })
        .catch((error) => {
          console.error("Error disconnecting account:", error);
          notification.error({
            message: "Failed to disconnect account",
          });
        });
    }
  };

  if (isPackagesLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load your packages"
        description="Please try again later or contact support if the problem persists."
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Packages</h1>
        <p className="text-gray-600">Manage your purchased packages</p>
      </div>

      <Tabs defaultActiveKey="packages" className="mb-6">
        <TabPane tab="Active Packages" key="packages">
          <PackagesList
            userPackages={userPackages}
            isLoading={isLoading}
            isMobile={isMobile}
            accountData={accountData}
            cancellingId={cancellingId}
            handleCancel={handleCancel}
            handleConnectAccount={handleConnectAccount}
          />
        </TabPane>
        <TabPane tab="Trading Accounts" key="accounts">
          <TradingAccountsList
            userPackages={userPackages}
            accountData={accountData}
            isMobile={isMobile}
            handleDisconnect={handleDisconnect}
          />
        </TabPane>
      </Tabs>

      <PackageConnectionModal
        isModalOpen={isModalOpen}
        selectedPackage={selectedPackage}
        accountData={accountData}
        isMobile={isMobile}
        onCancel={() => setIsModalOpen(false)}
        onDisconnect={handleDisconnect}
        onSuccess={handleAccountConnected}
      />
    </div>
  );
};

export default MyPackages;

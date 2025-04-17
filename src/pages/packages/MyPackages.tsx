import { useState, useEffect } from "react";
import {
  Table,
  Button,
  App,
  Tabs,
  Card,
  Modal,
  Collapse,
  Tag,
  Space,
} from "antd";
import {
  ExclamationCircleOutlined,
  RocketOutlined,
  ApiOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { packagesService, UserPackage } from "../../services/packages";
import {
  TradingAccount,
  tradingAccountService,
} from "../../services/tradingAccount";
import AccountConnectionForm from "../../components/packages/AccountConnectionForm";
import AccountConnectionInfo from "../../components/packages/AccountConnectionInfo";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import { useLocation } from "react-router-dom";
import type { TableColumnType } from "antd";

const { TabPane } = Tabs;
const { Panel } = Collapse;

// Hàm kiểm tra gói có đang active không
const isActivePackage = (pkg: UserPackage): boolean => {
  const now = new Date();
  const startDate = new Date(pkg.startDate);
  const endDate = new Date(pkg.endDate);
  return now >= startDate && now <= endDate;
};

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

  // Kiểm tra và mở form kết nối nếu có gói mới mua chưa kết nối
  useEffect(() => {
    if (!isLoading && isFirstLoad && userPackages && userPackages.length > 0) {
      // Kiểm tra xem có query param connect không
      if (connectPackageId) {
        const packageToConnect = userPackages.find(
          (pkg) => pkg.id === connectPackageId
        );
        if (packageToConnect && isActivePackage(packageToConnect)) {
          handleConnectAccount(packageToConnect);
        }
      }
      // Kiểm tra xem có phải vừa mua gói mới không
      else if (isNewPurchase) {
        // Sắp xếp theo thời gian mua mới nhất
        const sortedPackages = [...userPackages].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Lấy gói mới nhất
        const latestPackage = sortedPackages[0];
        if (latestPackage && isActivePackage(latestPackage)) {
          handleConnectAccount(latestPackage);
        }
      }
      // Nếu không có marker đặc biệt, kiểm tra có gói nào chưa kết nối không
      else {
        // Kiểm tra xem có gói nào vừa mua và chưa kết nối không
        const activePackageWithoutAccount = userPackages.find(
          (pkg) => isActivePackage(pkg) && !accountData[pkg.id]
        );

        if (activePackageWithoutAccount) {
          handleConnectAccount(activePackageWithoutAccount);
        }
      }
      setIsFirstLoad(false);
    }
  }, [
    isLoading,
    userPackages,
    accountData,
    isFirstLoad,
    connectPackageId,
    isNewPurchase,
  ]);

  const loadAccountData = async (packages: UserPackage[]) => {
    setIsLoading(true);
    try {
      const accountDataMap: Record<string, TradingAccount | null> = {};

      const promises = packages
        .filter((pkg) => isActivePackage(pkg))
        .map(async (pkg) => {
          try {
            const account = await tradingAccountService.getUserPackageAccount(
              pkg.id
            );
            accountDataMap[pkg.id] = account;
          } catch (error) {
            console.error(
              `Error loading account data for package ${pkg.id}:`,
              error
            );
            accountDataMap[pkg.id] = null;
          }
        });

      await Promise.all(promises);
      setAccountData(accountDataMap);
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
    setAccountData((prev) => ({
      ...prev,
      [account.userPackageId]: account,
    }));
    setIsModalOpen(false);
    notification.success({
      message: "Trading account connected successfully!",
    });
  };

  const handleDisconnect = (packageId: string) => {
    setAccountData((prev) => ({
      ...prev,
      [packageId]: null,
    }));
    notification.success({
      message: "Account disconnected successfully",
    });
  };

  const columns: TableColumnType<UserPackage>[] = [
    {
      title: "Package Name",
      dataIndex: ["package", "name"],
      key: "packageName",
      render: (text: string, record: UserPackage) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {record.package.description}
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: ["package", "price"],
      key: "price",
      render: (price: number) => (
        <span className="font-medium">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(price)}
        </span>
      ),
      responsive: ["md"],
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) => new Date(date).toLocaleDateString(),
      responsive: ["lg"],
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date: string) => new Date(date).toLocaleDateString(),
      responsive: ["lg"],
    },
    {
      title: "MT4/MT5 Status",
      key: "mtStatus",
      render: (_: unknown, record: UserPackage) => {
        if (!isActivePackage(record)) {
          return <span className="text-gray-400">Not available</span>;
        }

        if (accountData[record.id] === undefined) {
          return <span className="text-gray-500">Loading...</span>;
        }

        return accountData[record.id] ? (
          <span className="text-green-600 font-medium">Connected</span>
        ) : (
          <span className="text-orange-500 font-medium">Not connected</span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: UserPackage) => (
        <div className="space-x-2">
          {isActivePackage(record) && (
            <>
              <Button
                type="primary"
                danger
                loading={cancellingId === record.id}
                onClick={() => handleCancel(record.id)}
                size={isMobile ? "small" : "middle"}
              >
                Cancel
              </Button>
              {accountData[record.id] === undefined ? (
                <Button
                  type="default"
                  loading={true}
                  disabled
                  size={isMobile ? "small" : "middle"}
                >
                  Loading...
                </Button>
              ) : !accountData[record.id] ? (
                <Button
                  type="primary"
                  icon={<ApiOutlined />}
                  onClick={() => handleConnectAccount(record)}
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                  size={isMobile ? "small" : "middle"}
                >
                  Connect MT4/MT5
                </Button>
              ) : (
                <Button
                  type="default"
                  icon={<RocketOutlined />}
                  onClick={() => handleConnectAccount(record)}
                  size={isMobile ? "small" : "middle"}
                >
                  View Connection
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  // Giao diện Card cho mobile
  const renderMobilePackageCards = () => {
    if (!userPackages || userPackages.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-500">
            No packages found
          </h3>
          <p className="text-gray-400 mb-4">
            You haven't purchased any packages yet
          </p>
          <Button type="primary" href="/packages">
            Browse Packages
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {userPackages.map((pkg) => (
          <Card key={pkg.id} className="w-full mb-4">
            <div className="flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium">{pkg.package.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {pkg.package.description}
                  </p>
                </div>
                <Tag color={isActivePackage(pkg) ? "green" : "default"}>
                  {isActivePackage(pkg) ? "Active" : "Expired"}
                </Tag>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center">
                  <DollarOutlined className="mr-2 text-gray-500" />
                  <span>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(pkg.package.price)}
                  </span>
                </div>
                <div className="flex items-center">
                  <CalendarOutlined className="mr-2 text-gray-500" />
                  <span>{new Date(pkg.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <strong className="mr-2">MT4/MT5:</strong>
                  {!isActivePackage(pkg) ? (
                    <span className="text-gray-400">Not available</span>
                  ) : accountData[pkg.id] === undefined ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : accountData[pkg.id] ? (
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircleOutlined className="mr-1" /> Connected
                    </span>
                  ) : (
                    <span className="text-orange-500 font-medium flex items-center">
                      <CloseCircleOutlined className="mr-1" /> Not connected
                    </span>
                  )}
                </div>
              </div>

              {isActivePackage(pkg) && (
                <div className="flex flex-col space-y-2">
                  {accountData[pkg.id] === undefined ? (
                    <Button type="default" loading disabled>
                      Loading...
                    </Button>
                  ) : !accountData[pkg.id] ? (
                    <Button
                      type="primary"
                      icon={<ApiOutlined />}
                      onClick={() => handleConnectAccount(pkg)}
                      style={{
                        backgroundColor: "#52c41a",
                        borderColor: "#52c41a",
                      }}
                      block
                    >
                      Connect MT4/MT5
                    </Button>
                  ) : (
                    <Button
                      type="default"
                      icon={<RocketOutlined />}
                      onClick={() => handleConnectAccount(pkg)}
                      block
                    >
                      View Connection
                    </Button>
                  )}

                  <Button
                    type="primary"
                    danger
                    loading={cancellingId === pkg.id}
                    onClick={() => handleCancel(pkg.id)}
                    block
                  >
                    Cancel Package
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Card cho Trading Accounts trên mobile
  const renderMobileTradingAccounts = () => {
    const connectedAccounts = userPackages?.filter(
      (pkg) => isActivePackage(pkg) && accountData[pkg.id]
    );

    if (!connectedAccounts || connectedAccounts.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-500">
            No connected trading accounts
          </h3>
          <p className="text-gray-400 mb-4">
            Connect your MT4/MT5 account to start trading
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {connectedAccounts.map((pkg) => (
          <Card key={pkg.id} className="w-full mb-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium">{pkg.package.name}</h3>
              <Tag color="green">Active</Tag>
            </div>

            {accountData[pkg.id] && (
              <div className="mt-2">
                <AccountConnectionInfo
                  account={accountData[pkg.id]!}
                  onDisconnect={() => handleDisconnect(pkg.id)}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    );
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
          {isMobile ? (
            renderMobilePackageCards()
          ) : userPackages && userPackages.length > 0 ? (
            <Table
              dataSource={userPackages}
              columns={columns}
              rowKey="id"
              pagination={false}
              loading={isLoading}
              scroll={{ x: "max-content" }}
            />
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-500">
                No packages found
              </h3>
              <p className="text-gray-400 mb-4">
                You haven't purchased any packages yet
              </p>
              <Button type="primary" href="/packages">
                Browse Packages
              </Button>
            </div>
          )}
        </TabPane>
        <TabPane tab="Trading Accounts" key="accounts">
          {isMobile ? (
            renderMobileTradingAccounts()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPackages &&
                userPackages
                  .filter((pkg) => isActivePackage(pkg) && accountData[pkg.id])
                  .map((pkg) => (
                    <Card
                      key={pkg.id}
                      title={pkg.package.name}
                      className="h-full"
                    >
                      {accountData[pkg.id] && (
                        <AccountConnectionInfo
                          account={accountData[pkg.id]!}
                          onDisconnect={() => handleDisconnect(pkg.id)}
                        />
                      )}
                    </Card>
                  ))}

              {(!userPackages ||
                !userPackages.some(
                  (pkg) => isActivePackage(pkg) && accountData[pkg.id]
                )) && (
                <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-500">
                    No connected trading accounts
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Connect your MT4/MT5 account to start trading
                  </p>
                </div>
              )}
            </div>
          )}
        </TabPane>
      </Tabs>

      <Modal
        title={
          accountData[selectedPackage?.id || ""]
            ? "Trading Account Connection"
            : "Connect Trading Account"
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={isMobile ? "90%" : 500}
      >
        {selectedPackage &&
          (accountData[selectedPackage.id] ? (
            <div>
              <AccountConnectionInfo
                account={accountData[selectedPackage.id]!}
                onDisconnect={() => {
                  handleDisconnect(selectedPackage.id);
                  setIsModalOpen(false);
                }}
              />
            </div>
          ) : (
            <div>
              <p className="mb-4">
                Connect your MT4/MT5 account to start trading with{" "}
                <strong>{selectedPackage.package.name}</strong>.
              </p>
              <AccountConnectionForm
                userPackageId={selectedPackage.id}
                onSuccess={handleAccountConnected}
              />
            </div>
          ))}
      </Modal>
    </div>
  );
};

export default MyPackages;

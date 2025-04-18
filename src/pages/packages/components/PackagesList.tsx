import { Table, Button, Tag, Card, App } from "antd";
import {
  ApiOutlined,
  RocketOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { UserPackage } from "../../../services/packages";
import { TradingAccount } from "../../../services/tradingAccount";
import { TableColumnType } from "antd";

interface PackagesListProps {
  userPackages: UserPackage[] | undefined;
  isLoading: boolean;
  isMobile: boolean;
  accountData: Record<string, TradingAccount | null>;
  cancellingId: string | null;
  handleCancel: (packageId: string) => void;
  handleConnectAccount: (pkg: UserPackage) => void;
}

// Hàm kiểm tra gói có đang active không
export const isActivePackage = (pkg: UserPackage): boolean => {
  const now = new Date();
  const startDate = new Date(pkg.startDate);
  const endDate = new Date(pkg.endDate);
  return now >= startDate && now <= endDate;
};

const PackagesList: React.FC<PackagesListProps> = ({
  userPackages,
  isLoading,
  isMobile,
  accountData,
  cancellingId,
  handleCancel,
  handleConnectAccount,
}) => {
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
      title: "MT5 Status",
      key: "mtStatus",
      render: (_: unknown, record: UserPackage) => {
        if (!isActivePackage(record)) {
          return <span className="text-gray-400">Not available</span>;
        }

        if (record.mt5Account) {
          return (
            <div>
              <div className="text-green-600 font-medium">Connected</div>
              <div className="text-xs mt-1">
                Balance:{" "}
                <span className="font-medium">
                  {record.mt5Account.balance.toFixed(2)}{" "}
                  {record.mt5Account.currency}
                </span>
              </div>
              <div className="text-xs">
                Equity:{" "}
                <span className="font-medium">
                  {record.mt5Account.equity.toFixed(2)}
                </span>
              </div>
            </div>
          );
        }

        if (accountData[record.id] === undefined) {
          return <span className="text-gray-500">Loading...</span>;
        }

        return accountData[record.id] ? (
          <div>
            <div className="text-green-600 font-medium">Connected</div>
            <div className="text-xs mt-1">
              Balance:{" "}
              <span className="font-medium">
                {accountData[record.id]!.balance.toFixed(2)}{" "}
                {accountData[record.id]!.currency}
              </span>
            </div>
            <div className="text-xs">
              Equity:{" "}
              <span className="font-medium">
                {accountData[record.id]!.equity.toFixed(2)}
              </span>
            </div>
          </div>
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
              {record.mt5Account ? (
                <Button
                  type="default"
                  icon={<RocketOutlined />}
                  onClick={() => handleConnectAccount(record)}
                  size={isMobile ? "small" : "middle"}
                >
                  View Connection
                </Button>
              ) : accountData[record.id] === undefined ? (
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
                  Connect MT5
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
                  <strong className="mr-2">MT5:</strong>
                  {!isActivePackage(pkg) ? (
                    <span className="text-gray-400">Not available</span>
                  ) : pkg.mt5Account ? (
                    <div className="flex flex-col">
                      <span className="text-green-600 font-medium flex items-center">
                        <CheckCircleOutlined className="mr-1" /> Connected
                      </span>
                      <div className="text-sm mt-1 ml-5">
                        <div>
                          Account: <strong>{pkg.mt5Account.account}</strong>
                        </div>
                        <div>
                          Balance:{" "}
                          <strong>
                            {pkg.mt5Account.balance.toFixed(2)}{" "}
                            {pkg.mt5Account.currency}
                          </strong>
                        </div>
                        <div>
                          Equity:{" "}
                          <strong>{pkg.mt5Account.equity.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  ) : accountData[pkg.id] === undefined ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : accountData[pkg.id] ? (
                    <div className="flex flex-col">
                      <span className="text-green-600 font-medium flex items-center">
                        <CheckCircleOutlined className="mr-1" /> Connected
                      </span>
                      <div className="text-sm mt-1 ml-5">
                        <div>
                          Account:{" "}
                          <strong>{accountData[pkg.id]!.account}</strong>
                        </div>
                        <div>
                          Balance:{" "}
                          <strong>
                            {accountData[pkg.id]!.balance.toFixed(2)}{" "}
                            {accountData[pkg.id]!.currency}
                          </strong>
                        </div>
                        <div>
                          Equity:{" "}
                          <strong>
                            {accountData[pkg.id]!.equity.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-orange-500 font-medium flex items-center">
                      <CloseCircleOutlined className="mr-1" /> Not connected
                    </span>
                  )}
                </div>
              </div>

              {isActivePackage(pkg) && (
                <div className="flex flex-col space-y-2">
                  {pkg.mt5Account ? (
                    <Button
                      type="default"
                      icon={<RocketOutlined />}
                      onClick={() => handleConnectAccount(pkg)}
                      block
                    >
                      View Connection
                    </Button>
                  ) : accountData[pkg.id] === undefined ? (
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
                      Connect MT5
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

  if (!userPackages || userPackages.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-500">No packages found</h3>
        <p className="text-gray-400 mb-4">
          You haven't purchased any packages yet
        </p>
        <Button type="primary" href="/packages">
          Browse Packages
        </Button>
      </div>
    );
  }

  return isMobile ? (
    renderMobilePackageCards()
  ) : (
    <Table
      dataSource={userPackages}
      columns={columns}
      rowKey="id"
      pagination={false}
      loading={isLoading}
      scroll={{ x: "max-content" }}
    />
  );
};

export default PackagesList;

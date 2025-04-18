import { Card, Tag, Table, Typography } from "antd";
import {
  DollarOutlined,
  BankOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { UserPackage } from "../../../services/packages";
import { TradingAccount } from "../../../services/tradingAccount";
import AccountConnectionInfo from "./AccountConnectionInfo";
import { isActivePackage } from "./PackagesList";

interface TradingAccountsListProps {
  userPackages: UserPackage[] | undefined;
  accountData: Record<string, TradingAccount | null>;
  isMobile: boolean;
  handleDisconnect: (packageId: string) => void;
}

const TradingAccountsList: React.FC<TradingAccountsListProps> = ({
  userPackages,
  accountData,
  isMobile,
  handleDisconnect,
}) => {
  // Get all connected accounts from both sources (mt5Account or accountData)
  const connectedAccountsData =
    userPackages?.filter((pkg) => {
      // First check if the package has mt5Account
      if (isActivePackage(pkg) && pkg.mt5Account) {
        return true;
      }

      // Fallback to accountData
      return isActivePackage(pkg) && accountData[pkg.id];
    }) || [];

  // For debugging - log all account data
  console.log(
    "Connected Trading Accounts:",
    connectedAccountsData.map((pkg) => ({
      package: pkg.package.name,
      account: pkg.mt5Account || accountData[pkg.id],
    }))
  );

  if (connectedAccountsData.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-500">
          No connected trading accounts
        </h3>
        <p className="text-gray-400 mb-4">
          Connect your MT5 account to start trading
        </p>
      </div>
    );
  }

  // Mobile view with simplified cards
  if (isMobile) {
    return (
      <div className="space-y-4">
        {connectedAccountsData.map((pkg) => {
          const account = pkg.mt5Account || accountData[pkg.id];
          if (!account) return null;

          return (
            <Card key={pkg.id} className="w-full mb-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-medium">{pkg.package.name}</h3>
                <Tag color="green">Active</Tag>
              </div>

              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <BankOutlined className="mr-2 text-blue-500" />
                  <span className="font-medium">Account: </span>
                  <span className="ml-2">{account.account}</span>
                </div>
                <div className="flex items-center mb-2">
                  <GlobalOutlined className="mr-2 text-blue-500" />
                  <span className="font-medium">Server: </span>
                  <span className="ml-2">{account.server}</span>
                </div>
                <div className="flex items-center mb-2">
                  <DollarOutlined className="mr-2 text-green-500" />
                  <span className="font-medium">Balance: </span>
                  <span className="ml-2">
                    {account.balance.toFixed(2)} {account.currency}
                  </span>
                </div>
                <div className="flex items-center mb-2">
                  <DollarOutlined className="mr-2 text-indigo-500" />
                  <span className="font-medium">Equity: </span>
                  <span className="ml-2">
                    {account.equity.toFixed(2)} {account.currency}
                  </span>
                </div>
                <div className="flex items-center mb-2">
                  <DollarOutlined className="mr-2 text-orange-500" />
                  <span className="font-medium">Margin: </span>
                  <span className="ml-2">
                    {account.margin.toFixed(2)} {account.currency}
                  </span>
                </div>
              </div>

              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
                onClick={() => handleDisconnect(pkg.id)}
              >
                Disconnect Account
              </button>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop view with AccountConnectionInfo component
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {connectedAccountsData.map((pkg) => {
        const account = pkg.mt5Account || accountData[pkg.id];
        if (!account) return null;

        return (
          <Card key={pkg.id} title={pkg.package.name} className="h-full">
            <AccountConnectionInfo
              account={account}
              onDisconnect={() => handleDisconnect(pkg.id)}
            />
          </Card>
        );
      })}
    </div>
  );
};

export default TradingAccountsList;

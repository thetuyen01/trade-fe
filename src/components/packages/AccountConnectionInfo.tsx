import { Descriptions, Button, Popconfirm, Badge, Typography } from "antd";
import { DisconnectOutlined, CheckCircleFilled } from "@ant-design/icons";
import {
  TradingAccount,
  tradingAccountService,
} from "../../services/tradingAccount";

interface AccountConnectionInfoProps {
  account: TradingAccount;
  onDisconnect: () => void;
}

const AccountConnectionInfo = ({
  account,
  onDisconnect,
}: AccountConnectionInfoProps) => {
  const handleDisconnect = async () => {
    try {
      await tradingAccountService.disconnectAccount(account.id);
      onDisconnect();
    } catch (error) {
      console.error("Failed to disconnect account:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Trading Account</h3>
        <Badge
          status="success"
          text={
            <Typography.Text strong style={{ color: "#52c41a" }}>
              <CheckCircleFilled style={{ marginRight: "5px" }} />
              Connected
            </Typography.Text>
          }
        />
      </div>

      <Descriptions bordered size="small" column={1} className="mb-4">
        <Descriptions.Item label="Account Type">
          <strong>{account.accountType}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Account Number">
          <strong>{account.accountNumber}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Server">
          <strong>{account.server}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Connected Since">
          {new Date(account.createdAt).toLocaleString()}
        </Descriptions.Item>
      </Descriptions>

      <div className="mt-4">
        <Popconfirm
          title="Disconnect Account"
          description="Are you sure you want to disconnect this trading account?"
          onConfirm={handleDisconnect}
          okText="Yes"
          cancelText="No"
        >
          <Button icon={<DisconnectOutlined />} danger>
            Disconnect Account
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
};

export default AccountConnectionInfo;

import {
  Descriptions,
  Button,
  Popconfirm,
  Badge,
  Typography,
  Statistic,
  Card,
  Row,
  Col,
} from "antd";
import {
  DisconnectOutlined,
  CheckCircleFilled,
  DollarOutlined,
  LineChartOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import {
  TradingAccount,
  tradingAccountService,
} from "../../../services/tradingAccount";

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
      await tradingAccountService.disconnectAccount(account.id.toString());
      onDisconnect();
    } catch (error) {
      console.error("Failed to disconnect account:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">Trading Account</h3>
          <p className="text-gray-500">{account.name || "MT5 Account"}</p>
        </div>
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

      {/* Financial Information */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Balance"
              value={account.balance}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={account.currency}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Equity"
              value={account.equity}
              precision={2}
              prefix={<LineChartOutlined />}
              suffix={account.currency}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Margin"
              value={account.margin}
              precision={2}
              prefix={<PercentageOutlined />}
              suffix={account.currency}
            />
          </Card>
        </Col>
      </Row>

      <Descriptions bordered size="small" column={1} className="mb-4">
        <Descriptions.Item label="Account Type">
          <strong>MT5</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Account Number">
          <strong>{account.account}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Server">
          <strong>{account.server}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Currency">
          <strong>{account.currency}</strong>
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

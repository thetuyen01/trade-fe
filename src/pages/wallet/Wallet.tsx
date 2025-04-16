import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Form,
  InputNumber,
  Image,
  Space,
  Spin,
} from "antd";
import {
  WalletOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { walletService, BankInfo } from "../../services/wallet";
import { useWalletStore } from "../../store/walletStore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

// Quick amount selection options
const QUICK_AMOUNTS = [
  { label: "100,000đ", value: 100000 },
  { label: "500,000đ", value: 500000 },
  { label: "1,000,000đ", value: 1000000 },
];

const Wallet = () => {
  const [depositForm] = Form.useForm();
  const [depositLoading, setDepositLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    qrCodeData?: string;
  } | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);

  const {
    wallet,
    fetchWallet,
    isLoading: walletLoading,
    error: walletError,
  } = useWalletStore();

  const { isLoading: transactionsLoading, error: transactionsError } = useQuery(
    {
      queryKey: ["wallet-transactions"],
      queryFn: () => walletService.getTransactions({ type: "DEPOSIT" }),
      enabled: !!wallet,
    }
  );

  const {
    data: bankInfoData,
    isLoading: bankInfoLoading,
    error: bankInfoError,
  } = useQuery({
    queryKey: ["bank-info"],
    queryFn: walletService.getBankInfo,
  });

  useEffect(() => {
    if (bankInfoData && bankInfoData.bankInfo.length > 0) {
      // Use first bank info from the list
      setBankInfo(bankInfoData.bankInfo[0]);
    }
  }, [bankInfoData]);

  const handleDeposit = async (values: { amount: number }) => {
    if (!bankInfo || !bankInfoData) {
      return;
    }

    setDepositLoading(true);
    setPaymentInfo(null);
    setDepositAmount(values.amount);

    try {
      // Generate VNPay QR code
      const qrLink = `https://api.vietqr.io/MBBANK/${bankInfo.accountNumber}/${
        values.amount
      }/${
        "NTP " + bankInfoData?.bankInfoUser || "NAPTIEN"
      }/qronly2.jpg?accountName=${encodeURIComponent(
        bankInfo.accountName || ""
      )}`;

      setPaymentInfo({
        qrCodeData: qrLink,
      });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleQuickAmountSelect = (amount: number) => {
    depositForm.setFieldsValue({ amount });
  };

  if (walletLoading || transactionsLoading || bankInfoLoading) {
    return <LoadingSpinner />;
  }

  if (walletError || transactionsError || bankInfoError) {
    return (
      <ErrorMessage
        message="Failed to load wallet information"
        description="Please try again later or contact support if the problem persists."
      />
    );
  }

  if (!bankInfo) {
    return (
      <ErrorMessage
        message="No bank information available"
        description="Please contact support to set up your bank information."
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-gray-600">Manage your balance and deposits</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Current Balance"
              value={wallet?.balance || 0}
              precision={0}
              valueStyle={{ color: "#3f8600" }}
              prefix={<WalletOutlined />}
              suffix="VND"
            />
            <Button
              type="primary"
              icon={<ArrowUpOutlined />}
              className="mt-4"
              onClick={() => fetchWallet()}
            >
              Refresh Balance
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Deposit Funds with VNPay">
            <Form
              form={depositForm}
              layout="vertical"
              onFinish={handleDeposit}
              requiredMark={false}
            >
              <Form.Item
                name="amount"
                label="Amount (VND)"
                rules={[
                  { required: true, message: "Please enter an amount" },
                  {
                    type: "number",
                    min: 50000,
                    message: "Minimum deposit is 50,000 VND",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Enter deposit amount"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                  size="large"
                  prefix={<DollarOutlined />}
                />
              </Form.Item>

              <Form.Item>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Quick amount selection:
                  </p>
                  <Space>
                    {QUICK_AMOUNTS.map((option) => (
                      <Button
                        key={option.value}
                        onClick={() => handleQuickAmountSelect(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Space>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={depositLoading}
                  icon={<BankOutlined />}
                  block
                >
                  Generate VNPay QR Code
                </Button>
              </Form.Item>
            </Form>

            {paymentInfo && paymentInfo.qrCodeData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">VNPay QR Code</h3>

                <div className="mb-4 text-center">
                  <Spin spinning={!paymentInfo.qrCodeData}>
                    <Image
                      src={paymentInfo.qrCodeData}
                      alt="VNPay QR Code"
                      style={{ maxWidth: "250px" }}
                      preview={false}
                    />
                  </Spin>
                  <p className="mt-2 text-sm text-gray-500">
                    Scan this QR code with your banking app to make payment
                  </p>
                  {depositAmount > 0 && (
                    <p className="mt-1 font-medium">
                      Amount:{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(depositAmount)}
                    </p>
                  )}
                  <p className="mt-1 text-sm">
                    Account: {bankInfo.accountNumber} ({bankInfo.accountName})
                  </p>
                  <p className="mt-1 text-sm">Bank: {bankInfo.bankName}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Transfer content:{" "}
                    {"NTP " + bankInfoData?.bankInfoUser || "NAPTIEN"}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Wallet;

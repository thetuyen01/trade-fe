import { useState } from "react";
import { Row, Col, Card, Button, Tag, App, Typography, Badge } from "antd";
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  LineChartOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  SendOutlined,
  CustomerServiceOutlined,
  CrownOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { packagesService } from "../../services/packages";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

const { Title, Text } = Typography;

// Predefined packages
const PREDEFINED_PACKAGES = [
  {
    id: "package-1",
    name: "Basic Package",
    price: 500000,
    duration: 30,
    tag: "Starter",
    tagColor: "blue",
    description: "Perfect for beginners who want to start trading manually",
    features: [
      { title: "TRADE TAY", icon: <LineChartOutlined /> },
      {
        title: "HỖ TRỢ CHĂM SÓC KHÁCH HÀNG",
        icon: <CustomerServiceOutlined />,
      },
    ],
    popular: false,
    color: "#1890ff",
  },
  {
    id: "package-2",
    name: "Professional Package",
    price: 1000000,
    duration: 30,
    tag: "Popular",
    tagColor: "green",
    description: "Intermediate package with essential trading features",
    features: [
      { title: "TRADE TAY", icon: <LineChartOutlined /> },
      { title: "VIẾT PHƯƠNG PHÁP THEO Ý MUỐN", icon: <SettingOutlined /> },
      { title: "COPYTRADE", icon: <UserSwitchOutlined /> },
      {
        title: "HỖ TRỢ CHĂM SÓC KHÁCH HÀNG",
        icon: <CustomerServiceOutlined />,
      },
    ],
    popular: true,
    color: "#52c41a",
  },
  {
    id: "package-3",
    name: "Premium Package",
    price: 2000000,
    duration: 30,
    tag: "Full Features",
    tagColor: "gold",
    description: "Complete set of advanced trading features for professionals",
    features: [
      { title: "TRADE TAY", icon: <LineChartOutlined /> },
      { title: "VIẾT PHƯƠNG PHÁP THEO Ý MUỐN", icon: <SettingOutlined /> },
      { title: "COPYTRADE", icon: <UserSwitchOutlined /> },
      { title: "TẠO CẤU HÌNH TỪ TRADINGVIEW", icon: <LineChartOutlined /> },
      { title: "BẢN TÍN HIỆU LÊN TELEGRAM", icon: <SendOutlined /> },
      { title: "TỰ ĐỘNG GIAO DỊCH, TỰ ĐỘNG TP-SL", icon: <RobotOutlined /> },
      {
        title: "HỖ TRỢ CHĂM SÓC KHÁCH HÀNG",
        icon: <CustomerServiceOutlined />,
      },
    ],
    popular: false,
    color: "#faad14",
  },
];

const Packages = () => {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { notification } = App.useApp();
  const navigate = useNavigate();

  const { isLoading, error } = useQuery({
    queryKey: ["packages"],
    queryFn: () => packagesService.getAllPackages(),
    enabled: false, // Disable the automatic fetching since we're using predefined packages
  });

  const handlePurchase = async (packageId: string) => {
    setPurchasingId(packageId);

    try {
      const response = await packagesService.purchasePackage(packageId);
      if (response.status === 201) {
        notification.success({
          message: "Package purchased successfully!",
          description: "Connect your MT4/MT5 account to start trading",
        });

        navigate("/my-packages?newPurchase=true");
      } else {
        notification.error({
          message: "Failed to purchase package",
          description: response.message,
        });
      }
    } catch (error) {
      notification.error({
        message: "Failed to purchase package",
        description: "Please check your wallet balance.",
      });
    } finally {
      setPurchasingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load packages"
        description="Please try again later or contact support if the problem persists."
      />
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <Title level={2}>
          <CrownOutlined className="mr-2 text-yellow-500" />
          Premium Trading Packages
        </Title>
        <Text className="text-gray-600 text-lg">
          Choose the package that best fits your trading strategy and unlock
          powerful features
        </Text>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {PREDEFINED_PACKAGES.map((pkg) => (
          <Col key={pkg.id} xs={24} sm={24} md={8} lg={8}>
            <Badge.Ribbon
              text={pkg.tag}
              color={pkg.tagColor}
              style={{ display: pkg.popular ? "block" : "none" }}
            >
              <Card
                hoverable
                className="h-full flex flex-col overflow-hidden"
                style={{
                  borderTop: `4px solid ${pkg.color}`,
                  boxShadow: pkg.popular
                    ? "0 8px 16px rgba(0,0,0,0.1)"
                    : "0 2px 8px rgba(0,0,0,0.05)",
                }}
                title={
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">{pkg.name}</span>
                    <Tag color={pkg.tagColor}>{`${pkg.duration} ngày`}</Tag>
                  </div>
                }
                actions={[
                  <Button
                    key="buy"
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    loading={purchasingId === pkg.id}
                    onClick={() => handlePurchase(pkg.id)}
                    block
                    style={{ backgroundColor: pkg.color }}
                  >
                    Mua Ngay
                  </Button>,
                ]}
              >
                <div className="flex-grow">
                  <div
                    className="text-3xl font-bold mb-6 text-center"
                    style={{ color: pkg.color }}
                  >
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(pkg.price)}
                  </div>

                  <p className="mb-6 text-gray-600 text-center">
                    {pkg.description}
                  </p>

                  <div className="mb-3 flex items-center">
                    <StarOutlined className="text-yellow-500 mr-2" />
                    <Text strong>Tính năng bao gồm:</Text>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div
                          className="mr-3 text-lg"
                          style={{ color: pkg.color }}
                        >
                          {feature.icon}
                        </div>
                        <Text>{feature.title}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Packages;

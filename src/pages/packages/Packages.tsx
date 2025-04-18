import { useState } from "react";
import { Row, Col, Card, Button, Tag, App, Typography, Badge } from "antd";
import {
  ShoppingCartOutlined,
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

// Define the config type with an index signature
type PackageConfigType = {
  [key: string]: {
    tag: string;
    tagColor: string;
    popular: boolean;
    color: string;
  };
};

// Map of package name to display configuration
const PACKAGE_CONFIG: PackageConfigType = {
  "Basic Package": {
    tag: "Starter",
    tagColor: "blue",
    popular: false,
    color: "#1890ff",
  },
  "Professional Package": {
    tag: "Popular",
    tagColor: "green",
    popular: true,
    color: "#52c41a",
  },
  "Premium Package": {
    tag: "Full Features",
    tagColor: "gold",
    popular: false,
    color: "#faad14",
  },
};

const Packages = () => {
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const { notification } = App.useApp();
  const navigate = useNavigate();

  const {
    isLoading,
    error,
    data: packages = [],
  } = useQuery({
    queryKey: ["packages"],
    queryFn: () => packagesService.getAllPackages(),
  });

  const handlePurchase = async (packageId: number) => {
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
        {[...packages]
          .sort((a, b) => {
            const sortOrder = [
              "Basic Package",
              "Professional Package",
              "Premium Package",
            ];
            return sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name);
          })
          .map((pkg) => {
            const config = PACKAGE_CONFIG[pkg.name] || {
              tag: "Package",
              tagColor: "blue",
              popular: false,
              color: "#1890ff",
            };

            return (
              <Col key={pkg.id} xs={24} sm={24} md={8} lg={8}>
                <Badge.Ribbon
                  text={config.tag}
                  color={config.tagColor}
                  style={{ display: config.popular ? "block" : "none" }}
                >
                  <Card
                    hoverable
                    className="h-full flex flex-col overflow-hidden"
                    style={{
                      borderTop: `4px solid ${config.color}`,
                      boxShadow: config.popular
                        ? "0 8px 16px rgba(0,0,0,0.1)"
                        : "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold">{pkg.name}</span>
                        <Tag
                          color={config.tagColor}
                        >{`${pkg.duration} ngày`}</Tag>
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
                        style={{ backgroundColor: config.color }}
                      >
                        Mua Ngay
                      </Button>,
                    ]}
                  >
                    <div className="flex-grow">
                      <div
                        className="text-3xl font-bold mb-6 text-center"
                        style={{ color: config.color }}
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
                        {pkg.features.map((feature, index) => {
                          // Extract emoji from feature text if present
                          const emoji =
                            feature.match(/^([\p{Emoji}])/u)?.[0] || "";
                          const text = emoji
                            ? feature.replace(emoji, "").trim()
                            : feature;

                          // Determine icon based on feature text
                          let icon;
                          if (feature.includes("TRADE TAY"))
                            icon = <LineChartOutlined />;
                          else if (feature.includes("PHƯƠNG PHÁP"))
                            icon = <SettingOutlined />;
                          else if (feature.includes("COPYTRADE"))
                            icon = <UserSwitchOutlined />;
                          else if (feature.includes("TRADINGVIEW"))
                            icon = <LineChartOutlined />;
                          else if (feature.includes("TELEGRAM"))
                            icon = <SendOutlined />;
                          else if (feature.includes("TỰ ĐỘNG"))
                            icon = <RobotOutlined />;
                          else if (feature.includes("CHĂM SÓC"))
                            icon = <CustomerServiceOutlined />;
                          else icon = <StarOutlined />;

                          return (
                            <li key={index} className="flex items-start">
                              <div
                                className="mr-3 text-lg"
                                style={{ color: config.color }}
                              >
                                {emoji || icon}
                              </div>
                              <Text>{text}</Text>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
      </Row>
    </div>
  );
};

export default Packages;

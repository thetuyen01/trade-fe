import { useState } from "react";
import { Row, Col, Card, Button, Tag, App } from "antd";
import { ShoppingCartOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { packagesService, Package } from "../../services/packages";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

const Packages = () => {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { notification } = App.useApp();
  const navigate = useNavigate();

  const {
    data: packages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["packages"],
    queryFn: () => packagesService.getAllPackages(),
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

        // Chuyển hướng đến trang My Packages với marker để biết là vừa mua xong
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Available Packages</h1>
        <p className="text-gray-600">
          Choose the package that best fits your trading needs
        </p>
      </div>

      <Row gutter={[16, 16]}>
        {packages?.map((pkg: Package) => (
          <Col key={pkg.id} xs={24} sm={12} md={8} lg={8}>
            <Card
              className="h-full flex flex-col"
              title={<span className="text-lg font-bold">{pkg.name}</span>}
              extra={<Tag color="blue">{`${pkg.duration} days`}</Tag>}
              actions={[
                <Button
                  key="buy"
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  loading={purchasingId === pkg.id}
                  onClick={() => handlePurchase(pkg.id)}
                  block
                >
                  Buy Now
                </Button>,
              ]}
            >
              <div className="flex-grow">
                <div className="text-2xl font-bold text-blue-600 mb-4">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(pkg.price)}
                </div>

                <p className="mb-4 text-gray-600">{pkg.description}</p>

                <h4 className="font-bold mb-2">Benefits:</h4>
                <ul className="space-y-1">
                  {pkg.benefits &&
                    pkg.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Packages;

import { useState } from "react";
import { Table, Button, App } from "antd";

import { useQuery } from "@tanstack/react-query";
import { packagesService, UserPackage } from "../../services/packages";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const MyPackages = () => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { modal, notification } = App.useApp();
  const {
    data: userPackages,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userPackages"],
    queryFn: () => packagesService.getUserPackages(),
  });

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

  const columns = [
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
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: UserPackage) =>
        record.status === "active" ? (
          <Button
            type="primary"
            danger
            loading={cancellingId === record.id}
            onClick={() => handleCancel(record.id)}
          >
            Cancel
          </Button>
        ) : null,
    },
  ];

  if (isLoading) {
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

      {userPackages && userPackages.length > 0 ? (
        <Table
          dataSource={userPackages}
          columns={columns}
          rowKey="id"
          pagination={false}
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
    </div>
  );
};

export default MyPackages;

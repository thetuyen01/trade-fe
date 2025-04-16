import { useState } from "react";
import {
  Table,
  Tag,
  Card,
  DatePicker,
  Select,
  Button,
  Space,
  Form,
  TableProps,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  transactionsService,
  TransactionFilters,
} from "../../services/transactions";
import { Transaction } from "../../services/wallet";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

const { Option } = Select;
const { RangePicker } = DatePicker;

const Transactions = () => {
  const [filter, setFilter] = useState<TransactionFilters>({});
  const [form] = Form.useForm();

  const {
    data: transactionsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions", filter],
    queryFn: () => transactionsService.getAllTransactions(filter),
  });

  // Process transactions data to ensure it's an array
  const transactions = Array.isArray(transactionsResponse)
    ? transactionsResponse
    : (transactionsResponse as any)?.data || [];

  const handleFilter = (values: any) => {
    const newFilter: TransactionFilters = {};

    if (values.type) {
      newFilter.type = values.type;
    }

    if (values.status) {
      newFilter.status = values.status;
    }

    if (values.dateRange && values.dateRange.length === 2) {
      newFilter.startDate = values.dateRange[0].toISOString();
      newFilter.endDate = values.dateRange[1].toISOString();
    }

    setFilter(newFilter);
  };

  const handleReset = () => {
    form.resetFields();
    setFilter({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "pending":
        return "blue";
      case "failed":
        return "red";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "deposit" ? "blue" : "orange";
  };

  const formatAmount = (amount: number, type: string) => {
    const formattedAmount = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

    return (
      <span className={type === "deposit" ? "text-green-600" : "text-red-600"}>
        {type === "deposit" ? "+" : "-"}
        {formattedAmount}
      </span>
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (id: string | number) => {
        const idString = String(id);
        return (
          <span className="text-xs font-mono">
            {idString.length > 8 ? `${idString.substring(0, 8)}...` : idString}
          </span>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: Transaction) =>
        formatAmount(amount, record.type),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a: Transaction, b: Transaction) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
    },
  ] as TableProps<Transaction>["columns"];

  if (isLoading && !transactionsResponse) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load transactions"
        description="Please try again later or contact support if the problem persists."
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <p className="text-gray-600">
          View and filter your transaction history
        </p>
      </div>

      <Card className="mb-6">
        <Form
          form={form}
          layout="inline"
          onFinish={handleFilter}
          className="flex flex-wrap gap-2"
        >
          <Form.Item name="type" label="Type">
            <Select style={{ width: 150 }} placeholder="All Types" allowClear>
              <Option value="deposit">Deposit</Option>
              <Option value="purchase">Purchase</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select
              style={{ width: 150 }}
              placeholder="All Statuses"
              allowClear
            >
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="failed">Failed</Option>
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="Date Range">
            <RangePicker style={{ width: 280 }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
              >
                Filter
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Table
        dataSource={transactions}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={isLoading}
      />
    </div>
  );
};

export default Transactions;

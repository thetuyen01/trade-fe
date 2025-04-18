import { useState } from "react";
import { Form, Input, Button, Select, App } from "antd";
import { LockOutlined, NumberOutlined, ApiOutlined } from "@ant-design/icons";
import {
  TradingAccount,
  tradingAccountService,
} from "../../../services/tradingAccount";

interface AccountConnectionFormProps {
  userPackageId: string;
  onSuccess: (account: TradingAccount) => void;
  existingAccount?: TradingAccount | null;
}

const AccountConnectionForm = ({
  userPackageId,
  onSuccess,
  existingAccount,
}: AccountConnectionFormProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { notification } = App.useApp();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await tradingAccountService.connectAccount(
        userPackageId,
        {
          accountNumber: values.accountNumber,
          server: values.server,
          password: values.password,
          accountType: values.accountType,
        }
      );

      if (response.success && response.id) {
        notification.success({
          message: "Account connected successfully!",
        });

        // Create a TradingAccount object from the response
        const account: TradingAccount = {
          id: response.id,
          account: response.account || "",
          server: values.server,
          name: response.name || "",
          balance: response.balance || 0,
          equity: response.equity || 0,
          margin: response.margin || 0,
          currency: response.currency || "",
          connected: response.connected || false,
          isActive: true,
          userPackageId: userPackageId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onSuccess(account);
        form.resetFields();
      } else {
        notification.error({
          message: "Failed to connect account",
          description: response.message,
        });
      }
    } catch (error) {
      notification.error({
        message: "Failed to connect account",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={
        existingAccount
          ? {
              accountNumber: existingAccount.account,
              server: existingAccount.server,
              accountType: "MT5", // Default to MT5 since it's not in the TradingAccount interface
            }
          : { accountType: "MT5", server: "Exness-MT5Real15" }
      }
      onFinish={handleSubmit}
    >
      <Form.Item
        name="accountType"
        label="Account Type"
        rules={[{ required: true, message: "Please select an account type" }]}
      >
        <Select>
          <Select.Option value="MT5">MetaTrader 5</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="accountNumber"
        label="Account Number"
        rules={[
          { required: true, message: "Please enter your account number" },
          {
            pattern: /^\d+$/,
            message: "Account number must contain only digits",
          },
        ]}
      >
        <Input prefix={<NumberOutlined />} placeholder="12345678" />
      </Form.Item>

      <Form.Item name="server" label="Server">
        <Input
          prefix={<ApiOutlined />}
          readOnly
          defaultValue={"Exness-MT5Real15"}
          placeholder="Broker Server"
        />
      </Form.Item>

      {!existingAccount && (
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: "Please enter your account password" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
        </Form.Item>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          {existingAccount ? "Update Connection" : "Connect Account"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AccountConnectionForm;

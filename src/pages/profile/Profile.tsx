import { useState } from "react";
import { Card, Avatar, Tabs, Form, Input, Button, App } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/auth";

const Profile = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { notification } = App.useApp();
  const [passwordForm] = Form.useForm();

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);

    try {
      // In a real app, you would call an API to update the profile
      console.log("Updating profile with:", values);
      notification.success({
        message: "Profile updated successfully!",
      });
    } catch (error) {
      notification.error({
        message: "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setLoading(true);

    try {
      // Call the API to change the password
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      notification.success({
        message: "Password changed successfully!",
      });

      // Reset form fields after successful password change
      passwordForm.resetFields();
    } catch (error) {
      notification.error({
        message: "Failed to change password",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: "1",
      label: "Profile Information",
      children: (
        <Form
          layout="vertical"
          initialValues={{
            name: user?.fullName,
            email: user?.email,
          }}
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full Name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" disabled />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "2",
      label: "Change Password",
      children: (
        <Form
          layout="vertical"
          onFinish={handleChangePassword}
          form={passwordForm}
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[
              { required: true, message: "Please enter your current password" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Current Password"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "Please enter your new password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New Password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm New Password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
          <Avatar size={100} icon={<UserOutlined />} className="bg-blue-600" />

          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold mb-1">
              {user?.fullName || "User"}
            </h1>
            <p className="text-gray-500">
              {user?.email || "Email not available"}
            </p>
          </div>
        </div>

        <Tabs defaultActiveKey="1" items={items} />
      </Card>
    </div>
  );
};

export default Profile;

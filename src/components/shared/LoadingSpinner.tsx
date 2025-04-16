import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

interface LoadingSpinnerProps {
  tip?: string;
  fullScreen?: boolean;
  size?: "small" | "default" | "large";
}

const LoadingSpinner = ({
  tip = "Loading...",
  fullScreen = false,
  size = "large",
}: LoadingSpinnerProps) => {
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: size === "small" ? 24 : size === "large" ? 40 : 32 }}
      spin
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-80">
        <Spin indicator={antIcon} tip={tip} size={size} />
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-10">
      <Spin indicator={antIcon} tip={tip} size={size} />
    </div>
  );
};

export default LoadingSpinner;

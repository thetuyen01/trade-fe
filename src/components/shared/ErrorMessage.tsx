import { Alert } from "antd";

interface ErrorMessageProps {
  message: string;
  description?: string;
  showIcon?: boolean;
  closable?: boolean;
  type?: "error" | "warning";
  className?: string;
}

const ErrorMessage = ({
  message,
  description,
  showIcon = true,
  closable = false,
  type = "error",
  className = "",
}: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <Alert
      message={message}
      description={description}
      type={type}
      showIcon={showIcon}
      closable={closable}
      className={`mb-4 ${className}`}
    />
  );
};

export default ErrorMessage;

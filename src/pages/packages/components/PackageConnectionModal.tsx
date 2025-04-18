import { Modal } from "antd";
import { UserPackage } from "../../../services/packages";
import { TradingAccount } from "../../../services/tradingAccount";
import AccountConnectionInfo from "./AccountConnectionInfo";
import AccountConnectionForm from "./AccountConnectionForm";

interface PackageConnectionModalProps {
  isModalOpen: boolean;
  selectedPackage: UserPackage | null;
  accountData: Record<string, TradingAccount | null>;
  isMobile: boolean;
  onCancel: () => void;
  onDisconnect: (packageId: string) => void;
  onSuccess: (account: TradingAccount) => void;
}

const PackageConnectionModal: React.FC<PackageConnectionModalProps> = ({
  isModalOpen,
  selectedPackage,
  accountData,
  isMobile,
  onCancel,
  onDisconnect,
  onSuccess,
}) => {
  if (!selectedPackage) {
    return null;
  }

  const hasConnectedAccount = accountData[selectedPackage.id];

  return (
    <Modal
      title={
        hasConnectedAccount
          ? "Trading Account Connection"
          : "Connect Trading Account"
      }
      open={isModalOpen}
      onCancel={onCancel}
      footer={null}
      width={isMobile ? "90%" : 500}
    >
      {hasConnectedAccount ? (
        <div>
          <AccountConnectionInfo
            account={accountData[selectedPackage.id]!}
            onDisconnect={() => {
              onDisconnect(selectedPackage.id);
              onCancel();
            }}
          />
        </div>
      ) : (
        <div>
          <p className="mb-4">
            Connect your MT5 account to start trading with{" "}
            <strong>{selectedPackage.package.name}</strong>.
          </p>
          <AccountConnectionForm
            userPackageId={selectedPackage.id}
            onSuccess={onSuccess}
          />
        </div>
      )}
    </Modal>
  );
};

export default PackageConnectionModal;

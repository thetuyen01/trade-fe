import api from "./api";

export interface TradingAccount {
  id: string;
  userId: string;
  userPackageId: string;
  accountNumber: string;
  server: string;
  password: string;
  accountType: "MT4" | "MT5";
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectAccountResponse {
  success: boolean;
  message: string;
  account?: TradingAccount;
}

export const tradingAccountService = {
  async connectAccount(
    userPackageId: string,
    accountData: {
      accountNumber: string;
      server: string;
      password: string;
      accountType: "MT4" | "MT5";
    }
  ): Promise<ConnectAccountResponse> {
    try {
      const response = await api.post("/trading-accounts/connect", {
        userPackageId,
        ...accountData,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to connect account",
      };
    }
  },

  async getUserPackageAccount(
    userPackageId: string
  ): Promise<TradingAccount | null> {
    try {
      const response = await api.get(
        `/trading-accounts/user-package/${userPackageId}`
      );
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async disconnectAccount(accountId: string): Promise<{ success: boolean }> {
    const response = await api.post(
      `/trading-accounts/disconnect/${accountId}`
    );
    return response.data;
  },
};

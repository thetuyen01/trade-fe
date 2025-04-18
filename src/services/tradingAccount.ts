import api from "./api";

export interface TradingAccount {
  id: number;
  account: string;
  server: string;
  name: string;
  balance: number;
  equity: number;
  margin: number;
  currency: string;
  connected: boolean;
  isActive: boolean;
  userPackageId: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectAccountResponse {
  success: boolean;
  message?: string;
  id?: number;
  account?: string;
  name?: string;
  balance?: number;
  equity?: number;
  margin?: number;
  currency?: string;
  connected?: boolean;
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
      // Chuyển đổi dữ liệu cho phù hợp với API mới
      const payload = {
        account: accountData.accountNumber,
        password: accountData.password,
        server: accountData.server,
        packageUserId: parseInt(userPackageId),
      };

      const response = await api.post("/mt5/connect", payload);

      // Chuyển đổi response thành định dạng TradingAccount mà frontend đang sử dụng
      return {
        success: true,
        id: response.data.id,
        account: response.data.account,
        name: response.data.name,
        balance: response.data.balance,
        equity: response.data.equity,
        margin: response.data.margin,
        currency: response.data.currency,
        connected: response.data.connected,
      };
    } catch (error: any) {
      console.error("Connect account error:", error);
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
      // Lấy tất cả tài khoản MT5 của user
      const response = await api.get(`/mt5/accounts`);
      const accounts = response.data;

      // Tìm tài khoản phù hợp với packageId
      const account = accounts.find(
        (acc: TradingAccount) => acc.userPackageId === userPackageId
      );

      return account || null;
    } catch (error) {
      console.error("Get user package account error:", error);
      return null;
    }
  },

  async disconnectAccount(accountId: string): Promise<{ success: boolean }> {
    try {
      // Deactivate account thay vì disconnect
      await api.patch(`/mt5/accounts/${accountId}`, {
        isActive: false,
      });
      return { success: true };
    } catch (error) {
      console.error("Disconnect account error:", error);
      return { success: false };
    }
  },

  async refreshAccountInfo(accountId: number): Promise<TradingAccount | null> {
    try {
      const response = await api.post(`/mt5/accounts/${accountId}/refresh`);
      return response.data;
    } catch (error) {
      console.error("Refresh account error:", error);
      return null;
    }
  },

  async getUserAccounts(): Promise<TradingAccount[]> {
    try {
      const response = await api.get(`/mt5/accounts`);
      return response.data;
    } catch (error) {
      console.error("Get user accounts error:", error);
      return [];
    }
  },
};

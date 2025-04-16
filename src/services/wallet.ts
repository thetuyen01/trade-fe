import api from "./api";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: "DEPOSIT" | "PURCHASE";
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  description?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRequest {
  amount: number;
  paymentMethod: string;
}

export interface DepositResponse {
  success: boolean;
  transaction?: Transaction;
  error?: string;
  paymentUrl?: string;
  qrCodeData?: string;
}

export interface BankInfo {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface BankInfoResponse {
  bankInfoUser: string;
  bankInfo: BankInfo[];
}

export const walletService = {
  async getWallet(): Promise<Wallet> {
    const response = await api.get("/wallet");
    return response.data;
  },

  async getTransactions(filters?: {
    type?: "DEPOSIT" | "PURCHASE";
  }): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (filters?.type) {
      queryParams.append("type", filters.type);
    }

    const url = `/wallet/transactions${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await api.get(url);
    return response.data;
  },

  async deposit(data: DepositRequest): Promise<DepositResponse> {
    const response = await api.post("/wallet/deposit", data);
    return response.data;
  },

  async getBankInfo(): Promise<BankInfoResponse> {
    const response = await api.get("/bank-info");
    return response.data;
  },
};

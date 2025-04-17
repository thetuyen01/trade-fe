import api from "./api";

export interface Wallet {
  id: number;
  userId: number;
  balance: number;
  lockedBalance: number;
  createdAt: string;
  updatedAt: string;
}

const walletService = {
  // Get user wallet
  getWallet: async () => {
    const response = await api.get<Wallet>("/wallet");
    return response.data;
  },

  // Get transaction history
  getTransactionHistory: async () => {
    const response = await api.get("/wallet/history");
    return response.data;
  },

  // Deposit funds
  deposit: async (amount: number) => {
    const response = await api.post("/wallet/deposit", { amount });
    return response.data;
  },
};

export default walletService;

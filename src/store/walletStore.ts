import { create } from "zustand";
import {
  walletService,
  Wallet,
  Transaction,
  DepositRequest,
} from "../services/wallet";

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchWallet: () => Promise<void>;
  fetchTransactions: (filters?: {
    type?: "deposit" | "purchase";
  }) => Promise<void>;
  deposit: (data: DepositRequest) => Promise<{
    success: boolean;
    paymentUrl?: string;
    qrCodeData?: string;
  }>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchWallet: async () => {
    set({ isLoading: true });
    try {
      const wallet = await walletService.getWallet();
      set({ wallet, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch wallet";
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchTransactions: async (filters: any) => {
    set({ isLoading: true });
    try {
      const transactions = await walletService.getTransactions(filters);
      set({ transactions, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch transactions";
      set({ error: errorMessage, isLoading: false });
    }
  },

  deposit: async (data: DepositRequest) => {
    set({ isLoading: true });
    try {
      const response = await walletService.deposit(data);

      // Refresh wallet after successful deposit
      if (response.success) {
        const wallet = await walletService.getWallet();
        set({ wallet });
      }

      set({ isLoading: false });
      return {
        success: response.success,
        paymentUrl: response.paymentUrl,
        qrCodeData: response.qrCodeData,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Deposit failed";
      set({ error: errorMessage, isLoading: false });
      return { success: false };
    }
  },

  clearError: () => set({ error: null }),
}));

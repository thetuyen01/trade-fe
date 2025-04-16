import api from "./api";
import { Transaction } from "./wallet";

export interface TransactionFilters {
  type?: "deposit" | "purchase";
  startDate?: string;
  endDate?: string;
  status?: "completed" | "pending" | "failed";
}

export const transactionsService = {
  async getAllTransactions(
    filters?: TransactionFilters
  ): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.status) queryParams.append("status", filters.status);
    }

    const url = `/transactions${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await api.get(url);
    return response.data;
  },

  async getTransactionById(id: string): Promise<Transaction> {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
};

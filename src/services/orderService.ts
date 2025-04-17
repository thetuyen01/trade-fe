import api from "./api";

export interface Order {
  id: number;
  userId: number;
  type: "BUY" | "SELL";
  amount: number;
  price: number;
  status: "OPEN" | "COMPLETED" | "CANCELED";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateOrderDto {
  type: "BUY" | "SELL";
  amount: number;
  price: number;
}

const orderService = {
  // Get market orders
  getMarketOrders: async (page = 1, limit = 10) => {
    const response = await api.get<OrdersResponse>("/orders/market", {
      params: { page, limit },
    });
    return response.data;
  },

  // Get user orders
  getUserOrders: async (page = 1, limit = 10) => {
    const response = await api.get<OrdersResponse>("/orders", {
      params: { page, limit },
    });
    return response.data;
  },

  // Create new order
  createOrder: async (orderData: CreateOrderDto) => {
    const response = await api.post<Order>("/orders", orderData);
    return response.data;
  },

  // Execute order
  executeOrder: async (orderId: number) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `/orders/${orderId}/execute`
    );
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/orders/${orderId}`
    );
    return response.data;
  },

  // Get order by ID
  getOrderById: async (orderId: number) => {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  },
};

export default orderService;

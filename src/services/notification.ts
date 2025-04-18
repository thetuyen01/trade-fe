import api from "./api";

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

class NotificationService {
  // Get user's notifications with optional filtering parameters
  async getUserNotifications(params?: {
    skip?: number;
    take?: number;
    type?: string;
    isRead?: boolean;
  }): Promise<Notification[]> {
    const response = await api.get("/notifications/my", { params });
    return response.data;
  }

  // Get count of unread notifications
  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
    return response.data.count;
  }

  // Mark a notification as read
  async markAsRead(id: number): Promise<void> {
    await api.patch(`/notifications/${id}/mark-as-read`);
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await api.patch("/notifications/mark-all-as-read");
  }

  // Get a specific notification by id
  async getById(id: number): Promise<Notification> {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  }
}

export const notificationService = new NotificationService();

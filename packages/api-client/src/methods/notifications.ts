/**
 * Notification Center Methods
 */

import type { AxiosInstance } from 'axios';
import type { AppNotification, ApiResponse } from '@thulobazaar/types';

interface PaginatedNotifications {
  data: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function createNotificationMethods(client: AxiosInstance) {
  return {
    async getNotifications(
      page: number = 1,
      limit: number = 20
    ): Promise<ApiResponse<PaginatedNotifications>> {
      const response = await client.get(
        `/api/notifications?page=${page}&limit=${limit}`
      );
      return response.data;
    },

    async getUnreadNotificationCount(): Promise<
      ApiResponse<{ count: number }>
    > {
      const response = await client.get('/api/notifications/unread-count');
      return response.data;
    },

    async markNotificationRead(id: number): Promise<ApiResponse<void>> {
      const response = await client.put(`/api/notifications/${id}/read`);
      return response.data;
    },

    async markAllNotificationsRead(): Promise<ApiResponse<void>> {
      const response = await client.put('/api/notifications/read-all');
      return response.data;
    },

    async deleteNotification(id: number): Promise<ApiResponse<void>> {
      const response = await client.delete(`/api/notifications/${id}`);
      return response.data;
    },
  };
}

/**
 * Editor Inbox API — the editor's OWN incoming alerts (new pending ad,
 * verification requested, support message, …). These are the same rows that
 * drive the native push notifications in the editor APK.
 *
 * Distinct from ./notifications, which is the broadcast composer (sending
 * announcements OUT to users).
 */

import type { AppNotification } from '@thulobazaar/types';
import { apiGet, apiPut, apiDelete } from './client';

interface InboxResponse {
  success: boolean;
  data: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export async function getInboxNotifications(page = 1, limit = 20): Promise<InboxResponse> {
  return apiGet<InboxResponse>(`/api/notifications?page=${page}&limit=${limit}`);
}

export async function getInboxUnreadCount(): Promise<UnreadCountResponse> {
  return apiGet<UnreadCountResponse>('/api/notifications/unread-count');
}

export async function markInboxNotificationRead(id: number): Promise<{ success: boolean }> {
  return apiPut(`/api/notifications/${id}/read`, {});
}

export async function markAllInboxNotificationsRead(): Promise<{ success: boolean }> {
  return apiPut('/api/notifications/read-all', {});
}

export async function deleteInboxNotification(id: number): Promise<{ success: boolean }> {
  return apiDelete(`/api/notifications/${id}`);
}

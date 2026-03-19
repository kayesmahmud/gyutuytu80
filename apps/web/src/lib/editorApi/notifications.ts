/**
 * Editor Notifications API
 * Broadcast, schedule, and manage admin notifications
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

interface BroadcastParams {
  title: string;
  body: string;
  type?: string;
  targetAudience?: 'all' | 'business' | 'individual';
  data?: Record<string, string>;
  imageUrl?: string;
}

interface BroadcastResponse {
  success: boolean;
  message: string;
  recipientCount: number;
}

export interface ScheduledNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  targetAudience: string;
  scheduledFor: string;
  status: string;
  sentAt: string | null;
  recipientCount: number | null;
  createdBy: string;
  createdAt: string;
}

interface ScheduleParams {
  title: string;
  body: string;
  scheduledFor: string;
  type?: string;
  targetAudience?: 'all' | 'business' | 'individual';
  data?: Record<string, string>;
  imageUrl?: string;
}

interface ScheduleResponse {
  success: boolean;
  data: ScheduledNotification;
}

interface ScheduledListResponse {
  success: boolean;
  data: ScheduledNotification[];
}

export async function broadcastNotification(params: BroadcastParams): Promise<BroadcastResponse> {
  return apiPost<BroadcastResponse>('/api/editor/notifications/broadcast', params);
}

export async function scheduleNotification(params: ScheduleParams): Promise<ScheduleResponse> {
  return apiPost<ScheduleResponse>('/api/editor/notifications/schedule', params);
}

export async function getScheduledNotifications(): Promise<ScheduledListResponse> {
  return apiGet<ScheduledListResponse>('/api/editor/notifications/scheduled');
}

export async function updateScheduledNotification(
  id: number,
  params: Partial<ScheduleParams>
): Promise<{ success: boolean }> {
  return apiPut(`/api/editor/notifications/scheduled/${id}`, params);
}

export async function deleteScheduledNotification(id: number): Promise<{ success: boolean }> {
  return apiDelete(`/api/editor/notifications/scheduled/${id}`);
}

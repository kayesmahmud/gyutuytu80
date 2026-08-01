/**
 * Ads API Functions
 */

import { apiRequest, buildQueryString } from './client';
import type { ApiResponse, Ad, GetAdsParams, ReportedAdsParams, ReportedAdsCount } from './types';

/**
 * Get ads with filters
 */
export async function getAds(
  params?: GetAdsParams,
  token?: string
): Promise<ApiResponse<Ad[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<Ad[]>>(`/api/editor/ads${queryString}`, { token });
}

/**
 * Approve an ad
 */
export async function approveAd(adId: number, token?: string): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/status`, {
    method: 'PUT',
    body: { status: 'approved' },
    token,
  });
}

/**
 * Reject an ad
 */
export async function rejectAd(
  adId: number,
  reason: string,
  token?: string
): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/status`, {
    method: 'PUT',
    body: { status: 'rejected', rejection_reason: reason },
    token,
  });
}

/**
 * Delete an ad (soft delete)
 */
export async function deleteAd(
  adId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}`, {
    method: 'DELETE',
    body: { reason },
    token,
  });
}

/**
 * Restore a soft-deleted ad
 */
export async function restoreAd(adId: number, token?: string): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/restore`, {
    method: 'POST',
    token,
  });
}

/**
 * Suspend an ad with reason and optional duration
 */
export async function suspendAd(
  adId: number,
  reason: string,
  duration?: number,
  token?: string
): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/suspend`, {
    method: 'POST',
    body: { reason, duration },
    token,
  });
}

/**
 * Unsuspend an ad
 */
export async function unsuspendAd(adId: number, token?: string): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/unsuspend`, {
    method: 'POST',
    token,
  });
}

/**
 * Permanently delete an ad (cannot be undone)
 */
export async function permanentDeleteAd(
  adId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/api/editor/ads/${adId}/permanent`, {
    method: 'DELETE',
    body: { reason },
    token,
  });
}

/**
 * A single entry in an ad's moderation history
 */
export interface AdHistoryEntry {
  id: number;
  action: string;
  actorId: number;
  actorType: string;
  actorName: string | null;
  actorEmail: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

/**
 * Get the full moderation history (who approved/rejected/suspended/etc.) for one ad
 */
export async function getAdHistory(
  adId: number,
  token?: string
): Promise<ApiResponse<AdHistoryEntry[]>> {
  return apiRequest<ApiResponse<AdHistoryEntry[]>>(`/api/editor/ads/${adId}/history`, { token });
}

/**
 * Snapshot of an ad BEFORE an owner edit was applied
 */
export interface AdEditSnapshot {
  title: string;
  description: string;
  price: number | string | null;
  category_id: number | null;
  location_id: number | null;
  condition: string | null;
  custom_fields: Record<string, unknown> | null;
  images: string[];
  status: string;
}

/**
 * One owner-edit version of an ad (Facebook-style version history)
 */
export interface AdEditHistoryEntry {
  id: number;
  ad_id: number;
  edited_by: number;
  previous_data: AdEditSnapshot | null;
  resulting_status: string;
  created_at: string;
  users: { id: number; full_name: string; business_name: string | null } | null;
}

/**
 * Owner edit row in the cross-ads recent feed (includes the ad + revoke state)
 */
export interface RecentOwnerEdit extends AdEditHistoryEntry {
  ads: { id: number; title: string; slug: string; status: string } | null;
  users: {
    id: number;
    full_name: string;
    business_name: string | null;
    direct_edit_revoked: boolean;
  } | null;
}

export interface RecentOwnerEditsParams {
  page?: number;
  limit?: number;
  resulting_status?: string;
}

/**
 * Get all owner-edit versions of one ad (newest first)
 */
export async function getAdEditHistory(
  adId: number,
  token?: string
): Promise<ApiResponse<AdEditHistoryEntry[]>> {
  return apiRequest<ApiResponse<AdEditHistoryEntry[]>>(
    `/api/editor/ads/${adId}/edit-history`,
    { token }
  );
}

/**
 * Get recent owner edits across all ads
 * resulting_status='approved' filters to edits that went live directly
 */
export async function getRecentOwnerEdits(
  params?: RecentOwnerEditsParams,
  token?: string
): Promise<ApiResponse<RecentOwnerEdit[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<RecentOwnerEdit[]>>(
    `/api/editor/ads/edit-history/recent${queryString}`,
    { token }
  );
}

/**
 * Get reported ads
 * Generic T allows callers to specify their own detailed type
 */
export async function getReportedAds<T = unknown>(
  token?: string,
  params?: ReportedAdsParams
): Promise<ApiResponse<T[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<T[]>>(`/api/editor/reported-ads${queryString}`, { token });
}

/**
 * Get pending reported ads count
 */
export async function getReportedAdsCount(token?: string): Promise<ApiResponse<ReportedAdsCount>> {
  return apiRequest<ApiResponse<ReportedAdsCount>>('/api/editor/reported-ads/count', { token });
}

/**
 * Dismiss a report (mark as false/invalid)
 */
export async function dismissReport(
  reportId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(`/api/editor/reports/${reportId}/dismiss`, {
    method: 'POST',
    body: { reason },
    token,
  });
}

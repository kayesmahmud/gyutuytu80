/**
 * Users API Functions
 */

import { apiRequest, buildQueryString } from './client';
import type { ApiResponse, User, GetUsersParams } from './types';

/**
 * Get users list with filters and pagination
 * Generic T allows callers to specify their own detailed type
 */
export async function getUsers<T = unknown>(
  token?: string,
  params?: GetUsersParams
): Promise<ApiResponse<T[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<T[]>>(`/api/editor/users${queryString}`, { token });
}

/**
 * Suspend user
 */
export async function suspendUser(
  userId: number,
  reason: string,
  duration?: number,
  token?: string
): Promise<ApiResponse<User>> {
  return apiRequest<ApiResponse<User>>(`/api/editor/users/${userId}/suspend`, {
    method: 'PUT',
    body: { reason, duration },
    token,
  });
}

/**
 * A user's direct-publish privilege state (returned by the direct-edit endpoint)
 */
export interface DirectEditPrivilege {
  id: number;
  full_name: string;
  business_name: string | null;
  direct_edit_revoked: boolean;
  direct_edit_revoked_at: string | null;
  direct_edit_revoke_reason: string | null;
}

/**
 * Revoke or restore a business user's direct-publish privilege
 * reason is REQUIRED when revoked=true
 */
export async function setDirectEditPrivilege(
  userId: number,
  revoked: boolean,
  reason?: string,
  token?: string
): Promise<ApiResponse<DirectEditPrivilege>> {
  return apiRequest<ApiResponse<DirectEditPrivilege>>(
    `/api/editor/users/${userId}/direct-edit`,
    {
      method: 'PUT',
      body: { revoked, reason },
      token,
    }
  );
}

/**
 * Unsuspend user
 */
export async function unsuspendUser(userId: number, token?: string): Promise<ApiResponse<User>> {
  return apiRequest<ApiResponse<User>>(`/api/editor/users/${userId}/unsuspend`, {
    method: 'PUT',
    token,
  });
}

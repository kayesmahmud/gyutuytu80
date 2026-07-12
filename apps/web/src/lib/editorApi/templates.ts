/**
 * Response Templates API Functions
 *
 * DB-backed editor response templates (unified with the support-ticket macros).
 * Every editor sees GLOBAL templates plus their own PRIVATE ones.
 */

import { apiRequest, buildQueryString } from './client';
import type { ApiResponse } from './types';

export type TemplateCategory = 'ad_rejection' | 'verification_rejection' | 'support' | 'suspension';
export type TemplateVisibility = 'global' | 'private';

export interface ApiTemplate {
  id: number;
  title: string;
  titleNe: string | null;
  content: string;
  contentNe: string | null;
  category: string;
  visibility: TemplateVisibility;
  usageCount: number;
  isActive: boolean;
  createdBy: number;
  createdByName: string;
  /** True when the current editor may edit/delete this template (creator or admin). */
  isOwner: boolean;
  createdAt: string | null;
}

export interface TemplateInput {
  title: string;
  titleNe?: string;
  content: string;
  contentNe?: string;
  category: string;
  visibility: TemplateVisibility;
}

export interface GetTemplatesParams {
  category?: string;
  search?: string;
}

/** List templates visible to the current editor (global + own). */
export async function getTemplates(
  params?: GetTemplatesParams,
  token?: string
): Promise<ApiResponse<ApiTemplate[]>> {
  return apiRequest<ApiResponse<ApiTemplate[]>>(
    `/api/editor/templates${buildQueryString(params)}`,
    { token }
  );
}

/** Create a template (global = shared with all editors, private = only you). */
export async function createTemplate(
  data: TemplateInput,
  token?: string
): Promise<ApiResponse<ApiTemplate>> {
  return apiRequest<ApiResponse<ApiTemplate>>('/api/editor/templates', {
    method: 'POST',
    body: data,
    token,
  });
}

/** Update a template. Only the creator or an admin may edit. */
export async function updateTemplate(
  id: number,
  data: Partial<TemplateInput>,
  token?: string
): Promise<ApiResponse<ApiTemplate>> {
  return apiRequest<ApiResponse<ApiTemplate>>(`/api/editor/templates/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

/** Delete a template. Only the creator or an admin may delete. */
export async function deleteTemplate(id: number, token?: string): Promise<ApiResponse<never>> {
  return apiRequest<ApiResponse<never>>(`/api/editor/templates/${id}`, {
    method: 'DELETE',
    token,
  });
}

/** Increment a template's usage count (call when it's copied/inserted). */
export async function incrementTemplateUsage(
  id: number,
  token?: string
): Promise<ApiResponse<{ usageCount: number }>> {
  return apiRequest<ApiResponse<{ usageCount: number }>>(`/api/editor/templates/${id}/use`, {
    method: 'POST',
    token,
  });
}

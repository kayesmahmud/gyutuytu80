/**
 * Verifications API Functions
 */

import { apiRequest, buildQueryString } from './client';
import type {
  ApiResponse,
  Verification,
  VerificationStatus,
  VerificationType,
  VerificationAction,
} from './types';

/**
 * Get verifications with optional filters
 * Uses Next.js API routes (relative URL) instead of Express backend
 */
export async function getVerifications(
  status: VerificationStatus = 'pending',
  type: VerificationType = 'all',
  token?: string,
  page?: number,
  limit?: number,
  search?: string
): Promise<ApiResponse<Verification[]>> {
  const queryString = buildQueryString({ status, type, page, limit, search });
  return apiRequest<ApiResponse<Verification[]>>(`/api/admin/verifications${queryString}`, {
    token,
    useRelativeUrl: true,
  });
}

/**
 * Get all pending verifications (legacy function for backwards compatibility)
 */
export async function getPendingVerifications(token?: string): Promise<ApiResponse<Verification[]>> {
  return getVerifications('pending', 'all', token);
}

/**
 * Generic verification action handler
 * Consolidates approve/reject logic for both business and individual verifications
 */
export async function handleVerificationAction(
  type: 'business' | 'individual',
  verificationId: number,
  action: VerificationAction,
  reason?: string,
  token?: string,
  /** approve only: corrected name the badge should carry (typo/capitalisation fixes) */
  correctedName?: string
): Promise<ApiResponse<unknown>> {
  const body =
    action === 'reject'
      ? { reason }
      : correctedName
        ? type === 'business'
          ? { businessName: correctedName }
          : { fullName: correctedName }
        : {};
  return apiRequest<ApiResponse<unknown>>(
    `/api/admin/verifications/${type}/${verificationId}/${action}`,
    {
      method: 'POST',
      body,
      token,
      useRelativeUrl: true,
    }
  );
}

// ============================================
// Backwards-compatible wrapper functions
// ============================================

export const approveBusinessVerification = (verificationId: number, correctedName?: string, token?: string) =>
  handleVerificationAction('business', verificationId, 'approve', undefined, token, correctedName);

export const rejectBusinessVerification = (verificationId: number, reason: string, token?: string) =>
  handleVerificationAction('business', verificationId, 'reject', reason, token);

export const approveIndividualVerification = (verificationId: number, correctedName?: string, token?: string) =>
  handleVerificationAction('individual', verificationId, 'approve', undefined, token, correctedName);

export const rejectIndividualVerification = (verificationId: number, reason: string, token?: string) =>
  handleVerificationAction('individual', verificationId, 'reject', reason, token);

// Legacy wrapper functions
export const reviewBusinessVerification = (
  verificationId: number,
  action: VerificationAction,
  reason?: string,
  token?: string
) => handleVerificationAction('business', verificationId, action, reason, token);

export const reviewIndividualVerification = (
  verificationId: number,
  action: VerificationAction,
  reason?: string,
  token?: string
) => handleVerificationAction('individual', verificationId, action, reason, token);

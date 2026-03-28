'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Verification, SuspendedUser, VerificationStats, TabType } from './types';

const ITEMS_PER_PAGE = 20;

export function useVerifications() {
  const [pendingVerifications, setPendingVerifications] = useState<Verification[]>([]);
  const [verifiedBusiness, setVerifiedBusiness] = useState<Verification[]>([]);
  const [verifiedIndividual, setVerifiedIndividual] = useState<Verification[]>([]);
  const [suspendedRejected, setSuspendedRejected] = useState<SuspendedUser[]>([]);
  const [verificationStats, setVerificationStats] = useState<VerificationStats>({
    pending: 0,
    verifiedBusiness: 0,
    verifiedIndividual: 0,
    suspendedRejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVerificationStats = async () => {
    const res = await fetch('/api/super-admin/verification-stats', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
    return res.json();
  };

  const fetchVerifiedList = async (type: 'business' | 'individual', page: number, search: string) => {
    const params = new URLSearchParams({
      type,
      page: String(page),
      limit: String(ITEMS_PER_PAGE),
    });
    if (search) params.set('search', search);
    const res = await fetch(`/api/super-admin/verification-list?${params}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`List fetch failed: ${res.status}`);
    return res.json();
  };

  const loadStats = useCallback(async () => {
    try {
      const statsRes = await fetchVerificationStats();
      if (statsRes?.success && statsRes.data) {
        setVerificationStats(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to load verification stats:', error);
    }
  }, []);

  const loadTabData = useCallback(async (tab: TabType, page: number = 1, search: string = '') => {
    try {
      setLoading(true);

      if (tab === 'pending') {
        const pendingRes = await apiClient.getVerificationsByStatus('pending', 'all');
        if (pendingRes.success && pendingRes.data) {
          const allPending = pendingRes.data.map((item: any) => ({
            ...item,
            type: item.business_name ? 'business' : 'individual',
          }));
          // Client-side pagination for pending (Express API doesn't support it yet)
          const start = (page - 1) * ITEMS_PER_PAGE;
          setPendingVerifications(allPending.slice(start, start + ITEMS_PER_PAGE));
          setTotalPages(Math.ceil(allPending.length / ITEMS_PER_PAGE) || 1);
        }
      } else if (tab === 'verified-business') {
        const businessRes = await fetchVerifiedList('business', page, search);
        if (businessRes?.success && businessRes.data) {
          setVerifiedBusiness(
            businessRes.data.map((item: any) => ({ ...item, type: 'business' }))
          );
          setTotalPages(businessRes.pagination?.totalPages || 1);
        }
      } else if (tab === 'verified-individual') {
        const individualRes = await fetchVerifiedList('individual', page, search);
        if (individualRes?.success && individualRes.data) {
          setVerifiedIndividual(
            individualRes.data.map((item: any) => ({ ...item, type: 'individual' }))
          );
          setTotalPages(individualRes.pagination?.totalPages || 1);
        }
      } else if (tab === 'suspended-rejected') {
        const suspendedRes = await apiClient.getSuspendedRejectedUsers({
          limit: ITEMS_PER_PAGE,
          page,
          search,
        });
        if (suspendedRes.success && suspendedRes.data) {
          setSuspendedRejected(suspendedRes.data);
          // If the API returns pagination info, use it
          const pagination = (suspendedRes as any).pagination;
          setTotalPages(pagination?.totalPages || 1);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading verifications:', error);
      setLoading(false);
    }
  }, []);

  return {
    pendingVerifications,
    verifiedBusiness,
    verifiedIndividual,
    suspendedRejected,
    verificationStats,
    loading,
    totalPages,
    loadStats,
    loadTabData,
  };
}

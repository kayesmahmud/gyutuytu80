'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import {
  getDashboardData,
  getEditorProfile,
  getSupportChatCount,
} from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/navigation';
import type { DashboardStats, MyWorkToday, BadgeCounts, SystemAlert, QuickActionConfig } from './types';
import { DEFAULT_STATS, DEFAULT_MY_WORK, DEFAULT_BADGE_COUNTS } from './types';

export interface UseEditorDashboardReturn {
  // Auth
  staff: ReturnType<typeof useStaffAuth>['staff'];
  navSections: ReturnType<typeof getEditorNavSections>;
  handleLogout: () => Promise<void>;

  // Data
  stats: DashboardStats | null;
  myWorkToday: MyWorkToday;
  badgeCounts: BadgeCounts;
  loading: boolean;
  avatarUrl: string | null;
  lastLogin: string | null;
  systemAlert: SystemAlert | null;
  notificationCount: number;
  avgResponseTimeTrendText: string;
  quickActions: QuickActionConfig[];
  handleExportReport: () => void;
}

export function useEditorDashboard(lang: string): UseEditorDashboardReturn {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>(DEFAULT_BADGE_COUNTS);
  const [myWorkToday, setMyWorkToday] = useState<MyWorkToday>(DEFAULT_MY_WORK);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<SystemAlert | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [avgResponseTimeTrendText, setAvgResponseTimeTrendText] = useState('No change');

  const navSections = useMemo(() => getEditorNavSections(lang, badgeCounts), [lang, badgeCounts]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  const loadDashboardData = useCallback(async () => {
    try {
      // 2 parallel requests instead of 11 sequential ones
      const [dashboardResponse, profileResponse] = await Promise.all([
        getDashboardData().catch(() => null),
        getEditorProfile().catch(() => null),
      ]);

      // Process profile (avatar + last login)
      if (profileResponse?.success) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        if (profileResponse.data.avatar) {
          setAvatarUrl(`${apiBase}/uploads/avatars/${profileResponse.data.avatar}`);
        }
        const sessionLastLogin = (staff as any)?.lastLogin;
        const profileLastLogin = profileResponse.data.lastLogin;
        setLastLogin(sessionLastLogin || profileLastLogin || null);
      } else if ((staff as any)?.lastLogin) {
        setLastLogin((staff as any).lastLogin);
      }

      // Process combined dashboard data
      if (dashboardResponse?.success) {
        const d = dashboardResponse.data;

        setStats({
          ...d.stats,
          avgResponseTime: d.stats.avgResponseTime,
          pendingChange: d.stats.pendingChange,
          verificationsChange: d.stats.verificationsChange,
        });

        setBadgeCounts(d.badgeCounts);
        setNotificationCount(d.notifications.count);
        setMyWorkToday(d.myWorkToday);
        setAvgResponseTimeTrendText(d.avgResponseTimeTrend.formattedText);

        if (d.systemAlert) {
          setSystemAlert({
            message: d.systemAlert.message,
            type: d.systemAlert.type === 'danger' ? 'error' : d.systemAlert.type as SystemAlert['type'],
          });
        }
      } else {
        setStats(DEFAULT_STATS);
      }
    } catch (error) {
      console.warn('[Dashboard] Failed to load dashboard data:', error);
      setStats(DEFAULT_STATS);
    }

    setLoading(false);
  }, [staff]);

  // Socket Integration for Real-time Badges
  const handleTicketUpdated = useCallback(() => {
    // Refresh the support chat count when any ticket activity happens
    getSupportChatCount()
      .then((res) => {
        if (res.success) {
          setBadgeCounts((prev) => ({
            ...prev,
            supportChat: res.data.count
          }));
        }
      })
      .catch(() => { });
  }, []);

  const handleNewMessage = useCallback(() => {
    // Also refresh on new message 
    getSupportChatCount()
      .then((res) => {
        if (res.success) {
          setBadgeCounts((prev) => ({
            ...prev,
            supportChat: res.data.count
          }));
        }
      })
      .catch(() => { });
  }, []);

  const token = (staff as any)?.backendToken;

  useSupportSocket({
    token: token,
    isStaff: true,
    onTicketUpdated: handleTicketUpdated,
    onNewMessage: handleNewMessage,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }

    loadDashboardData();
  }, [authLoading, staff, isEditor, lang, router, loadDashboardData]);

  const handleExportReport = useCallback(() => {
    const rows: string[][] = [
      ['Metric', 'Value'],
      ['Pending Ads', String(stats?.pendingAds ?? 0)],
      ['Pending Verifications', String(stats?.pendingVerifications ?? 0)],
      ['Avg Response Time', stats?.avgResponseTime ?? 'N/A'],
      ['Ads Approved Today', String(myWorkToday.adsApprovedToday)],
      ['Ads Rejected Today', String(myWorkToday.adsRejectedToday)],
      ['Ads Edited Today', String(myWorkToday.adsEditedToday)],
      ['Business Verifications Today', String(myWorkToday.businessVerificationsToday)],
      ['Individual Verifications Today', String(myWorkToday.individualVerificationsToday)],
      ['Support Tickets Today', String(myWorkToday.supportTicketsAssigned)],
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `editor-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, myWorkToday]);

  const quickActions: QuickActionConfig[] = useMemo(
    () => [
      {
        icon: '📢',
        label: 'Review Ads',
        color: 'primary',
        badge: badgeCounts.pendingAds,
        onClick: () => router.push(`/${lang}/editor/ad-management`),
      },
      {
        icon: '🏢',
        label: 'Business Verification',
        color: 'success',
        badge: badgeCounts.businessVerifications,
        onClick: () => router.push(`/${lang}/editor/business-verification`),
      },
      {
        icon: '🪪',
        label: 'Individual Verification',
        color: 'success',
        badge: badgeCounts.individualVerifications,
        onClick: () => router.push(`/${lang}/editor/individual-verification`),
      },
      {
        icon: '🚩',
        label: 'Reported Content',
        color: 'warning',
        badge: badgeCounts.reportedAds,
        onClick: () => router.push(`/${lang}/editor/reported-ads`),
      },
      {
        icon: '💬',
        label: 'Support Chat',
        color: 'primary',
        badge: badgeCounts.supportChat,
        onClick: () => router.push(`/${lang}/editor/support-chat`),
      },
    ],
    [lang, badgeCounts, router]
  );

  return {
    staff,
    navSections,
    handleLogout,
    stats,
    myWorkToday,
    badgeCounts,
    loading: authLoading || loading,
    avatarUrl,
    lastLogin,
    systemAlert,
    notificationCount,
    avgResponseTimeTrendText,
    quickActions,
    handleExportReport,
  };
}

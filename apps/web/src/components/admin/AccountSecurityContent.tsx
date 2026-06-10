'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { TwoFactorSection } from '@/components/profile/TwoFactorSection';

/**
 * Self-service account security for staff (editor / super-admin).
 * Fetches the signed-in staff member's 2FA status via /api/profile, then reuses
 * the same TwoFactorSection the regular-user profile uses. The underlying
 * /api/auth/2fa/* proxy routes are role-agnostic (they act on req.user), so this
 * works for any authenticated account that has a password.
 */
export function AccountSecurityContent() {
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiClient.getMe();
        if (active && res.success && res.data) {
          const data = res.data as { twoFactorEnabled?: boolean; hasPassword?: boolean };
          setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
          setHasPassword(data.hasPassword !== false);
        }
      } catch (error) {
        console.error('Failed to load account security status:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-2xl">
      <TwoFactorSection initialEnabled={twoFactorEnabled} canManage={hasPassword} />
    </div>
  );
}

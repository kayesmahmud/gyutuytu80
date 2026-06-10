'use client';

import { use, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/admin';
import { AccountSecurityContent } from '@/components/admin/AccountSecurityContent';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';

export default function SuperAdminAccountPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${params.lang}/super-admin/login`);
    }
  }, [authLoading, staff, isSuperAdmin, router, params.lang]);

  if (authLoading || !staff || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Admin'}
      userEmail={staff?.email || ''}
      navSections={getSuperAdminNavSections(params.lang)}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-indigo-600" />
            Account Security
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Protect your super-admin account with two-factor authentication
          </p>
        </div>
        <AccountSecurityContent />
      </div>
    </DashboardLayout>
  );
}

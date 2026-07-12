'use client';

import { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/admin';
import { AccountSecurityContent } from '@/components/admin/AccountSecurityContent';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/navigation';

export default function EditorAccountPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, logout } = useStaffAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor'}
      userEmail={staff?.email || ''}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-600" />
            Account Security
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Protect your editor account with two-factor authentication
          </p>
        </div>
        <AccountSecurityContent />
      </div>
    </DashboardLayout>
  );
}

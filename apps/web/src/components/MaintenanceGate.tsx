'use client';

import { usePathname } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { MaintenancePage } from './MaintenancePage';

interface MaintenanceGateProps {
  isMaintenanceMode: boolean;
  lang: string;
  children: React.ReactNode;
}

/** Paths that staff must be able to reach even during maintenance (to log in) */
const EXEMPT_PATHS = [
  '/super-admin/login',
  '/editor/login',
  '/auth/signin',
];

export function MaintenanceGate({ isMaintenanceMode, lang, children }: MaintenanceGateProps) {
  const pathname = usePathname();
  const { staff } = useStaffAuth();

  // Not in maintenance → render normally
  if (!isMaintenanceMode) return <>{children}</>;

  // Always allow login pages so staff can authenticate
  const isExempt = EXEMPT_PATHS.some((p) => pathname.includes(p));
  if (isExempt) return <>{children}</>;

  // Staff (super_admin or editor) can browse the full site
  const isStaff = staff && ['super_admin', 'editor'].includes(staff.role);
  if (isStaff) return <>{children}</>;

  // Everyone else sees the maintenance page
  return <MaintenancePage />;
}

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Watches the NextAuth session for RefreshAccessTokenError.
 * When the backend token refresh fails, this auto-signs out the user
 * instead of leaving them in a dead session where API calls silently fail.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      console.log('🔐 [SessionGuard] Token refresh failed — signing out');
      // Staff go back to their own login page, not the consumer sign-in.
      const role = (session?.user as any)?.role;
      const callbackUrl =
        role === 'super_admin' ? '/en/super-admin/login'
        : role === 'editor' ? '/en/editor/login'
        : '/en/auth/signin';
      signOut({ redirect: true, callbackUrl });
    }
  }, [session]);

  return <>{children}</>;
}

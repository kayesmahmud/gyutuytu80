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
      signOut({ redirect: true, callbackUrl: '/en/auth/signin' });
    }
  }, [session]);

  return <>{children}</>;
}

// @ts-nocheck
import { createApiClient } from '@thulobazaar/api-client';
import { getSession, signOut } from 'next-auth/react';

/**
 * API Client instance for the Next.js web app
 * This uses the shared @thulobazaar/api-client package
 *
 * baseURL points to the Express backend for API calls
 * Editor/admin routes like /api/editor/* are on the Express backend
 */
export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',

  // Get auth token from NextAuth session (client-side only)
  getAuthToken: async () => {
    if (typeof window === 'undefined') return null;

    try {
      const session = await getSession();

      // If the token refresh failed, sign out immediately
      if ((session as any)?.error === 'RefreshAccessTokenError') {
        signOut({ redirect: true, callbackUrl: '/en/auth/signin' });
        return null;
      }

      return session?.user?.backendToken || null;
    } catch (error) {
      console.error('Failed to get session token:', error);
      return null;
    }
  },

  // Handle unauthorized access — try refreshing the session before signing out
  onUnauthorized: async () => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname.includes('/auth/signin')) return;

    // Try refreshing the session (triggers NextAuth jwt callback which attempts token refresh)
    try {
      const session = await getSession();
      if (session?.user?.backendToken && (session as any)?.error !== 'RefreshAccessTokenError') {
        // Session refreshed successfully — the next request will use the new token
        return;
      }
    } catch {
      // Refresh failed
    }

    console.log('🔐 [API] Unauthorized - signing out and redirecting to signin');
    signOut({ redirect: true, callbackUrl: '/en/auth/signin' });
  },
});

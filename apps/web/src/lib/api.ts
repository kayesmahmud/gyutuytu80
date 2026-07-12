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
// Staff (editor/super-admin) and consumers use different login pages. Redirect
// a signed-out user back to the login that matches where they were, so an
// editor logging out doesn't get bounced to the consumer sign-in page.
function loginRedirectPath(): string {
  if (typeof window === 'undefined') return '/en/auth/signin';
  const path = window.location.pathname;
  const langMatch = path.match(/^\/([a-z]{2})(?:\/|$)/);
  const lang = langMatch ? langMatch[1] : 'en';
  if (/\/super-admin(\/|$)/.test(path)) return `/${lang}/super-admin/login`;
  if (/\/editor(\/|$)/.test(path)) return `/${lang}/editor/login`;
  return '/en/auth/signin';
}

// Already on any login page → don't redirect (avoids loops during logout).
function isOnLoginPage(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path.includes('/auth/signin') || /\/(editor|super-admin)\/login(\/|$)/.test(path);
}

export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',

  // Get auth token from NextAuth session (client-side only)
  getAuthToken: async () => {
    if (typeof window === 'undefined') return null;

    try {
      const session = await getSession();

      // If the token refresh failed, sign out immediately
      if ((session as any)?.error === 'RefreshAccessTokenError') {
        if (!isOnLoginPage()) signOut({ redirect: true, callbackUrl: loginRedirectPath() });
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
    if (isOnLoginPage()) return;

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

    console.log('🔐 [API] Unauthorized - signing out and redirecting to login');
    signOut({ redirect: true, callbackUrl: loginRedirectPath() });
  },
});

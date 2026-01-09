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
      return session?.user?.backendToken || null;
    } catch (error) {
      console.error('Failed to get session token:', error);
      return null;
    }
  },

  // Handle unauthorized access - use signOut to properly clear session
  // This prevents redirect loops by clearing NextAuth session before redirecting
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;

    // Don't redirect if already on signin page (prevent loops)
    if (window.location.pathname.includes('/auth/signin')) return;

    console.log('🔐 [API] Unauthorized - signing out and redirecting to signin');
    // Use NextAuth signOut to properly clear the session before redirecting
    signOut({ redirect: true, callbackUrl: '/en/auth/signin' });
  },
});

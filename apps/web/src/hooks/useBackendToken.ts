/**
 * useBackendToken Hook
 * Fetches and caches the backend JWT token for API calls
 * This bypasses NextAuth session storage issues
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function useBackendToken() {
  const { data: session } = useSession();
  const [backendToken, setBackendToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBackendToken() {
      // First, try to get token from session (if NextAuth worked).
      // Staff sessions (editor panel) carry it on session.user instead.
      const sessionToken =
        (session as any)?.backendToken || (session as any)?.user?.backendToken;
      if (sessionToken) {
        setBackendToken(sessionToken);
        localStorage.setItem('backend_jwt_token', sessionToken);
        setLoading(false);
        return;
      }

      // If no session token, check localStorage cache
      const cachedToken = localStorage.getItem('backend_jwt_token');
      if (cachedToken) {
        setBackendToken(cachedToken);
        setLoading(false);
        return;
      }

      // If still no token and user is logged in, fetch via secured API route
      // (session cookie is sent automatically for same-origin requests)
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
          });

          if (response.ok) {
            const data = await response.json();
            const token = data.data?.token || data.token;

            if (token) {
              setBackendToken(token);
              localStorage.setItem('backend_jwt_token', token);
              setError(null);
              setLoading(false);
              return;
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.warn('⚠️ [useBackendToken] Error fetching token:', message);
          setError(message);
        }
      }

      setLoading(false);
    }

    if (session) {
      fetchBackendToken();
    } else {
      setLoading(false);
    }
  }, [session]);

  // Clear token on logout
  useEffect(() => {
    if (!session) {
      localStorage.removeItem('backend_jwt_token');
      setBackendToken(null);
    }
  }, [session]);

  return { backendToken, loading, error };
}

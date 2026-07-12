'use client';

import { useEffect } from 'react';
import { apiPost, getBackendToken } from '@/lib/editorApi/client';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

// Injected by the native Android WebView wrapper (see apps/editor-android).
// Absent in a normal desktop browser, where this component is a no-op.
declare global {
  interface Window {
    __FCM_TOKEN__?: string;
    AndroidBridge?: { getFcmToken?: () => string | null };
  }
}

function readNativeToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.__FCM_TOKEN__ || window.AndroidBridge?.getFcmToken?.() || null;
}

/**
 * Registers the editor APK's FCM device token with the backend once the editor
 * is authenticated, so this phone receives push notifications. The token is
 * stored under the logged-in editor's user id via the existing
 * POST /api/users/fcm-token endpoint (auth is automatic through getBackendToken).
 *
 * No-op outside the native wrapper (no injected token) and until login.
 */
export function NativeFcmBridge() {
  const { isAuthenticated } = useStaffAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const register = async () => {
      const fcmToken = readNativeToken();
      if (!fcmToken) return; // not running inside the editor APK

      const backendToken = await getBackendToken();
      if (!backendToken || cancelled) return;

      try {
        await apiPost('/api/users/fcm-token', { fcmToken, platform: 'android' });
      } catch (err) {
        console.error('FCM token registration failed:', err);
      }
    };

    register();

    // Native re-dispatches this event when the FCM token refreshes.
    const onRefresh = () => register();
    window.addEventListener('fcm-token', onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener('fcm-token', onRefresh);
    };
  }, [isAuthenticated]);

  return null;
}

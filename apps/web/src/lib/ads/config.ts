/**
 * Centralized Google AdSense Configuration
 *
 * Ad slot IDs and the AdSense client ID are managed from the admin panel
 * (Super Admin > Settings > Google Ads tab) and served via /api/ad-config.
 *
 * Fallback: env vars NEXT_PUBLIC_ADSENSE_CLIENT_ID and NEXT_PUBLIC_ADS_ENABLED
 * are used if the API hasn't been called yet or fails.
 */

// Ad size configurations
export const adSizes = {
  // Horizontal banners
  leaderboard: { width: 728, height: 90, label: '728×90' },
  mobileBanner: { width: 320, height: 100, label: '320×100' },
  largeBanner: { width: 970, height: 90, label: '970×90' },

  // Vertical banners (sidebars)
  skyscraper: { width: 160, height: 600, label: '160×600' },
  wideSkyscraper: { width: 300, height: 600, label: '300×600' },

  // Rectangle banners (in-content)
  mediumRectangle: { width: 300, height: 250, label: '300×250' },
  largeRectangle: { width: 336, height: 280, label: '336×280' },
  halfPage: { width: 300, height: 600, label: '300×600' },

  // Square banners
  square: { width: 250, height: 250, label: '250×250' },
} as const;

// Default slot IDs — overridden at runtime by fetchAdConfig()
export let adSlots: Record<string, string> = {
  adDetailTop: '',
  adDetailTopMobile: '',
  adDetailLeft: '',
  adDetailRight: '',
  adDetailBottom: '',
  homeHeroBanner: '',
  homeHeroBannerMobile: '',
  homeLeft: '',
  homeRight: '',
  homeInFeed: '',
  homeBottom: '',
  adsListingTop: '',
  adsListingTopMobile: '',
  adsListingSidebar: '',
  adsListingInFeed: '',
  adsListingBottom: '',
  searchTop: '',
  searchTopMobile: '',
  searchSidebar: '',
  searchInResults: '',
  searchBottom: '',
  dashboardSidebar: '',
  profileSidebar: '',
};

// Type definitions
export type AdSize = keyof typeof adSizes;
export type AdSlot = keyof typeof adSlots;

// ── Remote config cache ───────────────────────────────────────────────

interface AdConfigResponse {
  enabled: boolean;
  web: {
    clientId: string;
    slots: Record<string, string>;
  };
  mobile: {
    android: { appId: string; bannerUnitId: string };
    ios: { appId: string; bannerUnitId: string };
  };
}

let _remoteConfig: AdConfigResponse | null = null;
let _fetchPromise: Promise<AdConfigResponse | null> | null = null;

/**
 * Fetch ad configuration from /api/ad-config.
 * Caches the result in memory. Safe to call multiple times.
 */
export async function fetchAdConfig(): Promise<AdConfigResponse | null> {
  if (_remoteConfig) return _remoteConfig;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const res = await fetch(`${baseUrl}/api/ad-config`, { next: { revalidate: 300 } });
      if (!res.ok) return null;
      const data: AdConfigResponse = await res.json();
      _remoteConfig = data;

      // Hydrate adSlots from remote
      if (data.web?.slots) {
        for (const [key, value] of Object.entries(data.web.slots)) {
          if (value) {
            adSlots[key] = value;
          }
        }
      }

      return data;
    } catch {
      return null;
    } finally {
      _fetchPromise = null;
    }
  })();

  return _fetchPromise;
}

// Main configuration object
export const adsConfig = {
  // AdSense Publisher ID — remote config takes priority over env var
  get clientId(): string {
    return _remoteConfig?.web?.clientId || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';
  },

  // Master switch — remote config takes priority
  get enabled(): boolean {
    if (_remoteConfig) {
      return _remoteConfig.enabled && Boolean(this.clientId);
    }
    // Fallback to env vars
    const envEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    const hasClientId = Boolean(this.clientId);
    return envEnabled && isProduction && hasClientId;
  },

  get showPlaceholder(): boolean {
    return process.env.NODE_ENV === 'development';
  },

  getSize(size: AdSize) {
    return adSizes[size];
  },

  getSlotId(slot: AdSlot): string {
    return adSlots[slot] || '';
  },

  sizes: adSizes,
  slots: adSlots,
};

export default adsConfig;

import { notFound } from 'next/navigation';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Header, Footer, BottomNav } from '@/components/layout';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { MaintenanceGate } from '@/components/MaintenanceGate';
import { prisma } from '@thulobazaar/database';
import GoogleAdSense from '@/components/ads/GoogleAdSense';
import { AdConfigProvider, type AdConfig } from '@/contexts/AdConfigContext';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import AppStoreBanner from '@/components/pwa/AppStoreBanner';
import { GlobalJsonLd } from '@/components/seo/GlobalJsonLd';

// Force dynamic rendering for all pages — Prisma, next-intl, and auth contexts
// don't work during static prerendering in the Docker build environment.
export const dynamic = 'force-dynamic';

// Viewport configuration (separate from metadata in Next.js 15+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366f1',
};

// App store constants
const APP_STORE_ID = '6774762315';
const PLAY_STORE_ID = 'com.thulobazaar.mobile';

const supportedLanguages = ['en', 'ne'] as const;
type SupportedLanguage = typeof supportedLanguages[number];

export async function generateStaticParams() {
  return supportedLanguages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  // Fetch site settings from DB for SEO metadata
  let siteName = 'Thulo Bazaar';
  let siteDescription = "Nepal's Leading Classifieds Marketplace";
  try {
    const settings = await prisma.site_settings.findMany({
      where: { setting_key: { in: ['site_name', 'site_description'] } },
      select: { setting_key: true, setting_value: true },
    });
    for (const s of settings) {
      if (s.setting_key === 'site_name' && s.setting_value) siteName = s.setting_value;
      if (s.setting_key === 'site_description' && s.setting_value) siteDescription = s.setting_value;
    }
  } catch {
    // Fall back to defaults
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';

  return {
    title: `${siteName} - Buy & Sell Everything`,
    description: lang === 'ne'
      ? 'नेपालको अग्रणी क्लासिफाइड मार्केटप्लेस'
      : siteDescription,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteName,
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/icons/apple-touch-icon.png',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages: {
        en: `${baseUrl}/en`,
        ne: `${baseUrl}/ne`,
      },
    },
    openGraph: {
      siteName,
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    // Native app metadata
    ...(APP_STORE_ID ? {
      itunes: {
        appId: APP_STORE_ID,
        appArgument: `${baseUrl}/${lang}`,
      },
    } : {}),
    appLinks: {
      ios: APP_STORE_ID ? {
        app_store_id: APP_STORE_ID,
        url: `${baseUrl}/${lang}`,
        app_name: 'Thulo Bazaar',
      } : undefined,
      android: {
        package: PLAY_STORE_ID,
        url: `${baseUrl}/${lang}`,
        app_name: 'Thulo Bazaar',
      },
      web: {
        url: `${baseUrl}/${lang}`,
        should_fallback: true,
      },
    },
    other: {
      'google-play-app': `app-id=${PLAY_STORE_ID}`,
    },
  };
}

export default async function LanguageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validate language
  if (!supportedLanguages.includes(lang as SupportedLanguage)) {
    notFound();
  }

  // Enable next-intl for this locale
  setRequestLocale(lang);

  // Fetch messages, maintenance mode, and ad config in parallel
  const [messages, maintenanceSetting, adSettings] = await Promise.all([
    getMessages(),
    prisma.site_settings.findUnique({
      where: { setting_key: 'maintenance_mode' },
      select: { setting_value: true },
    }).catch(() => null),
    prisma.site_settings.findMany({
      where: {
        setting_key: {
          in: [
            'google_ads_enabled', 'adsense_client_id',
            'ad_slot_home_hero_banner', 'ad_slot_home_hero_banner_mobile',
            'ad_slot_home_left', 'ad_slot_home_right', 'ad_slot_home_in_feed', 'ad_slot_home_bottom',
            'ad_slot_ad_detail_top', 'ad_slot_ad_detail_top_mobile',
            'ad_slot_ad_detail_left', 'ad_slot_ad_detail_right', 'ad_slot_ad_detail_bottom',
            'ad_slot_ads_listing_top', 'ad_slot_ads_listing_top_mobile',
            'ad_slot_ads_listing_sidebar', 'ad_slot_ads_listing_in_feed', 'ad_slot_ads_listing_bottom',
            'ad_slot_search_top', 'ad_slot_search_top_mobile',
            'ad_slot_search_sidebar', 'ad_slot_search_in_results', 'ad_slot_search_bottom',
            'ad_slot_dashboard_sidebar', 'ad_slot_profile_sidebar',
          ],
        },
      },
      select: { setting_key: true, setting_value: true },
    }).catch(() => []),
  ]);

  const isMaintenanceMode = maintenanceSetting?.setting_value === 'true';

  // Build ad config from DB settings
  const adMap: Record<string, string> = {};
  for (const s of adSettings) {
    adMap[s.setting_key] = s.setting_value || '';
  }
  const adConfig: AdConfig = {
    enabled: adMap.google_ads_enabled === 'true',
    clientId: adMap.adsense_client_id || '',
    slots: {
      homeHeroBanner: adMap.ad_slot_home_hero_banner || '',
      homeHeroBannerMobile: adMap.ad_slot_home_hero_banner_mobile || '',
      homeLeft: adMap.ad_slot_home_left || '',
      homeRight: adMap.ad_slot_home_right || '',
      homeInFeed: adMap.ad_slot_home_in_feed || '',
      homeBottom: adMap.ad_slot_home_bottom || '',
      adDetailTop: adMap.ad_slot_ad_detail_top || '',
      adDetailTopMobile: adMap.ad_slot_ad_detail_top_mobile || '',
      adDetailLeft: adMap.ad_slot_ad_detail_left || '',
      adDetailRight: adMap.ad_slot_ad_detail_right || '',
      adDetailBottom: adMap.ad_slot_ad_detail_bottom || '',
      adsListingTop: adMap.ad_slot_ads_listing_top || '',
      adsListingTopMobile: adMap.ad_slot_ads_listing_top_mobile || '',
      adsListingSidebar: adMap.ad_slot_ads_listing_sidebar || '',
      adsListingInFeed: adMap.ad_slot_ads_listing_in_feed || '',
      adsListingBottom: adMap.ad_slot_ads_listing_bottom || '',
      searchTop: adMap.ad_slot_search_top || '',
      searchTopMobile: adMap.ad_slot_search_top_mobile || '',
      searchSidebar: adMap.ad_slot_search_sidebar || '',
      searchInResults: adMap.ad_slot_search_in_results || '',
      searchBottom: adMap.ad_slot_search_bottom || '',
      dashboardSidebar: adMap.ad_slot_dashboard_sidebar || '',
      profileSidebar: adMap.ad_slot_profile_sidebar || '',
    },
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <SiteSettingsProvider>
        <AdConfigProvider config={adConfig}>
          <MaintenanceGate isMaintenanceMode={isMaintenanceMode} lang={lang}>
            <ServiceWorkerRegister />
            <InstallPrompt />      {/* Desktop PWA install */}
            <AppStoreBanner />     {/* Mobile App Store/Play Store redirect */}
            <GoogleAdSense enabled={adConfig.enabled} clientId={adConfig.clientId} />
            <GlobalJsonLd lang={lang} />
            <Header lang={lang} />
            <div className="pb-20 lg:pb-0">
              {children}
            </div>
            <Footer lang={lang} />
            <BottomNav lang={lang} />
          </MaintenanceGate>
        </AdConfigProvider>
      </SiteSettingsProvider>
    </NextIntlClientProvider>
  );
}

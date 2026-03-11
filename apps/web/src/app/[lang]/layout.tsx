import { notFound } from 'next/navigation';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Header, Footer, BottomNav } from '@/components/layout';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { prisma } from '@thulobazaar/database';
import GoogleAdSense from '@/components/ads/GoogleAdSense';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import AppStoreBanner from '@/components/pwa/AppStoreBanner';

// Layout renders per-request; individual pages control their own caching strategy.
// Pages using searchParams or auth auto-opt into dynamic rendering.
// Static/semi-static pages should set: export const revalidate = N

// Viewport configuration (separate from metadata in Next.js 15+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366f1',
};

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
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/icons/apple-touch-icon.png',
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
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SiteSettingsProvider>
        <ServiceWorkerRegister />
        <InstallPrompt />      {/* Desktop PWA install */}
        <AppStoreBanner />     {/* Mobile App Store/Play Store redirect */}
        <GoogleAdSense />
        <Header lang={lang} />
        <div className="pb-20 lg:pb-0">
          {children}
        </div>
        <Footer lang={lang} />
        <BottomNav lang={lang} />
      </SiteSettingsProvider>
    </NextIntlClientProvider>
  );
}

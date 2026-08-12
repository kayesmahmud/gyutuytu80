import {
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
} from '@/lib/utils/structuredData';

const BASE_URL = 'https://thulobazaar.com.np';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.thulobazaar.mobile';
const APP_STORE_URL = 'https://apps.apple.com/us/app/thulo-bazaar/id6774762315';

// Keep in sync with the footer — these are the profiles Google uses to tie the
// site to the same entity across the web.
const SOCIAL_PROFILES = [
  'https://facebook.com/thulobazaar',
  'https://instagram.com/thulobazaar',
  'https://tiktok.com/@thulobazaar',
  'https://youtube.com/thulobazaar',
  PLAY_STORE_URL,
  APP_STORE_URL,
];

export function GlobalJsonLd({ lang }: { lang: string }) {
  const orgData = generateOrganizationStructuredData({
    name: 'Thulo Bazaar',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: "Nepal's Leading Classifieds Marketplace - Buy & Sell Everything",
    sameAs: SOCIAL_PROFILES,
  });

  const websiteData = generateWebsiteStructuredData({
    name: 'Thulo Bazaar',
    url: BASE_URL,
    description: "Nepal's Leading Classifieds Marketplace",
    searchUrl: `${BASE_URL}/${lang}/ads?search={search_term_string}`,
  });

  const mobileAppData = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Thulo Bazaar',
    description: "Nepal's Leading Classifieds Marketplace - Buy & Sell on the go",
    operatingSystem: 'Android, iOS',
    applicationCategory: 'ShoppingApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NPR',
    },
    // No aggregateRating here on purpose. Self-declared ratings we can't tie to
    // a real review source are a spam-policy risk (manual action affects the
    // whole domain) and earn no rich result. If you want one back, pull the live
    // Play Store / App Store figures — don't hardcode a number.
    image: `${BASE_URL}/logo.png`,
    url: `${BASE_URL}/${lang}`,
    installUrl: PLAY_STORE_URL,
    ...(APP_STORE_URL ? { additionalProperty: {
      '@type': 'PropertyValue',
      name: 'App Store URL',
      value: APP_STORE_URL,
    }} : {}),
    author: {
      '@type': 'Organization',
      name: 'Thulo Bazaar',
      url: BASE_URL,
    },
  };

  // JSON.stringify produces safe output — no XSS risk from structured data we control
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileAppData) }}
      />
    </>
  );
}

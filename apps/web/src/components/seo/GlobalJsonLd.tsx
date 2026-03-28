import {
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
} from '@/lib/utils/structuredData';

const BASE_URL = 'https://thulobazaar.com.np';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.thulobazaar.mobile';
// TODO: Update when iOS app is published on App Store
const APP_STORE_URL = '';

export function GlobalJsonLd({ lang }: { lang: string }) {
  const orgData = generateOrganizationStructuredData({
    name: 'Thulo Bazaar',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: "Nepal's Leading Classifieds Marketplace - Buy & Sell Everything",
    sameAs: [
      'https://www.facebook.com/thulobazaar',
    ],
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2500',
      bestRating: '5',
      worstRating: '1',
    },
    image: `${BASE_URL}/logo.png`,
    url: `${BASE_URL}/${lang}`,
    installUrl: PLAY_STORE_URL,
    ...(APP_STORE_URL && { additionalProperty: {
      '@type': 'PropertyValue',
      name: 'App Store URL',
      value: APP_STORE_URL,
    }}),
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

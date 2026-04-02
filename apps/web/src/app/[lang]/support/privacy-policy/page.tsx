/**
 * Privacy Policy Page
 * /[lang]/support/privacy-policy
 */

import { Metadata } from 'next';
import PrivacyPolicyClient from './PrivacyPolicyClient';
import { getTranslations } from 'next-intl/server';

interface PrivacyPolicyPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PrivacyPolicyPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('privacyPolicyTitle');
  const description = t('privacyPolicyDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/support/privacy-policy`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/support/privacy-policy`,
      languages: {
        en: `${baseUrl}/en/support/privacy-policy`,
        ne: `${baseUrl}/ne/support/privacy-policy`,
      },
    },
  };
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}

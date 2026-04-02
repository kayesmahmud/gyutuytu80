/**
 * Terms of Service Page
 * /[lang]/support/terms-of-service
 */

import { Metadata } from 'next';
import TermsOfServiceClient from './TermsOfServiceClient';
import { getTranslations } from 'next-intl/server';

interface TermsOfServicePageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: TermsOfServicePageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('termsOfServiceTitle');
  const description = t('termsOfServiceDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/support/terms-of-service`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/support/terms-of-service`,
      languages: {
        en: `${baseUrl}/en/support/terms-of-service`,
        ne: `${baseUrl}/ne/support/terms-of-service`,
      },
    },
  };
}

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />;
}

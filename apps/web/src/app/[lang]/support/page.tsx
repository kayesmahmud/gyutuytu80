/**
 * User Support Page
 * /[lang]/support - View and create support tickets
 */

import { Metadata } from 'next';
import SupportClient from './SupportClient';
import { getTranslations } from 'next-intl/server';

interface SupportPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: SupportPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('supportTitle');
  const description = t('supportDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/support`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/support`,
      languages: {
        en: `${baseUrl}/en/support`,
        ne: `${baseUrl}/ne/support`,
      },
    },
  };
}

export default function SupportPage() {
  return <SupportClient />;
}

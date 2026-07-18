/**
 * Work With Us Page
 * /[lang]/work-with-us - Careers / hiring information page
 */

import { Metadata } from 'next';
import WorkWithUsClient from './WorkWithUsClient';
import { getTranslations } from 'next-intl/server';

interface WorkWithUsPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: WorkWithUsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('workWithUsTitle');
  const description = t('workWithUsDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/work-with-us`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/work-with-us`,
      languages: {
        en: `${baseUrl}/en/work-with-us`,
        ne: `${baseUrl}/ne/work-with-us`,
      },
    },
  };
}

export default function WorkWithUsPage() {
  return <WorkWithUsClient />;
}

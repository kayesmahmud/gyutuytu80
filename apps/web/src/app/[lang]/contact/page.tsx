/**
 * Contact Page
 * /[lang]/contact - Contact form and company information
 */

import { Metadata } from 'next';
import ContactClient from './ContactClient';
import { getTranslations } from 'next-intl/server';

interface ContactPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('contactTitle');
  const description = t('contactDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/contact`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/contact`,
      languages: {
        en: `${baseUrl}/en/contact`,
        ne: `${baseUrl}/ne/contact`,
        'x-default': `${baseUrl}/en/contact`,
      },
    },
  };
}

export default function ContactPage() {
  return <ContactClient />;
}

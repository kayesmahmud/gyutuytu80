/**
 * FAQ Page
 * /[lang]/faq - Frequently Asked Questions
 */

import { Metadata } from 'next';
import FAQClient from './FAQClient';
import { getTranslations } from 'next-intl/server';
import { FaqJsonLd } from '@/components/seo/FaqJsonLd';

interface FAQPageProps {
  params: Promise<{ lang: string }>;
}

const FAQ_Q_KEYS = [
  'generalQ1', 'generalQ2', 'generalQ3',
  'buyingQ1', 'buyingQ2', 'buyingQ3',
  'sellingQ1', 'sellingQ2', 'sellingQ3', 'sellingQ4',
  'paymentsQ1', 'paymentsQ2', 'paymentsQ3',
  'accountQ1', 'accountQ2', 'accountQ3',
  'safetyQ1', 'safetyQ2', 'safetyQ3',
];

export async function generateMetadata({ params }: FAQPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('faqTitle');
  const description = t('faqDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/faq`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/faq`,
      languages: {
        en: `${baseUrl}/en/faq`,
        ne: `${baseUrl}/ne/faq`,
        'x-default': `${baseUrl}/en/faq`,
      },
    },
  };
}

export default async function FAQPage({ params }: FAQPageProps) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'faq' });

  const faqItems = FAQ_Q_KEYS.map((qKey) => ({
    question: t(qKey),
    answer: t(qKey.replace(/Q(\d+)$/, 'A$1')),
  }));

  return (
    <>
      <FaqJsonLd items={faqItems} />
      <FAQClient />
    </>
  );
}

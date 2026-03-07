/**
 * FAQ Page
 * /[lang]/faq - Frequently Asked Questions
 */

import { Metadata } from 'next';
import FAQClient from './FAQClient';
import { getTranslations } from 'next-intl/server';

interface FAQPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: FAQPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  return {
    title: t('faqTitle'),
    description: t('faqDescription'),
  };
}

export default function FAQPage() {
  return <FAQClient />;
}

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
  return {
    title: t('contactTitle'),
    description: t('contactDescription'),
  };
}

export default function ContactPage() {
  return <ContactClient />;
}

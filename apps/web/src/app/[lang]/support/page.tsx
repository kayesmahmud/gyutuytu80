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
  return {
    title: t('supportTitle'),
    description: t('supportDescription'),
  };
}

export default function SupportPage() {
  return <SupportClient />;
}

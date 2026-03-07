/**
 * Messages Page Route
 * Accessible at /en/messages, /np/messages, etc.
 */

import { Suspense } from 'react';
import MessagesPage from '@/components/messages/MessagesPage';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: PageProps) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  return {
    title: t('messagesTitle'),
    description: t('messagesDescription'),
  };
}

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function Page({ params }: PageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations('common');

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loadingMessages')}</p>
          </div>
        </div>
      }
    >
      <MessagesPage />
    </Suspense>
  );
}

/**
 * Live Chat
 * /[lang]/live-chat — one continuous conversation: the AI assistant answers
 * first and hands over to the team when it cannot help.
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LiveChatClient from './LiveChatClient';

interface LiveChatPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LiveChatPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('liveChatTitle');
  const description = t('liveChatDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/live-chat`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/live-chat`,
      languages: {
        en: `${baseUrl}/en/live-chat`,
        ne: `${baseUrl}/ne/live-chat`,
        'x-default': `${baseUrl}/en/live-chat`,
      },
    },
  };
}

export default function LiveChatPage() {
  return <LiveChatClient />;
}

/**
 * Help / FAQ Page
 * /[lang]/help - Frequently asked questions and help articles
 */

import { Metadata } from 'next';
import HelpClient from './HelpClient';

interface HelpPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: HelpPageProps): Promise<Metadata> {
  const { lang } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = 'Help Center | Thulo Bazaar';
  const description = 'Find answers to frequently asked questions about buying, selling, account management, payments, and more on Thulo Bazaar.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/help`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/help`,
      languages: {
        en: `${baseUrl}/en/help`,
        ne: `${baseUrl}/ne/help`,
      },
    },
  };
}

export default function HelpPage() {
  return <HelpClient />;
}

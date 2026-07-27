import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleTagManager } from '@next/third-parties/google';

import { MetaPixel } from '@/components/MetaPixel';
import { ChunkErrorReloader } from '@/components/analytics/ChunkErrorReloader';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { Providers } from '@/components/Providers';
import { getAnalyticsConfig } from '@/lib/analytics/config';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'Thulo Bazaar - Buy & Sell Everything',
  description: "Nepal's Leading Classifieds Marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolved per request, so swapping a container/pixel is an env change and a
  // restart — no rebuild, no code edit. See lib/analytics/config.ts.
  const { gtmId, metaPixelId } = getAnalyticsConfig();

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Analytics must live inside <body> — rendering the GTM/Pixel <noscript>
            between <html> and <body> is an invalid document position (Next 16). */}
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
        <MetaPixel pixelId={metaPixelId} />
        <PageViewTracker />
        <ChunkErrorReloader />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

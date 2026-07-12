import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleTagManager } from '@next/third-parties/google';

import { MetaPixel } from '@/components/MetaPixel';
import { Providers } from '@/components/Providers';
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
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Analytics must live inside <body> — rendering the GTM/Pixel <noscript>
            between <html> and <body> is an invalid document position (Next 16). */}
        <GoogleTagManager gtmId="GTM-NDZQCRKC" />
        <MetaPixel />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleTagManager } from '@next/third-parties/google';

import { Providers } from '@/components/Providers';
import './globals.css';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

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
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

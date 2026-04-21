'use client';

import Script from 'next/script';

interface GoogleAdSenseProps {
  enabled: boolean;
  clientId: string;
}

/**
 * GoogleAdSense Script Loader
 *
 * Loads the Google AdSense script globally when ads are enabled
 * and a valid client ID is provided from the admin panel.
 *
 * When ads are disabled (no client ID or toggle off), returns null
 * so no AdSense script is loaded — Google sees a clean site.
 */
export default function GoogleAdSense({ enabled, clientId }: GoogleAdSenseProps) {
  if (!enabled || !clientId) {
    return null;
  }

  // Next.js Script types miss HTML attributes with React 19
  const scriptProps = {
    src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`,
    crossOrigin: 'anonymous',
    strategy: 'afterInteractive' as const,
    onError: (e: unknown) => {
      console.error('AdSense script failed to load:', e);
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Script {...(scriptProps as any)} />;
}

'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import AppStoreBanner from '@/components/pwa/AppStoreBanner';

interface ChromeShellProps {
  lang: string;
  children: React.ReactNode;
}

/**
 * Wraps page content with the consumer site chrome (top Header, Footer, mobile
 * BottomNav) — EXCEPT on the staff panels (/editor, /super-admin), which have
 * their own DashboardLayout shell. Keeps the user-facing nav out of the editor
 * APK / mobile editor view.
 */
export default function ChromeShell({ lang, children }: ChromeShellProps) {
  const pathname = usePathname();
  const isStaffRoute = /\/(editor|super-admin)(\/|$)/.test(pathname);
  const isChatRoute = /\/messages(\/|$)/.test(pathname);

  if (isStaffRoute) {
    return <>{children}</>;
  }

  // Chat is a full-height app screen: keep the Header but pin the page to the
  // visible viewport (dvh) with no Footer/BottomNav, so the message composer
  // is always on screen instead of one header-height below the fold.
  if (isChatRoute) {
    return (
      <div className="flex flex-col h-[100dvh]">
        <div className="flex-shrink-0">
          <Header lang={lang} />
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    );
  }

  return (
    <>
      <InstallPrompt />   {/* Desktop PWA install — consumer only */}
      <AppStoreBanner />  {/* Mobile App Store/Play Store redirect — consumer only */}
      <Header lang={lang} />
      <div className="pb-20 lg:pb-0">{children}</div>
      <Footer lang={lang} />
      <BottomNav lang={lang} />
    </>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, BadgeCheck, MessageCircle } from 'lucide-react';

interface EditorBottomNavProps {
  lang: string;
}

/**
 * Mobile-only bottom tab bar for the editor panel (hidden on lg+, where the
 * sidebar rail is used). Thumb-friendly access to the key sections; the full
 * drawer (everything else) opens from the top-left menu button in the header.
 */
export function EditorBottomNav({ lang }: EditorBottomNavProps) {
  const pathname = usePathname();
  const base = `/${lang}/editor`;

  const tabs = [
    { href: `${base}/dashboard`, icon: LayoutDashboard, label: 'Dashboard', isActive: (p: string) => p.endsWith('/editor/dashboard') },
    { href: `${base}/ad-management`, icon: Megaphone, label: 'Ads', isActive: (p: string) => p.includes('/editor/ad-management') },
    { href: `${base}/verifications`, icon: BadgeCheck, label: 'Verify', isActive: (p: string) => p.includes('verification') || p.endsWith('/verifications') },
    { href: `${base}/support-chat`, icon: MessageCircle, label: 'Support', isActive: (p: string) => p.includes('/editor/support') },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 flex bg-white border-t border-gray-200 shadow-[0_-1px_8px_rgba(0,0,0,0.04)] lg:hidden">
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors"
            style={{ color: active ? 'var(--admin-primary)' : '#6b7280' }}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

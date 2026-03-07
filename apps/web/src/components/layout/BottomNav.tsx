'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface BottomNavProps {
    lang: string;
}

export default function BottomNav({ lang }: BottomNavProps) {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const isKeyboardVisible = useKeyboardVisible();
    const { isAuthenticated } = useUserAuth();

    // Fetch unread message count (same as Header)
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await apiClient.getUnreadCount();
            if (response.success && response.data) {
                setUnreadCount(response.data.unread_messages || 0);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new messages every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Hide on scroll down, show on scroll up (must be before any early returns!)
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < lastScrollY || currentScrollY < 50) {
                // Scrolling up or near top
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Hide on ad detail pages (has its own contact bar) - AFTER all hooks!
    const isAdDetailPage = pathname?.match(/\/ad\/[^/]+$/) && !pathname?.endsWith('/ads');
    if (isAdDetailPage) return null;

    // Hide when keyboard is open OR scrolling down
    const shouldShow = isVisible && !isKeyboardVisible;

    const navItems = [
        {
            name: t('home'),
            href: `/${lang}`,
            icon: Home,
            active: pathname === `/${lang}`,
        },
        {
            name: t('search'),
            href: `/${lang}/ads`,
            icon: Search,
            active: pathname?.includes('/ads') && !pathname?.includes('/post-ad'),
        },
        {
            name: t('post'),
            href: `/${lang}/post-ad`,
            icon: PlusCircle,
            active: pathname?.includes('/post-ad'),
            isPrimary: true, // Center FAB
        },
        {
            name: t('messages'),
            href: `/${lang}/messages`,
            icon: MessageCircle,
            active: pathname?.includes('/messages'),
            badge: unreadCount,
        },
        {
            name: t('profile'),
            href: `/${lang}/profile`,
            icon: User,
            active: pathname?.includes('/profile'),
        },
    ];

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden transition-transform duration-300 ${shouldShow ? 'translate-y-0' : 'translate-y-full'
                }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;

                    if (item.isPrimary) {
                        // Primary FAB (Post Ad)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="relative -mt-8"
                            >
                                <div className="w-14 h-14 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${item.active
                                    ? 'text-rose-500'
                                    : 'text-gray-600 hover:text-rose-500'
                                }`}
                        >
                            <div className="relative inline-flex">
                                <Icon className="w-6 h-6" strokeWidth={item.active ? 2.5 : 2} />

                                {/* Unread badge for messages - positioned on top-right of icon */}
                                {typeof item.badge === 'number' && item.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 z-10">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>

                            <span
                                className={`text-[10px] mt-0.5 font-medium ${item.active ? 'font-semibold' : ''
                                    }`}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

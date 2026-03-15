'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { messagingApi } from '@/lib/messaging';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useTranslations } from 'next-intl';

interface AdContactBarProps {
  sellerId: number;
  sellerPhone: string | null;
  sellerBusinessPhone: string | null;
  adId: number;
  adTitle: string;
  adSlug: string;
  lang: string;
}

export default function AdContactBar({
  sellerId,
  sellerPhone,
  sellerBusinessPhone,
  adId,
  adTitle,
  adSlug,
  lang,
}: AdContactBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations('ads');
  const [isMessaging, setIsMessaging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isKeyboardVisible = useKeyboardVisible();

  const currentUserId = session?.user?.id;
  const isOwner = currentUserId != null && String(currentUserId) === String(sellerId);

  const shouldShow = isVisible && !isKeyboardVisible;

  // Hide on scroll down, show on scroll up
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

  const phone = sellerBusinessPhone || sellerPhone;

  // Format WhatsApp number (Nepal +977)
  const formatWhatsApp = (num: string) => {
    let cleaned = num.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('0')) cleaned = '977' + cleaned.slice(1);
    if (!cleaned.startsWith('977')) cleaned = '977' + cleaned;
    return cleaned;
  };

  const handlePhone = () => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = () => {
    if (!phone) return;
    const url = `${window.location.origin}/${lang}/ad/${adSlug}`;
    const message = `Hi, I'm interested in "${adTitle}" - ${url}`;
    window.open(`https://wa.me/${formatWhatsApp(phone)}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleMessage = async () => {
    if (!session?.user) {
      router.push(`/${lang}/auth/signin?callbackUrl=/${lang}/ad/${adSlug}`);
      return;
    }

    setIsMessaging(true);
    try {
      const token = (session.user as any)?.backendToken;
      if (!token) throw new Error('No token');

      const conv = await messagingApi.startConversation(token, {
        userId: sellerId,
        adId,
      });
      router.push(`/${lang}/messages?conversation=${conv.id}`);
    } catch (err) {
      console.error('Message error:', err);
    } finally {
      setIsMessaging(false);
    }
  };

  // Don't show if no phone number available
  if (!phone) return null;

  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 ${
        shouldShow ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className={`flex items-center justify-around py-2 px-4 gap-2 ${isOwner ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Phone */}
        <button
          onClick={handlePhone}
          disabled={isOwner}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-3 text-sm text-white rounded-xl font-medium transition-colors ${
            isOwner ? 'bg-gray-400' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <span>{t('call')}</span>
        </button>

        {/* Message */}
        <button
          onClick={handleMessage}
          disabled={isMessaging || isOwner}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-3 text-sm text-white rounded-xl font-medium transition-colors ${
            isOwner ? 'bg-gray-400' : 'bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{isMessaging ? '...' : t('chat')}</span>
        </button>

        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          disabled={isOwner}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-3 text-sm text-white rounded-xl font-medium transition-colors ${
            isOwner ? 'bg-gray-400' : 'bg-[#25D366] hover:bg-[#1da851]'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          </svg>
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

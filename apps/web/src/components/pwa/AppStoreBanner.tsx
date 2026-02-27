'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

type MobileOS = 'ios' | 'android' | 'other';

// Placeholder URLs - update these when apps are published
const STORE_URLS = {
  appStore: 'https://apps.apple.com/app/thulobazaar/id_PLACEHOLDER_',
  playStore: 'https://play.google.com/store/apps/details?id=com.thulobazaar.app',
};

const DISMISSAL_KEY = 'app-store-banner-dismissed';
const DISMISSAL_HOURS = 24; // Show banner once per day

function getMobileOS(): MobileOS {
  if (typeof window === 'undefined') return 'other';

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }

  return 'other';
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;

  const dismissedAt = localStorage.getItem(DISMISSAL_KEY);
  if (!dismissedAt) return false;

  const dismissedTime = parseInt(dismissedAt, 10);
  const now = Date.now();
  const hoursSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60);

  return hoursSinceDismissal < DISMISSAL_HOURS;
}

function setDismissed(): void {
  localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
}

export default function AppStoreBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [mobileOS, setMobileOS] = useState<MobileOS>('other');

  useEffect(() => {
    // Only show on mobile devices
    if (!isMobileDevice()) return;

    // Don't show if already dismissed
    if (isDismissed()) return;

    const os = getMobileOS();
    // Only show for iOS or Android
    if (os === 'other') return;

    setMobileOS(os);

    // Show banner after 3 seconds delay
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed();
  };

  const handleDownload = () => {
    const url = mobileOS === 'ios' ? STORE_URLS.appStore : STORE_URLS.playStore;
    window.open(url, '_blank');
    handleDismiss();
  };

  if (!showBanner) return null;

  const storeImage = mobileOS === 'ios' ? '/Appstore.png' : '/PlayStore.png';
  const storeAlt = mobileOS === 'ios' ? 'Download on App Store' : 'Get it on Google Play';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Modal Card - Centered, 450px height */}
      <div className="bg-white w-full max-w-sm h-[450px] rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col">
        {/* Gradient Header with App Info */}
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 px-6 pt-6 pb-8 flex-shrink-0">
          {/* Decorative circles - pointer-events-none so they don't block clicks */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          {/* Close Button - z-10 to ensure it's clickable above decorative elements */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* App Icon */}
          <div className="relative flex justify-center mb-3">
            <div className="w-16 h-16 bg-white rounded-xl shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Thulo Bazaar"
                width={44}
                height={44}
                className="object-contain"
                style={{ width: '44px', height: '44px' }}
              />
            </div>
          </div>

          {/* App Name & Tagline */}
          <div className="text-center relative">
            <h2 className="text-2xl font-bold text-white mb-1">Thulo Bazaar</h2>
            <p className="text-white/90 text-sm">Buy & Sell Everything in Nepal</p>

            {/* Rating */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-4 h-4 text-yellow-300 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-white/90 text-sm font-medium">4.8</span>
              <span className="text-white/70 text-xs">(2.5k reviews)</span>
            </div>

            {/* Store Download Button - Centered in header */}
            <button
              onClick={handleDownload}
              className="mt-5 mx-auto flex items-center justify-center bg-white hover:bg-gray-50 rounded-xl py-2.5 px-6 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <Image
                src={storeImage}
                alt={storeAlt}
                width={140}
                height={42}
                className="h-10 w-auto"
              />
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-5 py-3 bg-gray-50 flex-1">
          <div className="flex justify-center gap-6">
            {[
              { icon: '🚀', text: 'Fast' },
              { icon: '🔔', text: 'Alerts' },
              { icon: '💬', text: 'Chat' },
              { icon: '📸', text: 'Post' },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <span className="text-xl block mb-0.5">{feature.icon}</span>
                <p className="text-xs text-gray-600 font-medium">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Continue in Browser */}
        <div className="px-5 py-3 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Maybe later, continue in browser
          </button>
        </div>
      </div>

      {/* Add keyframe animations */}
      <style>{`
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

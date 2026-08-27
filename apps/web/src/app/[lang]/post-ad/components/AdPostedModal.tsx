'use client';

import { useTranslations } from 'next-intl';

interface AdPostedModalProps {
  lang: string;
  /** The ad already went live (business direct-publish or instant AI
      approval) — closing goes to the ad's page instead of the dashboard. */
  live?: boolean;
  onClose: () => void;
}

export function AdPostedModal({ lang, live = false, onClose }: AdPostedModalProps) {
  const t = useTranslations('ads');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-6 pb-8 pt-10 text-center shadow-2xl">
        {/* Prominent close button — the only way to dismiss */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-600"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Green checkmark */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t(live ? 'adPostedLiveTitle' : 'adPostedTitle')}
        </h2>

        <p className="mb-0 text-sm leading-relaxed text-gray-700">
          {t(live ? 'adPostedLiveNote' : 'adPostedReviewNote')}
        </p>

        {/* Romanized Nepali line for the English locale (Nepali locale reads it natively above) */}
        {!live && lang !== 'ne' && (
          <p className="mb-0 mt-3 text-[13px] italic leading-relaxed text-gray-500">
            {t('adPostedReviewNoteLatin')}
          </p>
        )}
      </div>
    </div>
  );
}

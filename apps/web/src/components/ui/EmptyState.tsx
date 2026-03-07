'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {/* Animated Icon */}
      <div className="text-8xl mb-6 animate-bounce-slow inline-block">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(actionLabel && actionHref) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center gap-2 bg-rose-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-rose-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 no-underline"
          >
            {actionLabel}
          </Link>

          {secondaryActionLabel && secondaryActionHref && (
            <Link
              href={secondaryActionHref}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 no-underline"
            >
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// Predefined empty states for common scenarios
export function EmptyAds({ lang }: { lang: string }) {
  const t = useTranslations('common');
  return (
    <EmptyState
      icon="📭"
      title={t('noAdsYet')}
      description={t('noAdsYetDesc')}
      actionLabel={t('postYourFirstAd')}
      actionHref={`/${lang}/post-ad`}
      secondaryActionLabel={t('searchAllAds')}
      secondaryActionHref={`/${lang}/ads`}
    />
  );
}

export function EmptySearchResults({ lang }: { lang: string }) {
  const t = useTranslations('common');
  return (
    <EmptyState
      icon="🔍"
      title={t('noResultsFound')}
      description={t('noResultsFoundDesc')}
      actionLabel={t('clearFilters')}
      actionHref={`/${lang}/ads`}
      secondaryActionLabel={t('searchAllAds')}
      secondaryActionHref={`/${lang}/ads`}
    />
  );
}

export function EmptyFavorites({ lang }: { lang: string }) {
  const t = useTranslations('common');
  return (
    <EmptyState
      icon="❤️"
      title={t('noFavoritesYet')}
      description={t('noFavoritesYetDesc')}
      actionLabel={t('searchAllAds')}
      actionHref={`/${lang}/ads`}
    />
  );
}

export function EmptyMessages() {
  const t = useTranslations('common');
  return (
    <EmptyState
      icon="💬"
      title={t('noMessages')}
      description={t('noMessagesDesc')}
    />
  );
}

export function EmptyNotifications() {
  const t = useTranslations('common');
  return (
    <EmptyState
      icon="🔔"
      title={t('noNotifications')}
      description={t('noNotificationsDesc')}
    />
  );
}

export function ErrorState({
  message,
  retry
}: {
  message?: string;
  retry?: () => void;
}) {
  const t = useTranslations('common');
  return (
    <div className="text-center py-16 px-4">
      <div className="text-8xl mb-6">😕</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {t('oops')}
      </h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        {message || t('somethingWentWrong')}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 bg-rose-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-rose-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          {t('tryAgain')}
        </button>
      )}
    </div>
  );
}

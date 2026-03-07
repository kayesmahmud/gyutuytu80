'use client';

import { useTranslations } from 'next-intl';

interface HeroHeaderProps {
  lang: string;
}

export function HeroHeader({ lang }: HeroHeaderProps) {
  const t = useTranslations('verification');

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center max-w-3xl mx-auto pt-4 md:pt-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            {t('heroTitle')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed px-2">
            {t('heroSubtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}

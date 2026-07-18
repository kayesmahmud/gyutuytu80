'use client';

import { useTranslations } from 'next-intl';
import {
  Rocket,
  MapPinned,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  Headset,
  Mail,
} from 'lucide-react';

const HR_EMAIL = 'hrd@thulobazaar.com.np';

const WHY_ITEMS = [
  { icon: Rocket, titleKey: 'whyOwnershipTitle', descKey: 'whyOwnershipDesc', color: 'bg-blue-100 text-blue-600' },
  { icon: MapPinned, titleKey: 'whyImpactTitle', descKey: 'whyImpactDesc', color: 'bg-green-100 text-green-600' },
  { icon: GraduationCap, titleKey: 'whyGrowthTitle', descKey: 'whyGrowthDesc', color: 'bg-purple-100 text-purple-600' },
  { icon: HeartHandshake, titleKey: 'whyTeamTitle', descKey: 'whyTeamDesc', color: 'bg-rose-100 text-rose-600' },
] as const;

const AREA_ITEMS = [
  { icon: Megaphone, titleKey: 'areaMarketingTitle', descKey: 'areaMarketingDesc', color: 'bg-pink-100 text-pink-600' },
  { icon: Headset, titleKey: 'areaSupportTitle', descKey: 'areaSupportDesc', color: 'bg-amber-100 text-amber-600' },
] as const;

export default function WorkWithUsClient() {
  const t = useTranslations('workWithUs');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">{t('title')}</h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8 md:space-y-12">
        {/* Intro */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{t('introTitle')}</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('introText')}
          </p>
        </div>

        {/* Why Work With Us */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">{t('whyTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {WHY_ITEMS.map(({ icon: Icon, titleKey, descKey, color }) => (
              <div key={titleKey} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{t(titleKey)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Areas We Hire Across */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">{t('areasTitle')}</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto text-center mb-4 sm:mb-6">
            {t('areasSubtitle')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {AREA_ITEMS.map(({ icon: Icon, titleKey, descKey, color }) => (
              <div key={titleKey} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{t(titleKey)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How to Apply */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl shadow-sm p-4 sm:p-6 md:p-8 text-center text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">{t('applyTitle')}</h2>
          <p className="text-sm sm:text-base opacity-90 max-w-2xl mx-auto mb-6 leading-relaxed">
            {t('applyText')}
          </p>

          <a
            href={`mailto:${HR_EMAIL}`}
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 sm:px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Mail className="w-5 h-5" />
            {t('applyButton')}
          </a>

          <p className="text-sm opacity-90 mt-4">
            {t('applyEmailLabel')}{' '}
            <a href={`mailto:${HR_EMAIL}`} className="underline underline-offset-2 hover:opacity-80 break-all">
              {HR_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

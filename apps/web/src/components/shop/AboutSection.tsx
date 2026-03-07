'use client';

import { useTranslations } from 'next-intl';
import { useShopAbout } from '@/hooks/useShopAbout';

interface AboutSectionProps {
  shopSlug: string;
  initialDescription: string | null;
  bio: string | null;
  isOwner: boolean;
}

export function AboutSection({ shopSlug, initialDescription, bio, isOwner }: AboutSectionProps) {
  const t = useTranslations('shop');
  const tc = useTranslations('common');
  const { isEditing, setIsEditing, aboutText, setAboutText, saving, handleSave, handleCancel } = useShopAbout({
    shopSlug,
    initialDescription,
    bio,
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">{t('about')}</h2>
        {!isEditing && isOwner && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {tc('edit')}
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            maxLength={500}
            placeholder={t('descriptionPlaceholder')}
            className="w-full min-h-[100px] sm:min-h-[120px] p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          <div className="text-xs sm:text-sm text-gray-500 mt-2">
            {t('charactersCount', { length: aboutText.length })}
          </div>
          <div className="flex gap-2 mt-3 sm:mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? tc('saving') : tc('save')}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 border border-gray-300 px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
            >
              {tc('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
          {aboutText || t('noDescriptionAvailable')}
        </p>
      )}
    </div>
  );
}



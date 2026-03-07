'use client';

import { MarkerPin02 } from '@untitledui-pro/icons/line';
import { useTranslations } from 'next-intl';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import { useShopLocation } from '@/hooks/useShopLocation';

interface LocationSectionProps {
  initialLocationSlug: string | null;
  initialLocationName: string | null;
  initialLocationFullPath: string | null;
  isOwner: boolean;
}

export function LocationSection({
  initialLocationSlug,
  initialLocationName,
  initialLocationFullPath,
  isOwner,
}: LocationSectionProps) {
  const t = useTranslations('shop');
  const tc = useTranslations('common');
  const {
    isEditing,
    setIsEditing,
    locationSlug,
    locationName,
    locationFullPath,
    saving,
    handleLocationSelect,
    handleSave,
    handleCancel,
  } = useShopLocation({
    initialLocationSlug,
    initialLocationName,
    initialLocationFullPath,
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">{t('location')}</h2>
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
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              {t('selectYourLocation')}
            </label>
            <p className="text-xs text-gray-500 mb-3">
              {t('preSelectedNote')}
            </p>
            <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg p-3">
              <CascadingLocationFilter
                onLocationSelect={handleLocationSelect}
                selectedLocationSlug={locationSlug || null}
                selectedLocationName={locationName || null}
              />
            </div>
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
        <div className="space-y-3 sm:space-y-4">
          {locationName ? (
            <div className="flex items-start gap-2 sm:gap-3">
              <MarkerPin02 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-teal-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-600">{t('yourLocation')}</div>
                <div className="font-semibold text-sm sm:text-base">
                  {locationFullPath || locationName}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-gray-500 italic">
              {t('noDefaultLocation')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}



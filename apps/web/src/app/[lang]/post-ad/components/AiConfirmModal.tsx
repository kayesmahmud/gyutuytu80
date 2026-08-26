'use client';

import { useTranslations } from 'next-intl';

interface AiConfirmModalProps {
  /** Warning keys collected at submit time: 'junk' | 'price' | 'aiFilled' */
  warnings: string[];
  onProceed: () => void;
  onReview: () => void;
}

const WARNING_KEYS: Record<string, string> = {
  junk: 'aiWarnJunk',
  junkSelfie: 'aiCouldNotFillSelfie',
  price: 'aiWarnPrice',
  aiFilled: 'aiWarnFilled',
};

/**
 * Pre-post confirmation for AI-assisted listings. These are warnings only —
 * "Post anyway" always works; humans (editors) remain the only hard "no".
 */
export default function AiConfirmModal({ warnings, onProceed, onReview }: AiConfirmModalProps) {
  const t = useTranslations('ads');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-6 py-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2 m-0">
          <span>✨</span>
          {t('aiConfirmTitle')}
        </h3>
        <ul className="mb-5 flex flex-col gap-2 list-none p-0 m-0">
          {warnings.map((warning) => (
            <li
              key={warning}
              className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3"
            >
              {t(WARNING_KEYS[warning] ?? warning)}
            </li>
          ))}
        </ul>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onReview}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium bg-white cursor-pointer"
          >
            {t('aiReviewAgain')}
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer"
          >
            {t('aiPostAnyway')}
          </button>
        </div>
      </div>
    </div>
  );
}

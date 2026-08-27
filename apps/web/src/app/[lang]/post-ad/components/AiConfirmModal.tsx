'use client';

import { useTranslations } from 'next-intl';

interface AiConfirmModalProps {
  /** Warning keys collected at submit time: 'junk' | 'junkSelfie' | 'price' | 'aiFilled' */
  warnings: string[];
  onProceed: () => void;
  onReview: () => void;
}

const WARNING_META: Record<string, { key: string; icon: string }> = {
  junk: { key: 'aiWarnJunk', icon: '📷' },
  junkSelfie: { key: 'aiCouldNotFillSelfie', icon: '🤳' },
  price: { key: 'aiWarnPrice', icon: '💰' },
  aiFilled: { key: 'aiWarnFilled', icon: '✨' },
  categoryMismatch: { key: 'aiWarnCategoryMismatch', icon: '🏷️' },
  spelling: { key: 'aiWarnSpelling', icon: '✏️' },
};

/**
 * Pre-post confirmation for AI-assisted listings. These are warnings only —
 * "Post anyway" always works; humans (editors) remain the only hard "no".
 */
export default function AiConfirmModal({ warnings, onProceed, onReview }: AiConfirmModalProps) {
  const t = useTranslations('ads');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-3xl bg-white px-7 pt-8 pb-6 shadow-2xl"
        style={{ animation: 'tb-ai-modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <style>{`
          @keyframes tb-ai-modal-pop {
            from { opacity: 0; transform: scale(0.92) translateY(12px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Gradient AI icon */}
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-3xl shadow-lg shadow-indigo-200">
          <span className="-mt-0.5">✨</span>
        </div>

        <h3 className="m-0 mb-5 text-center text-xl font-bold text-gray-900">
          {t('aiConfirmTitle')}
        </h3>

        <ul className="m-0 mb-6 flex list-none flex-col gap-2.5 p-0">
          {warnings.map((warning) => {
            const meta = WARNING_META[warning];
            return (
              <li
                key={warning}
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5"
              >
                <span className="shrink-0 text-lg leading-6">{meta?.icon ?? '⚠️'}</span>
                <span className="text-sm leading-6 text-amber-900">
                  {t(meta?.key ?? warning)}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Red review / green post — matching the Flutter dialog (owner, 2026-08-27) */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onReview}
            className="w-full cursor-pointer rounded-xl bg-red-500 py-3 font-semibold text-white shadow-md shadow-red-200 transition-colors hover:bg-red-600"
          >
            {t('aiReviewAgain')}
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="w-full cursor-pointer rounded-xl bg-emerald-500 py-3 font-semibold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-600"
          >
            {t('aiPostAnyway')}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import type { PhysicalSize } from '../lib/dimensions';
import { INCHES_PER_FOOT } from '../lib/dimensions';
import {
  LAYOUT_OPTIONS,
  recommendedLayout,
  type SignboardLayoutId,
} from '../lib/layoutEngine';
import type { SignboardContent } from '../lib/renderer';
import { SignboardPreview } from './SignboardPreview';

interface LayoutSelectorProps {
  selected: SignboardLayoutId;
  size: PhysicalSize | null;
  content: SignboardContent;
  wordmark: ImageBitmap | null;
  fontFamily: string;
  onSelect: (id: SignboardLayoutId) => void;
}

/**
 * Each option is the real renderer at the board's actual proportions, so the
 * choice is made against what will print rather than against an icon.
 */
export function LayoutSelector({
  selected,
  size,
  content,
  wordmark,
  fontFamily,
  onSelect,
}: LayoutSelectorProps) {
  const suggested = size ? recommendedLayout(size.widthIn / INCHES_PER_FOOT) : null;

  return (
    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Layout
      </span>
      <div className="space-y-2">
        {LAYOUT_OPTIONS.map((option) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={active}
              className={`w-full rounded-lg border p-2 text-left transition-colors ${
                active
                  ? 'border-[#DC143C] bg-red-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <SignboardPreview
                size={size}
                content={content}
                wordmark={wordmark}
                fontFamily={fontFamily}
                layoutId={option.id}
              />
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                {suggested === option.id ? (
                  <span className="rounded bg-[#DC143C] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Suggested
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {option.description}
                {option.bestUpToFeet ? ` Best up to ${option.bestUpToFeet} ft wide.` : ''}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

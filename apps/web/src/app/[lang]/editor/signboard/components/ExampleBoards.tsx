'use client';

import { INCHES_PER_FOOT, MAX_WIDTH_IN } from '../lib/dimensions';
import { shopUrlFromName } from '../lib/validation';
import { EXAMPLE_BOARDS, SHOP_URL_PREFIX } from '../types';
import { SignboardPreview } from './SignboardPreview';

/** Widest example, used to scale the rest so the row shows true relative size. */
const WIDEST_FEET = MAX_WIDTH_IN / INCHES_PER_FOOT;

interface ExampleBoardsProps {
  wordmark: ImageBitmap | null;
  fontFamily: string;
}

/**
 * Rendered through the same renderer as the real thing — these are live
 * signboards at each standard size, not screenshots, so they cannot fall out of
 * date when the layout rules change.
 */
export function ExampleBoards({ wordmark, fontFamily }: ExampleBoardsProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold text-gray-900">Standard signboard sizes</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        The same design at every standard size, drawn live and shown to relative scale.
      </p>

      <div className="mt-4 space-y-4">
        {EXAMPLE_BOARDS.map((example) => (
          <div key={`${example.shopName}-${example.width}x${example.height}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-gray-700">
                {example.width} ft × {example.height} ft
              </span>
              <span className="truncate text-xs text-gray-500">{example.shopName}</span>
            </div>
            {/* Scaled by real width so a 5 ft board reads as half a 10 ft one. */}
            <div style={{ width: `${(example.width / WIDEST_FEET) * 100}%` }}>
              <SignboardPreview
                size={{
                  widthIn: example.width * INCHES_PER_FOOT,
                  heightIn: example.height * INCHES_PER_FOOT,
                }}
                content={{
                  shopName: example.shopName,
                  shopUrl: shopUrlFromName(example.shopName, SHOP_URL_PREFIX),
                }}
                wordmark={wordmark}
                fontFamily={fontFamily}
                layoutId={example.layoutId}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

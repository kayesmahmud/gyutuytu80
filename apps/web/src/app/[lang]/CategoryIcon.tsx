'use client';

import * as React from 'react';
import Image from 'next/image';

interface CategoryIconProps {
  /** Category slug — maps to /public/category-icons/<slug>.png */
  slug: string;
  /** DB emoji, used as fallback if the PNG is missing */
  emoji?: string | null;
  /** Category name, used for alt text */
  name: string;
  /** Rendered width/height in px */
  size: number;
  /**
   * Drop shadow under the icon. Tuned for the large home/post-ad tiles; turn it
   * off for small inline icons (filter rows), where a 5px offset reads as blur.
   */
  shadow?: boolean;
}

/**
 * Renders the custom category icon (single source of truth in /public/category-icons),
 * falling back to the database emoji if the image is missing or fails to load.
 */
export default function CategoryIcon({ slug, emoji, name, size, shadow = true }: CategoryIconProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed || !slug) {
    return (
      <span style={{ fontSize: size * 0.82, lineHeight: 1 }} aria-hidden="true">
        {emoji || '📁'}
      </span>
    );
  }

  return (
    <Image
      src={`/category-icons/${slug}.png`}
      alt={name}
      width={size}
      height={size}
      className={`object-contain${shadow ? ' drop-shadow-[0_5px_4px_rgba(15,23,42,0.22)]' : ''}`}
      onError={() => setFailed(true)}
    />
  );
}

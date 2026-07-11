'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CategoryIcon from './CategoryIcon';

interface Category {
  id: number;
  name: string;
  name_ne?: string | null;
  slug: string;
  icon?: string | null;
}

interface MobileCategoryCarouselProps {
  categories: Category[];
  lang: string;
}

/**
 * Mobile-only two-row category carousel (matches the Flutter home screen):
 * icons wrap into two rows that scroll horizontally together, with translucent
 * left/right scroll arrows that only appear while the row is touched/scrolled
 * and only on the side that has more content to reveal.
 */
export default function MobileCategoryCarousel({ categories, lang }: MobileCategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [arrowsVisible, setArrowsVisible] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const half = Math.ceil(categories.length / 2);
  const topRow = categories.slice(0, half);
  const bottomRow = categories.slice(half);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  // Reveal arrows on any touch/scroll, and always re-arm a single idle timer so
  // they reliably fade out ~1.5s after the last activity (mirrors the Flutter
  // implementation's self-healing timer).
  const pingActivity = useCallback(() => {
    updateEdges();
    setArrowsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setArrowsVisible(false), 1500);
  }, [updateEdges]);

  useEffect(() => {
    updateEdges();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [updateEdges]);

  const scrollByStep = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
    pingActivity();
  };

  const renderTile = (category: Category) => (
    <Link
      key={category.id}
      href={`/${lang}/ads/${category.slug}`}
      className="flex-shrink-0"
    >
      <div className="w-[72px] flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 shadow-sm flex items-center justify-center">
          <CategoryIcon slug={category.slug} emoji={category.icon} name={category.name} size={40} />
        </div>
        {/* Reserve two lines so 1- and 2-line labels keep every icon aligned. */}
        <span className="mt-2 h-[26px] font-medium text-gray-800 text-[10px] text-center leading-tight line-clamp-2">
          {lang === 'ne' && category.name_ne ? category.name_ne : category.name}
        </span>
      </div>
    </Link>
  );

  return (
    <div className="sm:hidden -mx-4 px-4 relative">
      <div
        ref={scrollRef}
        onScroll={pingActivity}
        onPointerDown={pingActivity}
        onPointerMove={pingActivity}
        className="flex flex-col gap-3 overflow-x-auto scrollbar-hide pb-2"
      >
        <div className="flex gap-3 w-max">{topRow.map(renderTile)}</div>
        <div className="flex gap-3 w-max">{bottomRow.map(renderTile)}</div>
      </div>

      <ScrollArrow dir="left" visible={arrowsVisible && canLeft} onClick={() => scrollByStep('left')} />
      <ScrollArrow dir="right" visible={arrowsVisible && canRight} onClick={() => scrollByStep('right')} />
    </div>
  );
}

function ScrollArrow({
  dir,
  visible,
  onClick,
}: {
  dir: 'left' | 'right';
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={dir === 'left' ? 'Scroll categories left' : 'Scroll categories right'}
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${dir === 'left' ? 'left-2' : 'right-2'} z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/35 text-white transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  );
}

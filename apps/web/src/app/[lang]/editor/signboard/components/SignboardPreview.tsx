'use client';

import { useEffect, useRef, useState } from 'react';

import type { PhysicalSize } from '../lib/dimensions';
import { aspectRatio } from '../lib/dimensions';
import type { SignboardLayoutId } from '../lib/layoutEngine';
import { drawSignboard, type RenderReport, type SignboardContent } from '../lib/renderer';

/**
 * Preview resolution is capped independently of the export. The preview only has
 * to look right on screen, so there is no reason to build a print-size canvas on
 * every keystroke.
 */
const MAX_PREVIEW_WIDTH_PX = 2200;

interface SignboardPreviewProps {
  content: SignboardContent;
  size: PhysicalSize | null;
  wordmark: ImageBitmap | null;
  fontFamily: string;
  layoutId: SignboardLayoutId;
  onRender?: (report: RenderReport) => void;
  className?: string;
}

export function SignboardPreview({
  content,
  size,
  wordmark,
  fontFamily,
  layoutId,
  onRender,
  className,
}: SignboardPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cssWidth, setCssWidth] = useState(0);

  // The canvas has to be told its pixel size in numbers, so the layout width has
  // to be measured rather than inherited from CSS.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setCssWidth(entry.contentRect.width);
    });
    observer.observe(wrapper);
    setCssWidth(wrapper.clientWidth);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size || !wordmark || cssWidth <= 0) return;

    const ratio = aspectRatio(size);
    const density = Math.min(window.devicePixelRatio || 1, MAX_PREVIEW_WIDTH_PX / cssWidth);
    const width = Math.max(1, Math.round(cssWidth * density));
    const height = Math.max(1, Math.round(width / ratio));

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const report = drawSignboard(ctx, {
      width,
      height,
      content,
      wordmark,
      fontFamily,
      layoutId,
    });
    onRender?.(report);
  }, [content, size, wordmark, fontFamily, layoutId, cssWidth, onRender]);

  return (
    <div ref={wrapperRef} className={className}>
      {size && wordmark ? (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Signboard preview for ${content.shopName}`}
          className="block h-auto w-full rounded-md shadow-sm"
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-md bg-gray-100 text-sm text-gray-500"
          style={{ aspectRatio: '5 / 1' }}
        >
          {wordmark ? 'Enter a width and height to preview' : 'Loading signboard artwork…'}
        </div>
      )}
    </div>
  );
}

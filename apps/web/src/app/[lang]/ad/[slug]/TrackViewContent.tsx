'use client';

import { useEffect } from 'react';
import { trackViewContent } from '@/lib/metaPixel';

interface TrackViewContentProps {
  id: number | string;
  title: string;
  price?: number | null;
  category?: string | null;
}

/** Fires a Meta Pixel ViewContent once when an ad detail page mounts. */
export default function TrackViewContent({ id, title, price, category }: TrackViewContentProps) {
  useEffect(() => {
    trackViewContent({ id, title, price, category });
  }, [id, title, price, category]);

  return null;
}

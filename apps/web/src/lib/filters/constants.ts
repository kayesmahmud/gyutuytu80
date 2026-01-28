/**
 * Shared constants for the ads filter system
 * Used by desktop sidebar, mobile drawer, and carousel
 * Designed for future React Native mobile app reuse
 */

import type { FilterOption } from './types';

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'newest', label: 'Newest First', icon: '📅' },
  { value: 'oldest', label: 'Oldest First', icon: '📅' },
  { value: 'price_asc', label: 'Price: Low to High', icon: '💰' },
  { value: 'price_desc', label: 'Price: High to Low', icon: '💰' },
];

export const CONDITION_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any Condition', icon: null },
  { value: 'Brand New', label: 'Brand New', icon: '✨' },
  { value: 'Used', label: 'Used', icon: '♻️' },
];

/** Default sort value */
export const DEFAULT_SORT = 'newest';

/** Default condition value (empty = any) */
export const DEFAULT_CONDITION = '';

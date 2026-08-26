import { describe, it, expect } from 'vitest';
import { normalizeTitle, suggestCategory } from '@/lib/categorySuggest';
import type { CategoryKeyword } from '@thulobazaar/types';

const KEYWORDS: CategoryKeyword[] = [
  { keyword: 'redmi', categoryId: 1, subcategoryId: 101 },
  { keyword: 'iphone', categoryId: 1, subcategoryId: 101 },
  { keyword: 'apartment', categoryId: 5, subcategoryId: 502 },
  { keyword: 'apartment for rent', categoryId: 5, subcategoryId: 503 },
  { keyword: 'ropani', categoryId: 5, subcategoryId: 501 },
  { keyword: 'कुखुरा', categoryId: 6, subcategoryId: 602 },
  { keyword: 'cat', categoryId: 6, subcategoryId: 601 },
];

describe('normalizeTitle', () => {
  it('lowercases and turns punctuation into spaces', () => {
    expect(normalizeTitle('iPhone-15, Pro!! (256GB)')).toBe('iphone 15 pro 256gb');
  });

  it('preserves Devanagari vowel signs (\\p{M})', () => {
    // Without \p{M} in the keep-class, कुखुरा would be shredded to "क ख र"
    expect(normalizeTitle('कुखुरा बिक्रीमा')).toBe('कुखुरा बिक्रीमा');
  });
});

describe('suggestCategory', () => {
  it('matches a brand keyword anywhere in the title', () => {
    const s = suggestCategory('Redmi Note 12 Pro fresh condition', KEYWORDS);
    expect(s).toMatchObject({ categoryId: 1, subcategoryId: 101 });
  });

  it('prefers the longest matching keyword', () => {
    const s = suggestCategory('2BHK apartment for rent in Baneshwor', KEYWORDS);
    expect(s?.subcategoryId).toBe(503);
  });

  it('matches only at word boundaries', () => {
    expect(suggestCategory('Categorized storage boxes', KEYWORDS)).toBeNull();
  });

  it('matches Devanagari keywords', () => {
    const s = suggestCategory('लोकल कुखुरा बिक्रीमा', KEYWORDS);
    expect(s?.subcategoryId).toBe(602);
  });

  it('matches Romanized Nepali land units', () => {
    const s = suggestCategory('4 ropani jagga sasto ma', KEYWORDS);
    expect(s?.subcategoryId).toBe(501);
  });

  it('matches short keywords once 3 chars are typed', () => {
    expect(suggestCategory('cat', KEYWORDS)?.subcategoryId).toBe(601);
  });

  it('returns null for input under 3 normalized chars', () => {
    expect(suggestCategory('ca', KEYWORDS)).toBeNull();
  });

  it('returns null when nothing matches', () => {
    expect(suggestCategory('random gibberish title here', KEYWORDS)).toBeNull();
  });
});

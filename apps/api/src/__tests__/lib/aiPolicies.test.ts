import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    categories: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@thulobazaar/database';
import {
  getCorePolicy,
  getCategoryPolicy,
  resolveParentCategorySlug,
} from '../../lib/ai/policies.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('policy file loading', () => {
  it('loads core.md from apps/api/policies', async () => {
    const core = await getCorePolicy();
    expect(core).toContain('first-pass moderator');
    expect(core).toContain('"prohibited"');
  });

  it('returns null for missing or invalid category slugs (fail-open)', async () => {
    expect(await getCategoryPolicy('no-such-category-slug')).toBeNull();
    expect(await getCategoryPolicy(null)).toBeNull();
    // traversal and out-of-charset slugs are rejected before touching the FS
    expect(await getCategoryPolicy('../core')).toBeNull();
    expect(await getCategoryPolicy('Mobiles')).toBeNull();
    expect(await getCategoryPolicy('a/b')).toBeNull();
  });
});

describe('resolveParentCategorySlug', () => {
  it('returns the slug directly for a parent category', async () => {
    vi.mocked(prisma.categories.findUnique).mockResolvedValueOnce({
      slug: 'mobiles',
      parent_id: null,
    } as any);
    expect(await resolveParentCategorySlug(1)).toBe('mobiles');
  });

  it('walks up to the parent for a leaf category', async () => {
    vi.mocked(prisma.categories.findUnique)
      .mockResolvedValueOnce({ slug: 'mobile-phones', parent_id: 1 } as any)
      .mockResolvedValueOnce({ slug: 'mobiles' } as any);
    expect(await resolveParentCategorySlug(101)).toBe('mobiles');
  });

  it('fails open to null on missing ids, null input, and DB errors', async () => {
    vi.mocked(prisma.categories.findUnique).mockResolvedValueOnce(null as any);
    expect(await resolveParentCategorySlug(999)).toBeNull();
    expect(await resolveParentCategorySlug(null)).toBeNull();
    vi.mocked(prisma.categories.findUnique).mockRejectedValueOnce(new Error('db down'));
    expect(await resolveParentCategorySlug(1)).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    locations: { findUnique: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('../../jobs/promotionCleanup.js', () => ({
  clearExpiredPromotionFlags: vi.fn(),
}));

import { prisma } from '@thulobazaar/database';
import {
  validateAdLocation,
  AD_LOCATION_TIER_MESSAGE,
  AD_LOCATION_AREA_MESSAGE,
} from '../../services/ad.service.js';

const findUnique = prisma.locations.findUnique as ReturnType<typeof vi.fn>;
const count = prisma.locations.count as ReturnType<typeof vi.fn>;

describe('validateAdLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    count.mockResolvedValue(0);
  });

  it('accepts an area', async () => {
    findUnique.mockResolvedValue({ type: 'area' });
    await expect(validateAdLocation(1)).resolves.toBeNull();
  });

  it('accepts a municipality that has no areas', async () => {
    findUnique.mockResolvedValue({ type: 'municipality' });
    count.mockResolvedValue(0);
    await expect(validateAdLocation(1)).resolves.toBeNull();
  });

  // Kathmandu Metropolitan City — subdivided, so the seller must name an area.
  it('rejects a municipality that has areas', async () => {
    findUnique.mockResolvedValue({ type: 'municipality' });
    count.mockResolvedValue(104);
    await expect(validateAdLocation(1)).resolves.toBe(AD_LOCATION_AREA_MESSAGE);
  });

  it('never asks an area for sub-areas', async () => {
    findUnique.mockResolvedValue({ type: 'area' });
    await validateAdLocation(1);
    expect(count).not.toHaveBeenCalled();
  });

  // The exact tiers that produced the 112 bad ads in production.
  it.each(['province', 'district'])('rejects a %s', async (type) => {
    findUnique.mockResolvedValue({ type });
    await expect(validateAdLocation(1)).resolves.toBe(AD_LOCATION_TIER_MESSAGE);
  });

  it('rejects a location id that does not exist', async () => {
    findUnique.mockResolvedValue(null);
    await expect(validateAdLocation(999999)).resolves.toBe(AD_LOCATION_TIER_MESSAGE);
  });
});

import { describe, it, expect } from 'vitest';
import { isTierAtLeast, isValidAdLocationTier, MIN_AD_LOCATION_TIER } from '@/lib/location/tiers';

describe('isValidAdLocationTier', () => {
  it.each(['municipality', 'area'])('accepts %s', (type) => {
    expect(isValidAdLocationTier(type)).toBe(true);
  });

  // These two tiers are what the post-ad form used to prefill and accept.
  it.each(['province', 'district'])('rejects %s', (type) => {
    expect(isValidAdLocationTier(type)).toBe(false);
  });

  it.each([null, undefined, '', 'ward'])('rejects %s', (type) => {
    expect(isValidAdLocationTier(type)).toBe(false);
  });

  it('is pinned to municipality', () => {
    expect(MIN_AD_LOCATION_TIER).toBe('municipality');
  });
});

describe('isTierAtLeast', () => {
  it('orders tiers coarsest to most precise', () => {
    expect(isTierAtLeast('area', 'province')).toBe(true);
    expect(isTierAtLeast('district', 'municipality')).toBe(false);
    expect(isTierAtLeast('district', 'district')).toBe(true);
  });

  it('rejects an unknown tier against any minimum', () => {
    expect(isTierAtLeast('galaxy', 'province')).toBe(false);
  });
});

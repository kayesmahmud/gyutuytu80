import { describe, it, expect } from 'vitest';
import { resolveDistrictName } from '@/lib/location/district';

// Chains are stored leaf-first, each node pointing at its parent.
const area = {
  name: 'Kapan', type: 'area',
  locations: {
    name: 'Budhanilkantha Municipality', type: 'municipality',
    locations: { name: 'Kathmandu', type: 'district', locations: { name: 'Bagmati Province', type: 'province' } },
  },
};

describe('resolveDistrictName', () => {
  it('climbs two levels from an area', () => {
    expect(resolveDistrictName(area)).toBe('Kathmandu');
  });

  it('climbs one level from a municipality', () => {
    expect(resolveDistrictName(area.locations)).toBe('Kathmandu');
  });

  it('returns a district as-is', () => {
    expect(resolveDistrictName(area.locations.locations)).toBe('Kathmandu');
  });

  // The 56 legacy ads with no district above them show their province, not nothing.
  it('falls back to the province when no district exists above it', () => {
    expect(resolveDistrictName({ name: 'Bagmati Province', type: 'province' })).toBe('Bagmati Province');
  });

  it('falls back to the leaf name when the chain has no district', () => {
    expect(resolveDistrictName({ name: 'Orphan Place', type: 'municipality', locations: null })).toBe('Orphan Place');
  });

  it('returns null for a missing location', () => {
    expect(resolveDistrictName(null)).toBeNull();
    expect(resolveDistrictName(undefined)).toBeNull();
  });
});

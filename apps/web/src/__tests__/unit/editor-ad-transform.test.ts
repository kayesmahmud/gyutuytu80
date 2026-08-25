import { describe, it, expect } from 'vitest';
import { transformAd } from '../../app/[lang]/editor/ad-management/types';

describe('transformAd category/subcategory', () => {
  const base = {
    id: 1,
    title: 'Test ad',
    description: 'desc',
    price: 100,
    status: 'pending',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  it('splits parent/leaf into category and subcategory (camelCase API shape)', () => {
    const ad = transformAd({
      ...base,
      categoryName: 'Mobile Phones',
      parentCategoryName: 'Mobiles',
      locationName: 'Koshi Province',
    });
    expect(ad.category).toBe('Mobiles');
    expect(ad.subcategory).toBe('Mobile Phones');
    expect(ad.location).toBe('Koshi Province');
  });

  it('treats a parentless category as the main category with no subcategory', () => {
    const ad = transformAd({ ...base, categoryName: 'Home & Living', parentCategoryName: null });
    expect(ad.category).toBe('Home & Living');
    expect(ad.subcategory).toBeUndefined();
  });

  it('still accepts legacy snake_case fields', () => {
    const ad = transformAd({ ...base, category_name: 'Vehicles', location_name: 'Bagmati' });
    expect(ad.category).toBe('Vehicles');
    expect(ad.subcategory).toBeUndefined();
    expect(ad.location).toBe('Bagmati');
  });

  it('falls back to empty strings when no category/location is present', () => {
    const ad = transformAd(base);
    expect(ad.category).toBe('');
    expect(ad.location).toBe('');
  });
});

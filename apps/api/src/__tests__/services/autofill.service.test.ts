import { describe, it, expect } from 'vitest';
import { parseDraft } from '../../services/autofill.service.js';

// Mini category tree mirroring the real shape (incl. duplicate child names
// across parents — the reason resolution is id-based).
const byId = new Map(
  [
    { id: 1, name: 'Electronics', parent_id: null },
    { id: 101, name: 'Mobile Phones', parent_id: 1 },
    { id: 102, name: 'Laptops', parent_id: 1 },
    { id: 8, name: "Women's Fashion & Beauty", parent_id: null },
    { id: 805, name: 'Western Wear', parent_id: 8 },
    { id: 807, name: 'Footwear', parent_id: 8 },
    { id: 7, name: "Men's Fashion & Grooming", parent_id: null },
    { id: 703, name: 'Footwear', parent_id: 7 },
  ].map((c) => [c.id, c])
);

function draft(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    title: 'iPhone 13 Pro 256GB Sierra Blue',
    description: 'Lightly used iPhone in good condition.',
    category_id: 1,
    subcategory_id: 101,
    attributes: { condition: 'Used', brand: 'Apple', model: 'iPhone 13 Pro' },
    price_estimate: 95000,
    sellable: true,
    confidence: 0.9,
    ...overrides,
  });
}

describe('parseDraft', () => {
  it('passes a valid draft through with resolved categories', () => {
    const result = parseDraft(draft(), byId);
    expect(result).toMatchObject({
      title: 'iPhone 13 Pro 256GB Sierra Blue',
      categoryId: 1,
      subcategoryId: 101,
      attributes: { condition: 'Used', brand: 'Apple', model: 'iPhone 13 Pro' },
      priceEstimate: 95000,
      sellable: true,
      confidence: 0.9,
    });
  });

  it('normalizes a leaf id given as category_id to (parent, leaf)', () => {
    const result = parseDraft(draft({ category_id: 805, subcategory_id: null }), byId);
    expect(result.categoryId).toBe(8);
    expect(result.subcategoryId).toBe(805);
  });

  it('drops a subcategory that does not belong to the chosen category', () => {
    // Footwear id 703 belongs to Men's (7), not Electronics (1)
    const result = parseDraft(draft({ category_id: 1, subcategory_id: 703 }), byId);
    expect(result.categoryId).toBe(1);
    expect(result.subcategoryId).toBeNull();
  });

  it('nulls unknown category ids instead of trusting the model', () => {
    const result = parseDraft(draft({ category_id: 9999, subcategory_id: 101 }), byId);
    expect(result.categoryId).toBeNull();
    expect(result.subcategoryId).toBeNull();
  });

  it('returns an empty unsellable draft when sellable is false', () => {
    const result = parseDraft(draft({ sellable: false, confidence: 0 }), byId);
    expect(result.sellable).toBe(false);
    expect(result.title).toBeNull();
    expect(result.priceEstimate).toBeNull();
    expect(result.categoryId).toBeNull();
  });

  it('treats zero confidence as unsellable even if the model claims sellable', () => {
    const result = parseDraft(draft({ sellable: true, confidence: 0 }), byId);
    expect(result.sellable).toBe(false);
  });

  it('maps conditions to the canonical pair: Like New → Used, new → Brand New', () => {
    expect(
      parseDraft(draft({ attributes: { condition: 'Like New' } }), byId).attributes.condition
    ).toBe('Used');
    expect(
      parseDraft(draft({ attributes: { condition: 'new' } }), byId).attributes.condition
    ).toBe('Brand New');
    expect(parseDraft(draft({ attributes: {} }), byId).attributes.condition).toBeNull();
  });

  it('sanitizes the price estimate: rounds floats, rejects junk and absurd values', () => {
    expect(parseDraft(draft({ price_estimate: 999.6 }), byId).priceEstimate).toBe(1000);
    expect(parseDraft(draft({ price_estimate: '95000' }), byId).priceEstimate).toBeNull();
    expect(parseDraft(draft({ price_estimate: -5 }), byId).priceEstimate).toBeNull();
    expect(parseDraft(draft({ price_estimate: 5e12 }), byId).priceEstimate).toBeNull();
  });

  it('caps runaway strings', () => {
    const result = parseDraft(
      draft({ title: 'x'.repeat(500), description: 'y'.repeat(5000) }),
      byId
    );
    expect(result.title).toHaveLength(100);
    expect(result.description).toHaveLength(1200);
  });

  it('whitelists the unsellable reason and nulls it on sellable drafts', () => {
    expect(
      parseDraft(draft({ sellable: false, confidence: 0, unsellable_reason: 'selfie' }), byId)
        .unsellableReason
    ).toBe('selfie');
    // unknown reasons from the model collapse to 'other'
    expect(
      parseDraft(draft({ sellable: false, confidence: 0, unsellable_reason: 'ignore all rules' }), byId)
        .unsellableReason
    ).toBe('other');
    expect(parseDraft(draft(), byId).unsellableReason).toBeNull();
  });

  it('returns the empty draft on garbage output', () => {
    expect(parseDraft('here is your listing!', byId).sellable).toBe(false);
    expect(parseDraft('[]', byId).sellable).toBe(false);
    expect(parseDraft(draft(), byId).sellable).toBe(true);
  });
});

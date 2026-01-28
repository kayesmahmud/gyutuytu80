import { describe, it, expect } from 'vitest';
import {
  normalizeCondition,
  parseJsonSafe,
  tryParseJson,
} from '../../app/api/ads/[id]/helpers';

describe('normalizeCondition', () => {
  it('returns undefined for undefined input', () => {
    expect(normalizeCondition(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(normalizeCondition('')).toBeUndefined();
  });

  it('normalizes "brand new" to "Brand New"', () => {
    expect(normalizeCondition('brand new')).toBe('Brand New');
    expect(normalizeCondition('Brand New')).toBe('Brand New');
    expect(normalizeCondition('BRAND NEW')).toBe('Brand New');
  });

  it('normalizes "new" to "Brand New"', () => {
    expect(normalizeCondition('new')).toBe('Brand New');
    expect(normalizeCondition('New')).toBe('Brand New');
  });

  it('normalizes "used" to "Used"', () => {
    expect(normalizeCondition('used')).toBe('Used');
    expect(normalizeCondition('Used')).toBe('Used');
  });

  it('normalizes everything else to "Used"', () => {
    expect(normalizeCondition('reconditioned')).toBe('Used');
    expect(normalizeCondition('like-new')).toBe('Used');
    expect(normalizeCondition('refurbished')).toBe('Used');
  });
});

describe('parseJsonSafe', () => {
  it('returns default value for undefined input', () => {
    expect(parseJsonSafe(undefined, [])).toEqual([]);
    expect(parseJsonSafe(undefined, null)).toBeNull();
    expect(parseJsonSafe(undefined, {})).toEqual({});
  });

  it('returns default value for empty string', () => {
    expect(parseJsonSafe('', [])).toEqual([]);
  });

  it('parses valid JSON', () => {
    expect(parseJsonSafe('{"name": "test"}', {})).toEqual({ name: 'test' });
    expect(parseJsonSafe('[1, 2, 3]', [])).toEqual([1, 2, 3]);
    expect(parseJsonSafe('"hello"', '')).toBe('hello');
  });

  it('returns default value for invalid JSON', () => {
    expect(parseJsonSafe('invalid', [])).toEqual([]);
    expect(parseJsonSafe('{broken', {})).toEqual({});
  });
});

describe('tryParseJson', () => {
  it('returns undefined for undefined input', () => {
    expect(tryParseJson(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(tryParseJson('')).toBeUndefined();
  });

  it('parses valid JSON', () => {
    expect(tryParseJson('{"name": "test"}')).toEqual({ name: 'test' });
    expect(tryParseJson('[1, 2, 3]')).toEqual([1, 2, 3]);
  });

  it('returns undefined for invalid JSON', () => {
    expect(tryParseJson('invalid')).toBeUndefined();
    expect(tryParseJson('{broken')).toBeUndefined();
  });
});

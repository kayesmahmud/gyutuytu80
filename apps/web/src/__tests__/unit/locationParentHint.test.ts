import { describe, it, expect } from 'vitest';
import { buildParentHint, buildReversedPath } from '@/components/CascadingLocationFilter/helpers';

// The API sends `hierarchy` root → leaf; both helpers read it that way.
const thamel = {
  hierarchy: [
    { name: 'Bagmati Province' },
    { name: 'Kathmandu' },
    { name: 'Kathmandu Metropolitan City' },
    { name: 'Thamel' },
  ],
};

describe('buildParentHint', () => {
  it('lists the ancestors nearest-first, without the result itself', () => {
    expect(buildParentHint(thamel)).toBe(
      'Kathmandu Metropolitan City, Kathmandu, Bagmati Province'
    );
  });

  it('returns empty for a province, which has no ancestors', () => {
    expect(buildParentHint({ hierarchy: [{ name: 'Bagmati Province' }] })).toBe('');
  });

  it('returns empty when the API sent no hierarchy', () => {
    expect(buildParentHint({})).toBe('');
  });
});

describe('buildReversedPath', () => {
  it('includes the result itself, leaf first', () => {
    expect(buildReversedPath(thamel)).toBe(
      'Thamel, Kathmandu Metropolitan City, Kathmandu, Bagmati Province'
    );
  });
});

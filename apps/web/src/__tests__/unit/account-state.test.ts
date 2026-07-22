import { describe, it, expect } from 'vitest';
import { getAccountState, type SuspendedUser } from '@/app/[lang]/super-admin/verifications/types';

function makeUser(overrides: Partial<SuspendedUser>): SuspendedUser {
  return {
    id: 1,
    fullName: 'Test User',
    email: 'test@example.com',
    phone: null,
    isActive: true,
    isSuspended: false,
    deletedAt: null,
    businessVerificationStatus: null,
    createdAt: '2026-07-01T00:00:00Z',
    shopSlug: null,
    adCount: 0,
    ...overrides,
  };
}

describe('getAccountState', () => {
  it('labels truly suspended users as suspended', () => {
    expect(getAccountState(makeUser({ isSuspended: true, isActive: false }))).toBe('suspended');
  });

  it('labels self-deleted accounts as deletion-pending, not suspended', () => {
    expect(
      getAccountState(makeUser({ isActive: false, deletedAt: '2026-07-18T00:00:00Z' }))
    ).toBe('deletion-pending');
  });

  it('labels inactive accounts without a deletion request as deactivated', () => {
    expect(getAccountState(makeUser({ isActive: false }))).toBe('deactivated');
  });

  it('falls back to rejected for active users with rejected verification', () => {
    expect(getAccountState(makeUser({ businessVerificationStatus: 'rejected' }))).toBe('rejected');
  });

  it('prefers suspended over deletion-pending when both apply', () => {
    expect(
      getAccountState(
        makeUser({ isSuspended: true, isActive: false, deletedAt: '2026-07-18T00:00:00Z' })
      )
    ).toBe('suspended');
  });
});

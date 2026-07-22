import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    ads: {
      updateMany: vi.fn(),
    },
    refresh_tokens: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

import { prisma } from '@thulobazaar/database';
import { purgeDeletedAccounts } from '../../jobs/accountPurge.js';

const expiredAccount = {
  id: 48,
  email: 'pranbi@test.com',
  phone: '9800000000',
  full_name: 'pranbi thapa',
  deletion_requested_at: new Date('2026-05-04'),
};

describe('purgeDeletedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when no accounts are past the recovery window', async () => {
    vi.mocked(prisma.users.findMany).mockResolvedValue([] as any);

    const result = await purgeDeletedAccounts();

    expect(result.purged).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('scrubs password_hash with a non-null sentinel (NOT NULL column)', async () => {
    vi.mocked(prisma.users.findMany).mockResolvedValue([expiredAccount] as any);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any);

    const result = await purgeDeletedAccounts();

    expect(result.purged).toBe(1);
    const updateArgs = vi.mocked(prisma.users.update).mock.calls[0]?.[0];
    expect(updateArgs?.where).toEqual({ id: 48 });
    expect(updateArgs?.data.password_hash).toBeTypeOf('string');
    expect(updateArgs?.data.password_hash).not.toBeNull();
    expect(updateArgs?.data.email).toBeNull();
    expect(updateArgs?.data.full_name).toBe('Deleted User');
  });

  it('reports failed purges instead of counting them as purged', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(prisma.users.findMany).mockResolvedValue([expiredAccount] as any);
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error('validation failed'));

    const result = await purgeDeletedAccounts();

    expect(result.purged).toBe(0);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('INCOMPLETE'),
    );
    errorSpy.mockRestore();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Support case 2026-09-17: a seller who had changed his number typed the OLD
// one and the web said "No account found with this phone number" — a
// confusing message that also told anyone probing which numbers have
// accounts. The Express phone-login route already answers unknown-number and
// wrong-password identically (AUTH-M2); NextAuth must match it, and the form
// then shows one translated message that carries the "changed your number?"
// hint. These tests pin that contract.

vi.mock('@thulobazaar/database', () => ({ prisma: {} }));
vi.mock('@/lib/auth/helpers', () => ({
  findUserForAuth: vi.fn(),
  validateUserStatus: vi.fn(() => null),
  verifyPassword: vi.fn(),
  verify2FA: vi.fn(),
  reactivateUser: vi.fn(),
  buildSessionUser: vi.fn((u: unknown) => u),
}));

import { authOptions } from '@/lib/auth/authOptions';
import { findUserForAuth, verifyPassword } from '@/lib/auth/helpers';

type Authorize = (creds: Record<string, string>) => Promise<unknown>;
function credentialsAuthorize(): Authorize {
  // Two credentials providers exist and next-auth gives both the default
  // top-level id; the configured id lives in `options`. Pick the phone one.
  const provider = (authOptions.providers as unknown as Array<{
    type: string;
    options?: { id?: string; authorize?: Authorize };
    authorize?: Authorize;
  }>).find((p) => p.type === 'credentials' && p.options?.id === 'credentials');
  if (!provider) throw new Error('phone credentials provider not found');
  const fn = provider.options?.authorize ?? provider.authorize;
  if (!fn) throw new Error('credentials provider has no authorize()');
  return fn;
}

const GENERIC = 'Invalid phone number or password';

describe('NextAuth phone login — error messages', () => {
  beforeEach(() => {
    vi.mocked(findUserForAuth).mockReset();
    vi.mocked(verifyPassword).mockReset();
  });

  it('unknown phone number gets the same generic message as a wrong password', async () => {
    vi.mocked(findUserForAuth).mockResolvedValue(null);
    await expect(
      credentialsAuthorize()({ loginType: 'phone', phone: '9813411423', password: 'gkaar302' })
    ).rejects.toThrow(GENERIC);
  });

  it('wrong password gets the generic message', async () => {
    vi.mocked(findUserForAuth).mockResolvedValue({
      id: 1009, phone: '9808700678', password_hash: 'x', is_active: true, is_suspended: false,
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);
    await expect(
      credentialsAuthorize()({ loginType: 'phone', phone: '9808700678', password: 'nope' })
    ).rejects.toThrow(GENERIC);
  });

  it('never says "No account found" (account-existence leak)', async () => {
    vi.mocked(findUserForAuth).mockResolvedValue(null);
    await expect(
      credentialsAuthorize()({ loginType: 'phone', phone: '9813411423', password: 'x' })
    ).rejects.not.toThrow(/no account found/i);
  });
});

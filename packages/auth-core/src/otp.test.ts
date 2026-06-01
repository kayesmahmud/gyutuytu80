import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database. Only the calls sendOtp() makes for `phone_verification`
// are stubbed: a users lookup (the duplicate guard) and the phone_otps writes.
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: { findFirst: vi.fn() },
    phone_otps: {
      findFirst: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Keep the real phone formatting/validation; only stub the actual SMS send so
// no network/provider call happens and we can assert whether it was reached.
vi.mock('./sms', async (importActual) => {
  const actual = await importActual<typeof import('./sms')>();
  return { ...actual, sendOtpSms: vi.fn() };
});

import { sendOtp } from './otp';
import { prisma } from '@thulobazaar/database';
import { sendOtpSms } from './sms';

const FREE_NUMBER = '9812345678';
const TAKEN_NUMBER = '9898765432';
const CURRENT_USER_ID = 42;

/** Default the happy-path collaborators so a number is treated as free + sendable. */
function mockNumberIsFreeAndSendable() {
  vi.mocked(prisma.users.findFirst).mockResolvedValue(null); // nobody else owns it
  vi.mocked(prisma.phone_otps.findFirst).mockResolvedValue(null); // no cooldown
  vi.mocked(prisma.phone_otps.count).mockResolvedValue(0); // under hourly cap
  vi.mocked(prisma.phone_otps.updateMany).mockResolvedValue({ count: 0 } as never);
  vi.mocked(prisma.phone_otps.create).mockResolvedValue({} as never);
  vi.mocked(sendOtpSms).mockResolvedValue({ success: true } as never);
}

describe("sendOtp — purpose 'phone_verification'", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Case (a): email-only signup user adding their FIRST phone ──────────────
  it('lets an email-only user (no currentUserId) add a free number and sends one SMS', async () => {
    mockNumberIsFreeAndSendable();

    const result = await sendOtp(FREE_NUMBER, 'phone_verification');

    expect(result.success).toBe(true);
    expect(result.identifier).toBe('9812345678');
    expect(sendOtpSms).toHaveBeenCalledTimes(1);

    // No currentUserId → duplicate check must NOT exclude any user by id.
    const where = vi.mocked(prisma.users.findFirst).mock.calls[0][0]!.where as Record<string, unknown>;
    expect(where).toMatchObject({ phone: '9812345678', phone_verified: true });
    expect(where).not.toHaveProperty('id');
  });

  // ── Case (c): existing user re-verifying / changing — own number excluded ──
  it('passes currentUserId so a user can re-verify their OWN number', async () => {
    mockNumberIsFreeAndSendable();

    const result = await sendOtp(FREE_NUMBER, 'phone_verification', {
      currentUserId: CURRENT_USER_ID,
    });

    expect(result.success).toBe(true);
    expect(sendOtpSms).toHaveBeenCalledTimes(1);

    // The duplicate query must exclude the current user: id: { not: 42 }.
    const where = vi.mocked(prisma.users.findFirst).mock.calls[0][0]!.where as Record<string, unknown>;
    expect(where).toMatchObject({
      phone: '9812345678',
      phone_verified: true,
      id: { not: CURRENT_USER_ID },
    });
  });

  // ── Case (b): number already verified by ANOTHER account ───────────────────
  it('rejects a number already in use BEFORE sending any SMS', async () => {
    // Another account already owns this verified number.
    vi.mocked(prisma.users.findFirst).mockResolvedValue({
      id: 7,
      phone: TAKEN_NUMBER,
      phone_verified: true,
    } as never);

    const result = await sendOtp(TAKEN_NUMBER, 'phone_verification', {
      currentUserId: CURRENT_USER_ID,
    });

    // Robust: assert the behavior, not the exact copy. The number is rejected...
    expect(result.success).toBe(false);
    // ...and crucially, no SMS was ever sent — the guard exits before texting.
    expect(sendOtpSms).not.toHaveBeenCalled();
    // The cooldown / OTP-creation path is never reached either.
    expect(prisma.phone_otps.create).not.toHaveBeenCalled();
  });
});

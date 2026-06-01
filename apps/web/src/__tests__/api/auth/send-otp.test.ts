import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// The OTP logic now lives in @thulobazaar/auth-core (single source of truth with
// the Express API). This route is a thin HTTP wrapper, so these tests mock
// `sendOtp` and verify the wrapper's own responsibilities: input validation,
// mapping the result to the right HTTP status, and passing the logged-in user's
// id through for phone_verification. The OTP logic itself is covered where it
// lives, in auth-core.
const mockSendOtp = vi.fn();
const mockGetServerSession = vi.fn();

vi.mock('@thulobazaar/auth-core', () => ({
  sendOtp: (...args: unknown[]) => mockSendOtp(...args),
}));

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

function createMockRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3333/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/send-otp (wrapper)', () => {
  let POST: typeof import('@/app/api/auth/send-otp/route').POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Default: a successful send
    mockSendOtp.mockResolvedValue({
      success: true,
      identifier: '9800000000',
      expiresIn: 600,
    });
    mockGetServerSession.mockResolvedValue(null);

    const routeModule = await import('@/app/api/auth/send-otp/route');
    POST = routeModule.POST;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('returns 400 when phone is missing (does not call sendOtp)', async () => {
      const response = await POST(createMockRequest({ purpose: 'registration' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
      expect(mockSendOtp).not.toHaveBeenCalled();
    });

    it('returns 400 for an invalid purpose', async () => {
      const response = await POST(
        createMockRequest({ phone: '9800000000', purpose: 'invalid_purpose' })
      );
      expect(response.status).toBe(400);
      expect(mockSendOtp).not.toHaveBeenCalled();
    });
  });

  describe('Result -> HTTP status mapping', () => {
    it('200 on success and echoes identifier/expiresIn', async () => {
      const response = await POST(
        createMockRequest({ phone: '9800000000', purpose: 'registration' })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.identifier).toBe('9800000000');
      expect(data.expiresIn).toBe(600);
      expect(mockSendOtp).toHaveBeenCalledWith('9800000000', 'registration', {
        currentUserId: undefined,
      });
    });

    it('400 for a generic rejection (e.g. already registered)', async () => {
      mockSendOtp.mockResolvedValue({
        success: false,
        error: 'This phone number is already registered',
      });
      const response = await POST(
        createMockRequest({ phone: '9800000000', purpose: 'registration' })
      );
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.message).toContain('already registered');
    });

    it('404 when no account is found', async () => {
      mockSendOtp.mockResolvedValue({
        success: false,
        error: 'No account found with this phone number',
      });
      const response = await POST(
        createMockRequest({ phone: '9800000000', purpose: 'login' })
      );
      expect(response.status).toBe(404);
    });

    it('403 when the account is suspended', async () => {
      mockSendOtp.mockResolvedValue({
        success: false,
        error: 'Your account has been suspended. Please contact support.',
      });
      const response = await POST(
        createMockRequest({ phone: '9800000000', purpose: 'login' })
      );
      expect(response.status).toBe(403);
    });

    it('429 on cooldown, surfacing cooldownRemaining', async () => {
      mockSendOtp.mockResolvedValue({
        success: false,
        error: 'Please wait 30 seconds before requesting a new OTP',
        cooldownRemaining: 30,
      });
      const response = await POST(
        createMockRequest({ phone: '9800000000', purpose: 'registration' })
      );
      const data = await response.json();
      expect(response.status).toBe(429);
      expect(data.cooldownRemaining).toBe(30);
    });

    it('429 when too many OTP requests', async () => {
      mockSendOtp.mockResolvedValue({
        success: false,
        error: 'Too many OTP requests. Please try again after 1 hour.',
      });
      const response = await POST(
        createMockRequest({ phone: '9800000000', purpose: 'registration' })
      );
      expect(response.status).toBe(429);
    });
  });

  describe('phone_verification session pass-through', () => {
    it('passes the logged-in user id as currentUserId', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '42' } });
      await POST(
        createMockRequest({ phone: '9800000000', purpose: 'phone_verification' })
      );
      expect(mockSendOtp).toHaveBeenCalledWith('9800000000', 'phone_verification', {
        currentUserId: 42,
      });
    });

    it('passes undefined currentUserId when not logged in', async () => {
      mockGetServerSession.mockResolvedValue(null);
      await POST(
        createMockRequest({ phone: '9800000000', purpose: 'phone_verification' })
      );
      expect(mockSendOtp).toHaveBeenCalledWith('9800000000', 'phone_verification', {
        currentUserId: undefined,
      });
    });

    it('does not read the session for anonymous purposes', async () => {
      await POST(createMockRequest({ phone: '9800000000', purpose: 'registration' }));
      expect(mockGetServerSession).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('returns 500 on invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3333/api/auth/send-otp', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Create separate mock functions per model to avoid cross-contamination
const mockUsersFindFirst = vi.fn();
const mockOtpsFindFirst = vi.fn();
const mockOtpsCount = vi.fn();
const mockOtpsUpdateMany = vi.fn();
const mockOtpsCreate = vi.fn();

const mockValidateNepaliPhone = vi.fn();
const mockFormatPhoneNumber = vi.fn();
const mockGenerateOtp = vi.fn();
const mockSendOtpSms = vi.fn();
const mockGetOtpExpiry = vi.fn();

// Mock Prisma - separate mocks per model
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findFirst: (...args: unknown[]) => mockUsersFindFirst(...args),
    },
    phone_otps: {
      findFirst: (...args: unknown[]) => mockOtpsFindFirst(...args),
      count: (...args: unknown[]) => mockOtpsCount(...args),
      updateMany: (...args: unknown[]) => mockOtpsUpdateMany(...args),
      create: (...args: unknown[]) => mockOtpsCreate(...args),
    },
  },
}));

// Mock SMS functions
vi.mock('@/lib/sms', () => ({
  validateNepaliPhone: (...args: unknown[]) => mockValidateNepaliPhone(...args),
  formatPhoneNumber: (...args: unknown[]) => mockFormatPhoneNumber(...args),
  generateOtp: () => mockGenerateOtp(),
  sendOtpSms: (...args: unknown[]) => mockSendOtpSms(...args),
  getOtpExpiry: () => mockGetOtpExpiry(),
}));

// Helper to create mock requests
function createMockRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3333/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Setup default mock behaviors
function setupDefaultMocks() {
  mockValidateNepaliPhone.mockReturnValue(true);
  mockFormatPhoneNumber.mockImplementation((phone: string) => phone);
  mockGenerateOtp.mockReturnValue('123456');
  mockSendOtpSms.mockResolvedValue({ success: true, message: 'OTP sent' });
  mockGetOtpExpiry.mockReturnValue(new Date(Date.now() + 600000));

  // Default prisma mocks
  mockUsersFindFirst.mockResolvedValue(null);
  mockOtpsFindFirst.mockResolvedValue(null);
  mockOtpsCount.mockResolvedValue(0);
  mockOtpsUpdateMany.mockResolvedValue({ count: 0 });
  mockOtpsCreate.mockResolvedValue({ id: 1, phone: '9800000000', otp_code: '123456' });
}

describe('POST /api/auth/send-otp', () => {
  let POST: typeof import('@/app/api/auth/send-otp/route').POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    setupDefaultMocks();

    const routeModule = await import('@/app/api/auth/send-otp/route');
    POST = routeModule.POST;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Validation Tests
  // ==========================================
  describe('Validation', () => {
    it('should return 400 when phone not provided', async () => {
      const request = createMockRequest({
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for invalid purpose', async () => {
      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'invalid_purpose',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid Nepali phone number', async () => {
      mockValidateNepaliPhone.mockReturnValue(false);

      const request = createMockRequest({
        phone: '1234567890',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid Nepali phone number');
    });
  });

  // ==========================================
  // Registration Purpose Tests
  // ==========================================
  describe('Registration Purpose', () => {
    it('should return 400 if phone already registered', async () => {
      mockUsersFindFirst.mockResolvedValueOnce({
        id: 1,
        phone: '9800000000',
        phone_verified: true,
      });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already registered');
    });
  });

  // ==========================================
  // Login Purpose Tests
  // ==========================================
  describe('Login Purpose', () => {
    it('should return 404 if phone not registered for login', async () => {
      mockUsersFindFirst.mockResolvedValue(null);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'login',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No account found');
    });

    it('should return 403 if account suspended for login', async () => {
      mockUsersFindFirst.mockResolvedValueOnce({
        id: 1,
        phone: '9800000000',
        phone_verified: true,
        is_active: true,
        is_suspended: true,
      });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'login',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toContain('suspended');
    });
  });

  // ==========================================
  // Password Reset Purpose Tests
  // ==========================================
  describe('Password Reset Purpose', () => {
    it('should return 404 if account not found for password reset', async () => {
      mockUsersFindFirst.mockResolvedValue(null);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'password_reset',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No account found');
    });

    it('should return 403 if account suspended for password reset', async () => {
      mockUsersFindFirst.mockResolvedValueOnce({
        id: 1,
        phone: '9800000000',
        is_active: true,
        is_suspended: true,
      });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'password_reset',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toContain('suspended');
    });
  });

  // ==========================================
  // Rate Limiting Tests
  // ==========================================
  describe('Rate Limiting', () => {
    it('should return 429 if OTP requested within cooldown', async () => {
      // users.findFirst: no existing user (registration passes)
      mockUsersFindFirst.mockResolvedValueOnce(null);
      // phone_otps.findFirst: recent OTP exists (cooldown active)
      mockOtpsFindFirst.mockResolvedValueOnce({
        id: 1,
        phone: '9800000000',
        created_at: new Date(Date.now() - 30000), // 30 seconds ago
      });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Please wait');
      expect(data.cooldownRemaining).toBeDefined();
    });

    it('should return 429 if max attempts exceeded', async () => {
      mockUsersFindFirst.mockResolvedValue(null);
      mockOtpsFindFirst.mockResolvedValue(null); // No cooldown
      mockOtpsCount.mockResolvedValue(4); // MAX_OTP_ATTEMPTS = 4

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Too many OTP requests');
    });
  });

  // ==========================================
  // Successful OTP Send Tests
  // ==========================================
  describe('Successful OTP Send', () => {
    it('should send OTP via SMS for phone registration', async () => {
      mockUsersFindFirst.mockResolvedValue(null);
      mockOtpsFindFirst.mockResolvedValue(null);
      mockOtpsCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('SMS');
      expect(data.identifier).toBe('9800000000');
      expect(data.expiresIn).toBe(600);
      expect(mockSendOtpSms).toHaveBeenCalledWith('9800000000', '123456', 'registration');
    });

    it('should invalidate previous unused OTPs', async () => {
      mockUsersFindFirst.mockResolvedValue(null);
      mockOtpsFindFirst.mockResolvedValue(null);
      mockOtpsCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      await POST(request);

      expect(mockOtpsUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            phone: '9800000000',
            purpose: 'registration',
            is_used: false,
          }),
          data: { is_used: true },
        })
      );
    });

    it('should store new OTP in database', async () => {
      mockUsersFindFirst.mockResolvedValue(null);
      mockOtpsFindFirst.mockResolvedValue(null);
      mockOtpsCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      await POST(request);

      expect(mockOtpsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '9800000000',
            otp_code: '123456',
            purpose: 'registration',
          }),
        })
      );
    });

    it('should send OTP for password reset with phone', async () => {
      mockUsersFindFirst.mockResolvedValueOnce({
        id: 1,
        phone: '9800000000',
        password_hash: 'hashedpassword',
        is_active: true,
        is_suspended: false,
      });
      mockOtpsFindFirst.mockResolvedValue(null);
      mockOtpsCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'password_reset',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendOtpSms).toHaveBeenCalledWith('9800000000', '123456', 'password_reset');
    });

    it('should send OTP for login with existing user', async () => {
      mockUsersFindFirst.mockResolvedValueOnce({
        id: 1,
        phone: '9800000000',
        phone_verified: true,
        is_active: true,
        is_suspended: false,
      });
      mockOtpsFindFirst.mockResolvedValue(null);
      mockOtpsCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'login',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendOtpSms).toHaveBeenCalledWith('9800000000', '123456', 'login');
    });
  });

  // ==========================================
  // Phone Verification Purpose Tests
  // ==========================================
  describe('Phone Verification Purpose', () => {
    it('should return 400 if phone already verified by another user', async () => {
      mockUsersFindFirst.mockResolvedValueOnce({
        id: 2,
        phone: '9800000000',
        phone_verified: true,
      });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'phone_verification',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already verified');
    });

    it('should send OTP for phone verification if not verified', async () => {
      mockUsersFindFirst.mockResolvedValue(null);
      mockOtpsFindFirst.mockResolvedValue(null);
      mockOtpsCount.mockResolvedValue(0);

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'phone_verification',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendOtpSms).toHaveBeenCalledWith('9800000000', '123456', 'phone_verification');
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================
  describe('Error Handling', () => {
    it('should return 500 if SMS sending fails', async () => {
      mockUsersFindFirst.mockResolvedValue(null);
      mockOtpsFindFirst.mockResolvedValue(null);
      mockOtpsCount.mockResolvedValue(0);
      mockSendOtpSms.mockResolvedValue({
        success: false,
        message: 'Failed',
        error: 'SMS service unavailable',
      });

      const request = createMockRequest({
        phone: '9800000000',
        purpose: 'registration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Failed to send OTP');
    });

    it('should handle invalid JSON body gracefully', async () => {
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

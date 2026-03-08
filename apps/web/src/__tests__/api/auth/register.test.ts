import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

// Mock URL utility
vi.mock('@/lib/urls', () => ({
  generateUniqueShopSlug: vi.fn().mockResolvedValue('test-user-123'),
}));

// Helper to create mock requests
function createMockRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3333/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper to create a valid phone verification token
function createPhoneToken(overrides: Record<string, unknown> = {}) {
  const tokenData = {
    phone: '9800000000',
    purpose: 'registration',
    expiresAt: Date.now() + 600000, // 10 minutes from now
    ...overrides,
  };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

// Sample user for successful registration
const mockCreatedUser = {
  id: 1,
  email: null,
  full_name: 'Test User',
  phone: '9800000000',
  phone_verified: true,
  role: 'user',
  shop_slug: 'test-user-123',
  created_at: new Date('2024-01-01'),
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Validation Tests
  // ==========================================
  describe('Validation', () => {
    it('should return 400 when fullName is missing', async () => {
      const request = createMockRequest({
        password: 'test123456',
        phoneVerificationToken: createPhoneToken(),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors.fullName).toBeDefined();
    });

    it('should return 400 when password is too short', async () => {
      const request = createMockRequest({
        password: '123',
        fullName: 'Test User',
        phoneVerificationToken: createPhoneToken(),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors.password).toBeDefined();
    });

    it('should return 400 when fullName is too short', async () => {
      const request = createMockRequest({
        password: 'test123456',
        fullName: 'T',
        phoneVerificationToken: createPhoneToken(),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 when phoneVerificationToken is missing', async () => {
      const request = createMockRequest({
        password: 'test123456',
        fullName: 'Test User',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
    });
  });

  // ==========================================
  // Duplicate Check Tests
  // ==========================================
  describe('Duplicate Checks', () => {
    it('should return 400 when phone already registered', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findFirst).mockResolvedValue({
        id: 1,
        phone: '9800000000',
        phone_verified: true,
      } as any);

      const request = createMockRequest({
        password: 'test123456',
        fullName: 'Test User',
        phoneVerificationToken: createPhoneToken(),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Phone number already registered');
    });
  });

  // ==========================================
  // Phone Token Validation Tests
  // ==========================================
  describe('Phone Token Validation', () => {
    it('should return 400 for expired phone verification token', async () => {
      const request = createMockRequest({
        password: 'test123456',
        fullName: 'Test User',
        phoneVerificationToken: createPhoneToken({ expiresAt: Date.now() - 1000 }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Phone verification expired');
    });

    it('should return 400 for invalid token format', async () => {
      const request = createMockRequest({
        password: 'test123456',
        fullName: 'Test User',
        phoneVerificationToken: 'invalid-token',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================
  // Successful Registration Tests
  // ==========================================
  describe('Successful Registration', () => {
    it('should create user with verified phone', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.users.create).mockResolvedValue(mockCreatedUser as any);

      const request = createMockRequest({
        password: 'test123456',
        fullName: 'Test User',
        phoneVerificationToken: createPhoneToken(),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('User registered successfully');
      expect(data.user.phone).toBe('9800000000');
      expect(data.user.phoneVerified).toBe(true);
    });

    it('should return user data in camelCase format', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.users.create).mockResolvedValue(mockCreatedUser as any);

      const request = createMockRequest({
        password: 'test123456',
        fullName: 'Test User',
        phoneVerificationToken: createPhoneToken(),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.fullName).toBeDefined();
      expect(data.user.shopSlug).toBeDefined();
      expect(data.user.createdAt).toBeDefined();
      // No snake_case fields
      expect(data.user.full_name).toBeUndefined();
      expect(data.user.shop_slug).toBeUndefined();
      expect(data.user.created_at).toBeUndefined();
    });

    it('should hash password before storing', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const bcrypt = await import('bcryptjs');

      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.users.create).mockResolvedValue(mockCreatedUser as any);

      const request = createMockRequest({
        password: 'plaintext-password',
        fullName: 'Test User',
        phoneVerificationToken: createPhoneToken(),
      });
      await POST(request);

      expect(bcrypt.default.hash).toHaveBeenCalledWith('plaintext-password', 10);
      expect(prisma.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password_hash: 'hashed_password',
          }),
        })
      );
    });

    it('should generate unique shop slug', async () => {
      const { prisma } = await import('@thulobazaar/database');
      const { generateUniqueShopSlug } = await import('@/lib/urls');

      vi.mocked(prisma.users.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.users.create).mockResolvedValue(mockCreatedUser as any);

      const request = createMockRequest({
        password: 'test123456',
        fullName: 'Test User',
        phoneVerificationToken: createPhoneToken(),
      });
      await POST(request);

      expect(generateUniqueShopSlug).toHaveBeenCalledWith('Test User');
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================
  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findFirst).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        password: 'test123456',
        fullName: 'Test User',
        phoneVerificationToken: createPhoneToken(),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
    });

    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3333/api/auth/register', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { browserRequest } from '../helpers/browserRequest.js';
import { createApp } from '../../app.js';
import jwt from 'jsonwebtoken';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    $transaction: vi.fn(),
    users: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    business_verification_requests: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    individual_verification_requests: {
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    verification_pricing: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    verification_campaigns: {
      findMany: vi.fn(),
    },
    site_settings: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../services/notification.service.js', () => ({
  notifyEditors: vi.fn().mockResolvedValue(undefined),
}));

const app = createApp();

const userToken = (userId: number) =>
  `Bearer ${jwt.sign({ userId, email: `user${userId}@test.local`, role: 'user' }, process.env.JWT_SECRET!, { expiresIn: '1h' })}`;

describe('Verification Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // GET /api/verification/status
  // ==========================================
  describe('GET /api/verification/status', () => {
    it('should return 401 without authentication', async () => {
      const response = await browserRequest(app).get('/api/verification/status');

      expect(response.status).toBe(401);
    });

    // Note: Authenticated routes require proper JWT mock
    it.skip('should return verification status when authenticated', async () => {
      const { prisma } = await import('@thulobazaar/database');

      vi.mocked(prisma.users.findUnique).mockResolvedValue({
        account_type: 'individual',
        business_verification_status: null,
        individual_verified: false,
        business_name: null,
        business_license_document: null,
      } as any);

      // TODO: Add proper auth mock
      expect(true).toBe(true);
    });
  });

  // ==========================================
  // POST /api/verification/business
  // ==========================================
  describe('POST /api/verification/business', () => {
    it('should return 401 without authentication', async () => {
      const response = await browserRequest(app)
        .post('/api/verification/business')
        .send({ businessName: 'Test Business', licenseDocument: 'license.pdf' });

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // POST /api/verification/individual
  // ==========================================
  describe('POST /api/verification/individual', () => {
    it('should return 401 without authentication', async () => {
      const response = await browserRequest(app)
        .post('/api/verification/individual')
        .send({ documentUrls: ['doc1.pdf'] });

      expect(response.status).toBe(401);
    });

    it('stores the name and ID number exactly as the Flutter client posts them', async () => {
      const { prisma } = await import('@thulobazaar/database');
      // Eligible: nothing pending, never verified.
      vi.mocked(prisma.users.findUnique).mockResolvedValue({
        business_verification_status: null,
        business_verification_expires_at: null,
        individual_verified: false,
        individual_verification_expires_at: null,
        individual_verified_at: null,
        business_verified_at: null,
      } as any);
      vi.mocked(prisma.business_verification_requests.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.individual_verification_requests.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.verification_pricing.findFirst).mockResolvedValue({ price: 500 } as any);
      vi.mocked(prisma.site_settings.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.users.update).mockResolvedValue({} as any);
      vi.mocked(prisma.individual_verification_requests.create).mockReturnValue('create-op' as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 0 }, { id: 77 }] as any);

      // The payload shape of VerificationClient.submitIndividualVerification.
      const response = await browserRequest(app)
        .post('/api/verification/individual')
        .set('Authorization', userToken(4955))
        .send({
          documentUrls: { id_document_front: { filename: 'front.avif' } },
          fullName: 'Bidhneshwar Kumar Singh',
          idDocumentType: 'passport',
          idDocumentNumber: '19-01-82-12838',
          durationDays: 180,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ requestId: 77 });
      expect(prisma.individual_verification_requests.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 4955,
          full_name: 'Bidhneshwar Kumar Singh',
          id_document_type: 'passport',
          id_document_number: '19-01-82-12838',
        }),
      });
    });
  });

  // ==========================================
  // GET /api/verification/pricing
  // ==========================================
  describe('GET /api/verification/pricing', () => {
    async function mockPricing(freeEnabled: 'true' | 'false') {
      const { prisma } = await import('@thulobazaar/database');
      vi.mocked(prisma.verification_pricing.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.verification_campaigns.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.site_settings.findMany).mockResolvedValue([
        { setting_key: 'free_verification_enabled', setting_value: freeEnabled },
      ] as any);
      return prisma;
    }

    it('answers guests, who are eligible while the free offer is on', async () => {
      const prisma = await mockPricing('true');

      const response = await browserRequest(app).get('/api/verification/pricing');

      expect(response.status).toBe(200);
      expect(response.body.data.freeVerification).toMatchObject({ enabled: true, isEligible: true });
      // No token, no user lookup: a guest's eligibility comes from the setting alone.
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
    });

    it('tells guests the offer is off when the setting is off', async () => {
      await mockPricing('false');

      const response = await browserRequest(app).get('/api/verification/pricing');

      expect(response.status).toBe(200);
      expect(response.body.data.freeVerification).toMatchObject({ enabled: false, isEligible: false });
    });
  });
});

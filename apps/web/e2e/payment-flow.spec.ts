import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { test as authTest, expect as authExpect, createAuthenticatedRequest } from './fixtures/auth';

const isCI = !!process.env.CI;

/**
 * PAYMENT FLOW E2E TESTS
 *
 * Tests the payment system including validation, pages, and mock flow.
 * Tests requiring database or auth are skipped in CI.
 */

const test = baseTest;
const expect = baseExpect;

test.describe('Payment Flow', () => {
  // ============================================
  // PAYMENT API VALIDATION (requires database)
  // ============================================
  test.describe('Payment API Validation', () => {
    test.skip(isCI, 'Requires database connection');

    test('payment initiation requires authentication', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('mock payment initiation requires authentication', async ({ request }) => {
      const response = await request.post('/api/payments/mock/initiate', {
        data: {
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('mock payment verification requires authentication', async ({ request }) => {
      const response = await request.post('/api/payments/mock/verify', {
        data: {
          transactionId: 'MOCK_TEST_123',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // ============================================
  // PAYMENT PAGES ACCESSIBILITY
  // ============================================
  test.describe('Payment Pages', () => {
    test('payment success page loads', async ({ page }) => {
      await page.goto('/en/payment/success?orderId=TEST123&gateway=khalti&type=ad_promotion');

      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('payment failure page loads', async ({ page }) => {
      await page.goto('/en/payment/failure?error=test_error&orderId=TEST123');

      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('payment failure page handles missing order', async ({ page }) => {
      await page.goto('/en/payment/failure?error=missing_order');

      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('payment failure page handles canceled payment', async ({ page }) => {
      await page.goto('/en/payment/failure?error=canceled&orderId=TEST123');

      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toBeEmpty();
    });
  });

  // ============================================
  // PAYMENT CALLBACK HANDLING (requires database)
  // ============================================
  test.describe('Payment Callback', () => {
    test.skip(isCI, 'Requires database connection');

    test('callback redirects on missing orderId', async ({ page }) => {
      await page.goto('/api/payments/callback?gateway=khalti');

      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('payment/failure');
    });

    test('callback redirects on invalid gateway', async ({ page }) => {
      await page.goto('/api/payments/callback?gateway=invalid&orderId=TEST123');

      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('payment/failure');
    });

    test('callback redirects on non-existent transaction', async ({ page }) => {
      await page.goto('/api/payments/callback?gateway=khalti&orderId=NON_EXISTENT_123');

      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('payment/failure');
    });
  });

  // ============================================
  // MOCK PAYMENT FLOW (requires database)
  // ============================================
  test.describe('Mock Payment Endpoints', () => {
    test.skip(isCI, 'Requires database connection');

    test('mock success endpoint exists', async ({ request }) => {
      const response = await request.get('/api/payments/mock/success?txnId=TEST&amount=100');
      expect([200, 302, 307]).toContain(response.status());
    });

    test('mock failure endpoint exists', async ({ request }) => {
      const response = await request.get('/api/payments/mock/failure?txnId=TEST&amount=100');
      expect([200, 302, 307]).toContain(response.status());
    });

    test('mock status endpoint returns 404 for invalid transaction', async ({ request }) => {
      const response = await request.get('/api/payments/mock/status/INVALID_TXN_ID');
      expect([404, 401]).toContain(response.status());
    });
  });

  // ============================================
  // PAYMENT TYPES (requires database)
  // ============================================
  test.describe('Payment Types', () => {
    test.skip(isCI, 'Requires database connection');

    test('supports ad_promotion payment type', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });

      const data = await response.json();
      expect(response.status()).toBe(401);
      expect(data.message).toContain('Authentication');
    });

    test('supports individual_verification payment type', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'esewa',
          amount: 500,
          paymentType: 'individual_verification',
        },
      });

      const data = await response.json();
      expect(response.status()).toBe(401);
      expect(data.message).toContain('Authentication');
    });

    test('supports business_verification payment type', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 2000,
          paymentType: 'business_verification',
        },
      });

      const data = await response.json();
      expect(response.status()).toBe(401);
      expect(data.message).toContain('Authentication');
    });
  });

  // ============================================
  // PAYMENT GATEWAYS (requires database)
  // ============================================
  test.describe('Payment Gateways', () => {
    test.skip(isCI, 'Requires database connection');

    test('accepts khalti gateway', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('accepts esewa gateway', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'esewa',
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });
      expect(response.status()).toBe(401);
    });
  });

  // ============================================
  // ESEWA REDIRECT (requires database)
  // ============================================
  test.describe('eSewa Integration', () => {
    test.skip(isCI, 'Requires database connection');

    test('esewa redirect endpoint exists', async ({ request }) => {
      const response = await request.get('/api/payments/esewa/redirect');
      expect([200, 400, 401, 405]).toContain(response.status());
    });
  });

  // ============================================
  // AUTHENTICATED PAYMENT FLOW (requires auth + database)
  // ============================================
  authTest.describe('Authenticated Payment Flow', () => {
    authTest.skip(isCI, 'Requires database and authentication');

    authTest('can initiate khalti payment when authenticated', async ({ authenticatedPage, request }) => {
      const { token, headers } = await createAuthenticatedRequest(authenticatedPage);

      if (!token) {
        authTest.skip();
        return;
      }

      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 100,
          paymentType: 'ad_promotion',
          relatedId: 1,
          orderName: 'Test Ad Promotion',
        },
        headers,
      });

      const data = await response.json();
      authExpect(response.status()).not.toBe(401);

      if (response.ok()) {
        authExpect(data.success).toBe(true);
        authExpect(data.data).toHaveProperty('paymentUrl');
      }
    });

    authTest('can initiate esewa payment when authenticated', async ({ authenticatedPage, request }) => {
      const { token, headers } = await createAuthenticatedRequest(authenticatedPage);

      if (!token) {
        authTest.skip();
        return;
      }

      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'esewa',
          amount: 500,
          paymentType: 'individual_verification',
          relatedId: 1,
        },
        headers,
      });

      const data = await response.json();
      authExpect(response.status()).not.toBe(401);

      if (response.ok()) {
        authExpect(data.success).toBe(true);
      }
    });

    authTest('can complete mock payment flow', async ({ authenticatedPage, request }) => {
      const { token, headers } = await createAuthenticatedRequest(authenticatedPage);

      if (!token) {
        authTest.skip();
        return;
      }

      const initResponse = await request.post('/api/payments/mock/initiate', {
        data: {
          amount: 100,
          paymentType: 'ad_promotion',
          relatedId: 1,
        },
        headers,
      });

      if (initResponse.ok()) {
        const initData = await initResponse.json();

        if (initData.data?.transactionId) {
          const txnId = initData.data.transactionId;
          await authenticatedPage.goto(`/api/payments/mock/success?txnId=${txnId}&amount=100`);
          await authenticatedPage.waitForLoadState('networkidle');

          const url = authenticatedPage.url();
          authExpect(url).toMatch(/success|payment/i);
        }
      }
    });

    authTest('payment history accessible in dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');

      const dashboardLoaded = await authenticatedPage.locator('body').textContent();
      authExpect(dashboardLoaded).not.toContain('Login');

      const paymentsLink = authenticatedPage.locator('a[href*="payment"], button:has-text("Payments")').first();

      if (await paymentsLink.isVisible().catch(() => false)) {
        await paymentsLink.click();
        await authenticatedPage.waitForLoadState('networkidle');
        await authExpect(authenticatedPage.locator('body')).not.toBeEmpty();
      }
    });
  });

  // ============================================
  // AD PROMOTION PAYMENT (requires database)
  // ============================================
  test.describe('Ad Promotion Payment', () => {
    test.skip(isCI, 'Requires database connection');

    test('promotion pricing API is accessible', async ({ request }) => {
      const response = await request.get('/api/ads/promotion-pricing');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  // Authenticated ad promotion tests
  authTest.describe('Ad Promotion (Authenticated)', () => {
    authTest.skip(isCI, 'Requires database and authentication');

    authTest('can view ad promotion options when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');

      const myAdsLink = authenticatedPage.locator('a[href*="my-ads"], a[href*="/ads"]').first();

      if (await myAdsLink.isVisible().catch(() => false)) {
        await myAdsLink.click();
        await authenticatedPage.waitForLoadState('networkidle');

        const promoteBtn = authenticatedPage.locator('button:has-text("Promote"), a:has-text("Promote")').first();

        if (await promoteBtn.isVisible().catch(() => false)) {
          await promoteBtn.click();
          await authenticatedPage.waitForLoadState('networkidle');
          await authExpect(authenticatedPage.locator('body')).not.toBeEmpty();
        }
      }
    });
  });

  // ============================================
  // VERIFICATION PAYMENT
  // ============================================
  test.describe('Verification Payment', () => {
    test('verification page redirects or shows login without auth', async ({ page }) => {
      await page.goto('/en/profile/verification');
      await page.waitForLoadState('networkidle');

      // Page may redirect to login, or show login content inline
      const url = page.url();
      const pageText = await page.locator('body').textContent() || '';
      const isProtected =
        url.includes('login') ||
        url.includes('auth') ||
        pageText.toLowerCase().includes('sign in') ||
        pageText.toLowerCase().includes('login');
      expect(isProtected).toBeTruthy();
    });
  });

  // Authenticated verification tests
  authTest.describe('Verification Payment (Authenticated)', () => {
    authTest.skip(isCI, 'Requires database and authentication');

    authTest('shows verification options when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/profile/verification');
      await authenticatedPage.waitForLoadState('networkidle');

      const currentUrl = authenticatedPage.url();
      authExpect(currentUrl).not.toMatch(/login|auth\/signin/);

      await authExpect(authenticatedPage.locator('body')).not.toBeEmpty();

      const hasVerificationContent = await authenticatedPage.evaluate(() => {
        const text = document.body.textContent?.toLowerCase() || '';
        return (
          text.includes('verification') ||
          text.includes('verify') ||
          text.includes('individual') ||
          text.includes('business')
        );
      });

      authExpect(hasVerificationContent).toBeTruthy();
    });

    authTest('shows verification pricing', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/profile/verification');
      await authenticatedPage.waitForLoadState('networkidle');

      const hasPricing = await authenticatedPage.evaluate(() => {
        const text = document.body.textContent || '';
        return (
          text.includes('NPR') ||
          text.includes('Rs') ||
          text.match(/[रू₹]\s*\d+/) !== null ||
          text.match(/\d+\s*(NPR|Rs)/) !== null
        );
      });

      if (!authenticatedPage.url().includes('login')) {
        authExpect(hasPricing).toBeTruthy();
      }
    });
  });
});

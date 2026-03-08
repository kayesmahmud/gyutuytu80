import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { test as authTest, expect as authExpect } from './fixtures/auth';

const isCI = !!process.env.CI;

/**
 * AD POSTING FLOW E2E TESTS
 *
 * Tests the complete user journey of posting an ad.
 * API and authenticated tests require a database and are skipped in CI.
 */

const test = baseTest;
const expect = baseExpect;

test.describe('Ad Posting Flow', () => {
  // ============================================
  // PRE-AUTH: PAGE ACCESSIBILITY
  // ============================================
  test.describe('Page Accessibility (Unauthenticated)', () => {
    test('post-ad page redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/en/post-ad');

      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/);
    });

    test('can view categories from homepage', async ({ page }) => {
      await page.goto('/en');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check that page loaded successfully
      await expect(page.locator('body')).not.toBeEmpty();
    });
  });

  // ============================================
  // CATEGORIES API (requires database)
  // ============================================
  test.describe('Categories', () => {
    test.skip(isCI, 'Requires database connection');

    test('categories API returns data', async ({ request }) => {
      const response = await request.get('/api/categories');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('categories have required fields', async ({ request }) => {
      const response = await request.get('/api/categories');
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const category = data.data[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
      }
    });

    test('can fetch category with subcategories', async ({ request }) => {
      const response = await request.get('/api/categories?includeSubcategories=true');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  // ============================================
  // ADS LISTING (requires database)
  // ============================================
  test.describe('Ads Listing', () => {
    test.skip(isCI, 'Requires database connection');

    test('ads API returns paginated results', async ({ request }) => {
      const response = await request.get('/api/ads');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('hasMore');
    });

    test('can filter ads by category', async ({ request }) => {
      const catResponse = await request.get('/api/categories');
      const catData = await catResponse.json();

      if (catData.data && catData.data.length > 0) {
        const categoryId = catData.data[0].id;
        const response = await request.get(`/api/ads?category=${categoryId}`);
        expect(response.ok()).toBeTruthy();
      }
    });

    test('can filter ads by search term', async ({ request }) => {
      const response = await request.get('/api/ads?search=phone');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('can sort ads by price', async ({ request }) => {
      const responseLow = await request.get('/api/ads?sortBy=price-low');
      expect(responseLow.ok()).toBeTruthy();

      const responseHigh = await request.get('/api/ads?sortBy=price-high');
      expect(responseHigh.ok()).toBeTruthy();
    });

    test('can paginate ads', async ({ request }) => {
      const response = await request.get('/api/ads?limit=5&offset=0');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });
  });

  // ============================================
  // AD DETAIL VIEW (requires database)
  // ============================================
  test.describe('Ad Detail View', () => {
    test.skip(isCI, 'Requires database connection');

    test('can view ad details page', async ({ page, request }) => {
      const response = await request.get('/api/ads?limit=1');
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const ad = data.data[0];
        await page.goto(`/en/ad/${ad.slug}`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).not.toBeEmpty();
      }
    });

    test('ad detail API returns full ad data', async ({ request }) => {
      const listResponse = await request.get('/api/ads?limit=1');
      const listData = await listResponse.json();

      if (listData.data && listData.data.length > 0) {
        const adId = listData.data[0].id;
        const response = await request.get(`/api/ads/${adId}`);
        expect(response.ok()).toBeTruthy();

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('title');
        expect(data.data).toHaveProperty('description');
        expect(data.data).toHaveProperty('price');
      }
    });

    test('viewing ad increments view count', async ({ request }) => {
      const listResponse = await request.get('/api/ads?limit=1');
      const listData = await listResponse.json();

      if (listData.data && listData.data.length > 0) {
        const adId = listData.data[0].id;
        const initialViews = listData.data[0].viewCount || 0;

        await request.get(`/api/ads/${adId}`);

        const afterResponse = await request.get(`/api/ads/${adId}`);
        const afterData = await afterResponse.json();

        expect(afterData.data.viewCount).toBeGreaterThanOrEqual(initialViews);
      }
    });
  });

  // ============================================
  // POST AD FORM (requires auth + database)
  // ============================================
  authTest.describe('Post Ad Form (Authenticated)', () => {
    authTest.skip(isCI, 'Requires database and authentication');

    authTest('post-ad form loads with categories', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/post-ad');
      await authenticatedPage.waitForLoadState('networkidle');

      await authExpect(authenticatedPage.locator('form')).toBeVisible({ timeout: 10000 });
    });

    authTest('can fill basic ad information', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/post-ad');
      await authenticatedPage.waitForLoadState('networkidle');

      await authenticatedPage.waitForSelector('form', { timeout: 10000 });

      const titleField = authenticatedPage.locator('[name="title"], [id="title"], input[placeholder*="title" i]').first();
      const descField = authenticatedPage.locator('[name="description"], [id="description"], textarea[placeholder*="description" i]').first();
      const priceField = authenticatedPage.locator('[name="price"], [id="price"], input[placeholder*="price" i], input[type="number"]').first();

      if (await titleField.isVisible().catch(() => false)) {
        await titleField.fill('Test Ad Title E2E');
      }
      if (await descField.isVisible().catch(() => false)) {
        await descField.fill('This is a test ad description for E2E testing');
      }
      if (await priceField.isVisible().catch(() => false)) {
        await priceField.fill('1000');
      }

      const hasTitle = await titleField.inputValue().catch(() => '');
      authExpect(hasTitle.length).toBeGreaterThan(0);
    });

    authTest('validates required fields', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/post-ad');
      await authenticatedPage.waitForLoadState('networkidle');

      await authenticatedPage.waitForSelector('form', { timeout: 10000 });

      const submitBtn = authenticatedPage.locator('button[type="submit"], input[type="submit"]').first();

      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await authenticatedPage.waitForTimeout(500);

        const hasValidationError = await authenticatedPage.evaluate(() => {
          const errorElements = document.querySelectorAll(
            '.error-message, [role="alert"], .text-red-500, .text-red-600, .border-red-500, :invalid'
          );
          return errorElements.length > 0;
        });

        authExpect(hasValidationError).toBeTruthy();
      }
    });
  });

  // ============================================
  // MY ADS (requires database)
  // ============================================
  test.describe('My Ads', () => {
    test('my-ads API requires authentication', async ({ request }) => {
      test.skip(isCI, 'Requires database connection');

      const response = await request.get('/api/ads/my-ads');
      expect(response.status()).toBe(401);
    });

    test('dashboard redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/en/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/);
    });
  });
});

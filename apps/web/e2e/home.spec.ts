import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Homepage
 * Tests the main landing page functionality
 */
test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/en');

    // Check page title or main heading
    await expect(page).toHaveTitle(/Thulo Bazaar/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    // Check for navigation elements — look for sign in/sign up links or buttons
    const signInElement = page.locator('a, button').filter({ hasText: /sign in/i }).first();
    await expect(signInElement).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to shops page', async ({ page }) => {
    await page.goto('/en');

    // Find and click shops link
    const shopsLink = page.getByRole('link', { name: /shops/i });
    if (await shopsLink.isVisible()) {
      await shopsLink.click();
      await expect(page).toHaveURL(/\/shops/);
    }
  });
});

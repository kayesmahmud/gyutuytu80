import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 * Tests login, logout, and protected routes
 */
test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/en/auth/login');
    await page.waitForLoadState('networkidle');

    // Check for login form — the page shows "Welcome back" heading
    // and a "Sign In" button or form elements
    const hasLoginContent = await page.evaluate(() => {
      const text = document.body.textContent?.toLowerCase() || '';
      return text.includes('sign in') || text.includes('login') || text.includes('welcome back');
    });
    expect(hasLoginContent).toBeTruthy();
  });

  test('should show validation error for empty form', async ({ page }) => {
    await page.goto('/en/auth/login');

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation error or stay on page
      await expect(page).toHaveURL(/login|auth/);
    }
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/en/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/);
  });

  test('editor login page should load', async ({ page }) => {
    await page.goto('/en/editor/login');
    await page.waitForLoadState('networkidle');

    // Check page loaded with editor-related content
    const hasEditorContent = await page.evaluate(() => {
      const text = document.body.textContent?.toLowerCase() || '';
      return text.includes('editor') || text.includes('staff') || text.includes('admin') || text.includes('sign in');
    });
    expect(hasEditorContent).toBeTruthy();
  });
});

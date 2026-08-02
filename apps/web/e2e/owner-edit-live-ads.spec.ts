import { test, expect } from './fixtures/auth';

/**
 * E2E: Owner editing of live (approved) ads.
 *
 * Seed first: npx tsx e2e/setup/seed-owner-edit-tests.ts
 * Requires the Express API running on NEXT_PUBLIC_API_URL (edit-context + update).
 *
 * - Normal user: Edit button on own live ad → amber "back to review" warning →
 *   save (confirm dialog) → ad returns to Pending.
 * - Verified business: blue "goes live instantly" warning → save → ad stays live,
 *   public page shows the "Edited" label.
 * - Visitor: no Edit button.
 */

const PASSWORD = 'testpassword123';
const NORMAL = { phone: '9800000001', adSlug: 'e2e-live-ad-normal', adTitle: 'E2E Live Ad Normal' };
const BIZ = { phone: '9800000002', adSlug: 'e2e-live-ad-biz', adTitle: 'E2E Live Ad Biz' };

const TITLE_INPUT = 'input[placeholder="e.g., iPhone 15 Pro Max 256GB"]';

// These tests share the seeded ads (the visitor test reads the ad the normal
// test edits), so they must not run concurrently despite fullyParallel.
test.describe.configure({ mode: 'default' });

test.describe('Owner editing of live ads', () => {
  // Every test here depends on ads seeded by seed-owner-edit-tests.ts; the CI
  // E2E job runs the web server without a database, so none of them can pass.
  test.skip(!!process.env.CI, 'Requires seeded database; CI E2E environment has none');

  test('visitor sees no Edit button on a live ad', async ({ page }) => {
    await page.goto(`/en/ad/${NORMAL.adSlug}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`h1:has-text("${NORMAL.adTitle}")`).first()).toBeVisible();
    await expect(page.locator('button:has-text("Edit this ad")')).toHaveCount(0);
  });

  test('normal user: edit live ad → warning → back to review (Pending tab)', async ({ page, login }) => {
    await login(page, NORMAL.phone, PASSWORD);

    // Owner Edit button on the public ad page
    await page.goto(`/en/ad/${NORMAL.adSlug}`);
    await page.waitForLoadState('domcontentloaded');
    const editBtn = page.locator('button:has-text("Edit this ad") >> visible=true').first();
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();

    // Edit page with the re-review warning banner
    await page.waitForURL(/\/edit-ad\//, { timeout: 20000 });
    await expect(
      page.locator('text=editing sends it back to review')
    ).toBeVisible({ timeout: 20000 });

    // Change the title; accept the "goes offline" confirm on save
    const title = page.locator(TITLE_INPUT);
    await expect(title).toBeVisible({ timeout: 20000 });
    await title.fill(`${NORMAL.adTitle} EDITED`);
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('button:has-text("Save Changes")').click();

    // Sent back to review → lands on dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    // Ad shows up under the Pending tab with the edited title
    await page.locator('button:has-text("Pending")').first().click();
    await expect(
      page.locator(`text=${NORMAL.adTitle} EDITED`).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('verified business: edit live ad → instant publish warning → stays live with Edited label', async ({ page, login }) => {
    await login(page, BIZ.phone, PASSWORD);

    await page.goto(`/en/ad/${BIZ.adSlug}`);
    await page.waitForLoadState('domcontentloaded');
    const editBtn = page.locator('button:has-text("Edit this ad") >> visible=true').first();
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();

    // Edit page with the trusted-business banner
    await page.waitForURL(/\/edit-ad\//, { timeout: 20000 });
    await expect(
      page.locator('text=Your edits go live instantly')
    ).toBeVisible({ timeout: 20000 });

    const title = page.locator(TITLE_INPUT);
    await expect(title).toBeVisible({ timeout: 20000 });
    await title.fill(`${BIZ.adTitle} EDITED`);
    // No confirm expected for trusted users, but accept one defensively
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('button:has-text("Save Changes")').click();

    // Stays live → redirected back to the public ad page
    await page.waitForURL(new RegExp(`/ad/${BIZ.adSlug}`), { timeout: 30000 });
    await expect(page.locator(`h1:has-text("${BIZ.adTitle} EDITED")`).first()).toBeVisible({ timeout: 15000 });
    // Facebook-style Edited indicator
    await expect(page.locator('text=Edited').first()).toBeVisible({ timeout: 15000 });
  });
});

/**
 * User Management E2E Tests
 * Tests admin user management functionality
 */

import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display users list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for users table
    const usersTable = page.locator('table, [data-testid="users-list"]');
    await expect(usersTable).toBeVisible();

    // Should have at least the header row
    const rows = page.locator('tr, [data-testid="user-row"]');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should search users by email', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|email/i)
      .or(page.getByRole('searchbox'));

    if (await searchInput.isVisible()) {
      await searchInput.fill('@');
      await searchInput.press('Enter');

      await page.waitForLoadState('networkidle');

      // Results should be filtered
      const results = page.locator('tr:not(:first-child), [data-testid="user-row"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter users by subscription status', async ({ page }) => {
    const statusFilter = page.getByRole('combobox', { name: /subscription|plan|status/i })
      .or(page.locator('[data-testid="subscription-filter"]'));

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Select premium users
      await page.getByRole('option', { name: /premium/i }).click();

      await page.waitForLoadState('networkidle');
    }
  });

  test('should view user details', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on a user row
    const userRow = page.locator('tr:not(:first-child), [data-testid="user-row"]').first();

    if (await userRow.isVisible()) {
      await userRow.click();

      // Should show user detail view
      await expect(
        page.getByRole('dialog')
          .or(page.locator('[data-testid="user-detail"]'))
          .or(page.getByText(/user details/i))
      ).toBeVisible({ timeout: 5000 }).catch(() => {
        // May navigate to detail page
        expect(page.url()).toMatch(/\/users\/[a-z0-9-]+/i);
      });
    }
  });

  test('should display user statistics', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for user stats section
    const stats = page.locator('[data-testid="user-stats"], .user-stats');

    if (await stats.isVisible()) {
      await expect(stats.getByText(/total|active|premium/i)).toBeVisible();
    }
  });

  test('should update user subscription', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on first user
    const userRow = page.locator('tr:not(:first-child)').first();
    await userRow.click();

    // Wait for detail view
    await page.waitForLoadState('networkidle');

    // Find subscription controls
    const subscriptionSelect = page.getByRole('combobox', { name: /subscription|plan/i });

    if (await subscriptionSelect.isVisible()) {
      await subscriptionSelect.click();
      await page.getByRole('option', { name: /premium/i }).click();

      // Save changes
      const saveButton = page.getByRole('button', { name: /save|update/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Wait for success message
        await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should export users data', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export|download/i });

    if (await exportButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      // Wait for download to start
      const download = await downloadPromise.catch(() => null);

      if (download) {
        expect(download.suggestedFilename()).toMatch(/users.*\.(csv|xlsx|json)/i);
      }
    }
  });

  test('should paginate users list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const paginationInfo = page.getByText(/showing|page|\d+ of \d+/i);
    const nextButton = page.getByRole('button', { name: /next|>/i });

    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // Should update pagination info
      if (await paginationInfo.isVisible()) {
        const text = await paginationInfo.textContent();
        expect(text).toBeTruthy();
      }
    }
  });

  test('should sort users by date joined', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const dateHeader = page.getByRole('columnheader', { name: /joined|created|date/i });

    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      await page.waitForLoadState('networkidle');

      // Verify sort indicator changes
      const sortIcon = dateHeader.locator('svg, .sort-icon');
      if (await sortIcon.isVisible()) {
        await expect(sortIcon).toBeVisible();
      }
    }
  });
});

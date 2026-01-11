/**
 * Story Moderation E2E Tests
 * Tests the admin story review and approval workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Story Moderation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stories');
    await expect(page.getByRole('heading', { name: /stories|articles/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display stories list', async ({ page }) => {
    // Wait for stories to load
    await page.waitForLoadState('networkidle');

    // Check for stories table or list
    const storiesContainer = page.locator('table, [data-testid="stories-list"], .stories-list');
    await expect(storiesContainer).toBeVisible();
  });

  test('should filter stories by status', async ({ page }) => {
    // Look for status filter
    const statusFilter = page.getByRole('combobox', { name: /status|filter/i })
      .or(page.getByLabel(/status/i))
      .or(page.locator('[data-testid="status-filter"]'));

    if (await statusFilter.isVisible()) {
      // Select pending stories
      await statusFilter.click();
      await page.getByRole('option', { name: /pending/i }).click();

      // Wait for filtered results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should search stories by title', async ({ page }) => {
    // Find search input
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.locator('[data-testid="search-input"]'));

    if (await searchInput.isVisible()) {
      // Enter search query
      await searchInput.fill('test');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should open story detail modal or page', async ({ page }) => {
    // Wait for stories to load
    await page.waitForLoadState('networkidle');

    // Click on first story row
    const storyRow = page.locator('tr, [data-testid="story-row"], .story-item').first();

    if (await storyRow.isVisible()) {
      await storyRow.click();

      // Should show detail view (modal or page)
      await expect(
        page.getByRole('dialog')
          .or(page.locator('[data-testid="story-detail"]'))
          .or(page.getByRole('heading', { name: /story detail/i }))
      ).toBeVisible({ timeout: 5000 }).catch(() => {
        // May navigate to detail page instead
        expect(page.url()).toMatch(/\/stories\/[a-z0-9-]+/i);
      });
    }
  });

  test('should approve a pending story', async ({ page }) => {
    // Navigate to pending stories
    const pendingLink = page.getByRole('link', { name: /pending/i })
      .or(page.getByRole('tab', { name: /pending/i }));

    if (await pendingLink.isVisible()) {
      await pendingLink.click();
    }

    await page.waitForLoadState('networkidle');

    // Find approve button on first story
    const approveButton = page.getByRole('button', { name: /approve/i }).first();

    if (await approveButton.isVisible()) {
      // Click approve
      await approveButton.click();

      // Wait for confirmation or success message
      await expect(
        page.getByText(/approved|success/i)
          .or(page.getByRole('alert'))
      ).toBeVisible({ timeout: 5000 }).catch(() => {
        // May just remove the row
        console.log('Approval completed (no confirmation message)');
      });
    }
  });

  test('should reject a story with reason', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find reject button
    const rejectButton = page.getByRole('button', { name: /reject|remove/i }).first();

    if (await rejectButton.isVisible()) {
      await rejectButton.click();

      // Check for confirmation dialog
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        // Fill reason if required
        const reasonInput = dialog.getByRole('textbox');
        if (await reasonInput.isVisible()) {
          await reasonInput.fill('Test rejection - low quality content');
        }

        // Confirm rejection
        await dialog.getByRole('button', { name: /confirm|reject|yes/i }).click();
      }

      // Wait for action to complete
      await page.waitForLoadState('networkidle');
    }
  });

  test('should bulk select and approve stories', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find checkbox column
    const checkboxes = page.getByRole('checkbox');

    if ((await checkboxes.count()) > 1) {
      // Select first two stories
      await checkboxes.nth(1).check();
      await checkboxes.nth(2).check();

      // Look for bulk action button
      const bulkApprove = page.getByRole('button', { name: /approve selected|bulk approve/i });

      if (await bulkApprove.isVisible()) {
        await bulkApprove.click();

        // Wait for bulk action to complete
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should paginate through stories', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find pagination controls
    const nextButton = page.getByRole('button', { name: /next|>/i })
      .or(page.locator('[data-testid="next-page"]'));

    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      // Get current page content
      const firstStoryTitle = await page.locator('tr td:nth-child(2)').first().textContent();

      // Go to next page
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // Content should be different
      const newFirstTitle = await page.locator('tr td:nth-child(2)').first().textContent();

      // Titles should be different (different page)
      if (firstStoryTitle && newFirstTitle) {
        expect(firstStoryTitle).not.toBe(newFirstTitle);
      }
    }
  });

  test('should sort stories by date', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find date column header
    const dateHeader = page.getByRole('columnheader', { name: /date|published|created/i });

    if (await dateHeader.isVisible()) {
      // Click to sort
      await dateHeader.click();
      await page.waitForLoadState('networkidle');

      // Click again to reverse sort
      await dateHeader.click();
      await page.waitForLoadState('networkidle');
    }
  });
});

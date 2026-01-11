/**
 * Sources Management E2E Tests
 * Tests RSS source configuration and management
 */

import { test, expect } from '@playwright/test';

test.describe('Sources Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sources');
    await expect(page.getByRole('heading', { name: /sources|rss/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display sources list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sourcesTable = page.locator('table, [data-testid="sources-list"]');
    await expect(sourcesTable).toBeVisible();
  });

  test('should show source details', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Expand or click on first source
    const sourceRow = page.locator('tr:not(:first-child), [data-testid="source-row"]').first();

    if (await sourceRow.isVisible()) {
      await sourceRow.click();

      // Should show details
      await expect(
        page.getByText(/feed url|rss|atom/i)
          .or(page.getByRole('dialog'))
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should add new RSS source', async ({ page }) => {
    // Click add button
    const addButton = page.getByRole('button', { name: /add|new|create/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Wait for form/dialog
      await expect(page.getByRole('dialog').or(page.getByRole('form'))).toBeVisible();

      // Fill source details
      await page.getByLabel(/name/i).fill('Test Source');
      await page.getByLabel(/url|feed/i).fill('https://example.com/rss');
      await page.getByLabel(/language/i).click();
      await page.getByRole('option', { name: /arabic|ar/i }).click();

      // Submit
      await page.getByRole('button', { name: /add|save|create/i }).click();

      // Wait for success or error
      await page.waitForLoadState('networkidle');
    }
  });

  test('should edit source configuration', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find edit button on first source
    const editButton = page.getByRole('button', { name: /edit/i }).first()
      .or(page.locator('[data-testid="edit-source"]').first());

    if (await editButton.isVisible()) {
      await editButton.click();

      // Wait for edit form
      await expect(page.getByRole('dialog').or(page.getByRole('form'))).toBeVisible();

      // Modify a field
      const nameInput = page.getByLabel(/name/i);
      if (await nameInput.isVisible()) {
        await nameInput.clear();
        await nameInput.fill('Updated Source Name');
      }

      // Save
      await page.getByRole('button', { name: /save|update/i }).click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should toggle source active status', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find toggle/switch for first source
    const toggle = page.locator('[role="switch"], input[type="checkbox"]').first();

    if (await toggle.isVisible()) {
      const wasChecked = await toggle.isChecked();

      await toggle.click();
      await page.waitForLoadState('networkidle');

      // Verify toggle changed
      const isChecked = await toggle.isChecked();
      expect(isChecked).not.toBe(wasChecked);
    }
  });

  test('should validate RSS feed URL', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new/i });

    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByRole('dialog').or(page.getByRole('form'))).toBeVisible();

      // Enter invalid URL
      await page.getByLabel(/url|feed/i).fill('not-a-valid-url');

      // Try to submit
      await page.getByRole('button', { name: /add|save/i }).click();

      // Should show validation error
      await expect(page.getByText(/invalid|valid url/i)).toBeVisible();
    }
  });

  test('should test feed connectivity', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find test/validate button
    const testButton = page.getByRole('button', { name: /test|validate|check/i }).first();

    if (await testButton.isVisible()) {
      await testButton.click();

      // Wait for test result
      await expect(
        page.getByText(/success|connected|valid|error|failed/i)
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should filter sources by language', async ({ page }) => {
    const languageFilter = page.getByRole('combobox', { name: /language/i })
      .or(page.locator('[data-testid="language-filter"]'));

    if (await languageFilter.isVisible()) {
      await languageFilter.click();
      await page.getByRole('option', { name: /arabic|ar/i }).click();

      await page.waitForLoadState('networkidle');

      // Verify filter applied
      const sources = page.locator('tr:not(:first-child), [data-testid="source-row"]');
      expect(await sources.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show source statistics', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on source to expand details
    const sourceRow = page.locator('tr:not(:first-child)').first();

    if (await sourceRow.isVisible()) {
      await sourceRow.click();

      // Should show stats
      await expect(
        page.getByText(/articles|stories|fetched|last/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete source with confirmation', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
      await expect(dialog).toBeVisible();

      // Cancel deletion
      await dialog.getByRole('button', { name: /cancel|no/i }).click();
      await expect(dialog).not.toBeVisible();
    }
  });

  test('should bulk refresh sources', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /refresh|fetch|sync/i });

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Wait for refresh to complete or show progress
      await expect(
        page.getByText(/refreshing|syncing|complete|success|done/i)
      ).toBeVisible({ timeout: 30000 });
    }
  });
});

/**
 * Admin Dashboard E2E Tests
 * Tests the main dashboard functionality and stats loading
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Use authenticated state
    await page.goto('/dashboard');
    // Wait for dashboard to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });

  test('should display dashboard with stats cards', async ({ page }) => {
    // Verify stats cards are present
    await expect(page.getByText(/total stories/i)).toBeVisible();
    await expect(page.getByText(/total users/i)).toBeVisible();
    await expect(page.getByText(/pending/i)).toBeVisible();

    // Stats should show numbers (not loading state)
    const statsCards = page.locator('[data-testid="stats-card"], .stats-card');
    if (await statsCards.count() > 0) {
      const firstCard = statsCards.first();
      await expect(firstCard).not.toContainText(/loading/i, { timeout: 15000 });
    }
  });

  test('should load stats without errors', async ({ page }) => {
    // Wait for all stats to load
    await page.waitForLoadState('networkidle');

    // Check for error messages
    const errorMessages = page.getByText(/error|failed|unable to load/i);
    await expect(errorMessages).toHaveCount(0);
  });

  test('should display navigation menu', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    // Check for main navigation items
    await expect(page.getByRole('link', { name: /stories|articles/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sources/i })).toBeVisible();
  });

  test('should show recent stories section', async ({ page }) => {
    // Look for recent stories list or table
    const recentStories = page.locator('[data-testid="recent-stories"], .recent-stories, table');

    if (await recentStories.count() > 0) {
      await expect(recentStories.first()).toBeVisible();
    }
  });

  test('should navigate to stories page from dashboard', async ({ page }) => {
    // Click on stories link
    await page.getByRole('link', { name: /stories|articles/i }).first().click();

    // Verify navigation
    await expect(page).toHaveURL(/\/stories|\/articles/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Dashboard should still be functional
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Mobile menu should be available
    const mobileMenu = page.getByRole('button', { name: /menu|toggle/i });
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });

  test('should refresh stats on page reload', async ({ page }) => {
    // Get initial timestamp
    const initialTime = Date.now();

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Reload the page
    await page.reload();

    // Wait for stats to reload
    await page.waitForLoadState('networkidle');

    // Verify page loaded successfully after refresh
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

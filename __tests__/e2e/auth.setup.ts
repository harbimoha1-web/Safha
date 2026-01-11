/**
 * Authentication Setup for Playwright E2E Tests
 * Creates authenticated browser state for admin user
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.playwright/.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Wait for the login form to be visible
  await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible({
    timeout: 10000,
  });

  // Fill in admin credentials
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@safha.test';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminTest123!';

  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);

  // Submit the form
  await page.getByRole('button', { name: /sign in|login|submit/i }).click();

  // Wait for successful login (redirect to dashboard)
  await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: 15000 });

  // Verify we're logged in by checking for admin-specific elements
  await expect(page.getByRole('navigation')).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

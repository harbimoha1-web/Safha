/**
 * Authentication E2E Tests
 * Tests admin login, logout, and session management
 */

import { test, expect } from '@playwright/test';

// These tests don't use the authenticated state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('/login');

    // Verify form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|error|failed/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid email
    await page.getByLabel(/email/i).fill('notanemail');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Should show validation error
    await expect(
      page.getByText(/valid email|email format|invalid email/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should require password', async ({ page }) => {
    await page.goto('/login');

    // Enter email only
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Should show password required error
    await expect(
      page.getByText(/password.*required|enter.*password/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safha.test';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminTest123!';

    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: 15000 });
  });

  test('should show password visibility toggle', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByLabel(/password/i);
    const toggleButton = page.getByRole('button', { name: /show|hide|toggle/i })
      .or(page.locator('[data-testid="toggle-password"]'));

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle if available
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  test('should handle forgot password link', async ({ page }) => {
    await page.goto('/login');

    const forgotLink = page.getByRole('link', { name: /forgot|reset/i });

    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/\/forgot|\/reset|\/recover/);
    }
  });

  test('should maintain session across page reloads', async ({ page }) => {
    await page.goto('/login');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safha.test';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminTest123!';

    // Login
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: 15000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard|\/admin/);
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safha.test';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminTest123!';

    // Login first
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: 15000 });

    // Find and click logout
    const userMenu = page.getByRole('button', { name: /user|profile|account/i })
      .or(page.locator('[data-testid="user-menu"]'));

    if (await userMenu.isVisible()) {
      await userMenu.click();
    }

    const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
      .or(page.getByRole('menuitem', { name: /logout|sign out/i }));

    await logoutButton.click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should protect admin routes', async ({ page }) => {
    // Try to access protected routes directly
    const protectedRoutes = ['/dashboard', '/stories', '/users', '/sources'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should handle session expiry', async ({ page }) => {
    // This test simulates session expiry by clearing cookies
    await page.goto('/login');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safha.test';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminTest123!';

    // Login
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: 15000 });

    // Clear session cookies
    await page.context().clearCookies();

    // Try to navigate
    await page.goto('/stories');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

import { expect, test } from '@playwright/test';
import { loginAsUser, logout, registerUser } from './utils/auth.test-utils';

test.describe('Authentication', () => {
  test('should allow user to log in', async ({ page }) => {
    await page.goto('/');

    // Test login with test utilities
    await loginAsUser(page, { email: 'mishitouchiwa14@gmail.com', password: 'TSAG12025' });

    await page.waitForURL(/\/app/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill in with invalid credentials
    await loginAsUser(page, { email: 'test@gmail.com', password: 'Test1234' });

    // Verify error message is shown
    await expect(page.getByText(/Email ou Mot de passe incorrect/i)).toBeVisible();
  });

  test('should allow user to register', async ({ page }) => {
    await page.goto('/register');

    // Test login with test utilities
    await registerUser(page, {
      email: 'mishitouchiwa14@gmail.com',
      password: 'TSAG12025',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'affreteur',
    });

    await page.waitForURL(/\/app/);
  });

  test('should allow user to log out', async ({ page }) => {
    await page.goto('/');

    // Test login with test utilities
    await loginAsUser(page, { email: 'mishitouchiwa14@gmail.com', password: 'TSAG12025' });

    // Verify user is redirected to app after login
    await expect(page).toHaveURL(/\/app/, { timeout: 30000 });

    // Logout
    await logout(page);

    // Verify user is redirected to login page after logout
    await expect(page).toHaveURL('/');

    // Verify user is actually logged out by checking if login is required
    await page.goto('/app');
    await expect(page).toHaveURL(/\/$/); // Should redirect to home if not authenticated
  });
});

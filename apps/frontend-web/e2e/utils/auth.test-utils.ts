import { expect, Page } from '@playwright/test';
import { LoginCredentials } from '../../src/types/auth.types';
import type { RegisterFormData } from '../../src/types/forms.types';

/**
 * Log in as a regular user
 * @param page - Playwright page object
 * @param credentials - User credentials including email, password, and optional MFA code
 * @returns Promise that resolves when login is complete
 */
export async function loginAsUser(page: Page, credentials: LoginCredentials): Promise<void> {
  // Fill in email and password
  await page.getByLabel('email').fill(credentials.email);
  await page.getByLabel('password').fill(credentials.password);

  // Submit the form
  await page.getByRole('button', { name: /JE ME CONNECTE/i }).click();
}

/**
 * Register a new user
 * @param page - Playwright page object
 * @param userData - User registration data
 * @returns Promise that resolves when registration is complete
 */
export async function registerUser(page: Page, userData: RegisterFormData): Promise<void> {
  // Fill in registration form
  await page.getByLabel('firstName').fill(userData.firstName);
  await page.getByLabel('lastName').fill(userData.lastName);
  await page.getByLabel('email').fill(userData.email);
  await page.getByLabel('phone').fill(userData.phone);
  await page.getByLabel('password').fill(userData.password);
  await page.getByLabel('confirmPassword').fill(userData.password);

  // Submit the form
  await page.getByRole('button', { name: /JE M'INSCRIS/i }).click();
}

/**
 * Verify user email with the provided token
 * @param page - Playwright page object
 * @param token - Verification token
 * @param email - User's email (optional, will be retrieved from localStorage if not provided)
 * @returns Promise that resolves when verification is complete
 */
// export async function verifyEmail(
//     page: Page,
//     token: string,
//     email?: string
// ): Promise<void> {
//     await page.goto('/verify-email');

//     // If email is provided, fill it in
//     if (email) {
//         await page.getByLabel(/email/i).fill(email);
//     }

//     // Fill in the verification token
//     await page.getByLabel(/code de vérification/i).fill(token);

//     // Submit the form
//     await page.getByRole('button', { name: /vérifier mon email/i }).click();

//     // Wait for successful verification and redirection
//     await page.waitForURL(/\/login/);
//     await expect(page.getByText(/email vérifié avec succès/i)).toBeVisible();
// }

/**
 * Log out the current user
 * @param page - Playwright page object
 * @returns Promise that resolves when logout is complete
 */
export async function logout(page: Page): Promise<void> {
  // Open user profile dropdown
  const userMenuButton = page.getByRole('button', { name: /User menu/i });
  await expect(userMenuButton).toBeVisible();
  await userMenuButton.click();

  // Click logout button
  const logoutButton = page.getByRole('menuitem', { name: /Déconnexion/i });
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();
}

/**
 * Check if user is redirected to login when not authenticated
 * @param page - Playwright page object
 * @param path - Path to test (default: '/dashboard')
 */
// export async function expectAuthRequired(
//     page: Page,
//     path = '/dashboard'
// ): Promise<void> {
//     await page.goto(path);
//     await page.waitForURL(/\/login/);
//     await expect(page.getByText(/veuillez vous connecter/i)).toBeVisible();
// }

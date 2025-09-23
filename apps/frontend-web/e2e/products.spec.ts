import { test, expect } from '@playwright/test';

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/dashboard/);
  });

  test('should display products list', async ({ page }) => {
    await page.goto('/admin/products');

    // Check if products table is visible
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should allow creating a new product', async ({ page }) => {
    await page.goto('/admin/products/new');

    // Fill in the product form
    await page.getByLabel(/name/i).fill('Test Product');
    await page.getByLabel(/description/i).fill('This is a test product');
    await page.getByLabel(/price/i).fill('99.99');
    await page.getByLabel(/stock/i).fill('10');

    // Submit the form
    await page.getByRole('button', { name: /save product/i }).click();

    // Verify success message and redirection
    await expect(page.getByText(/product created successfully/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/products/);
  });
});

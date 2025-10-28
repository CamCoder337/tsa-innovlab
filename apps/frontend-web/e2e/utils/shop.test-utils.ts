import { expect, Page } from '@playwright/test';

/**
 * Shop test utilities for TSA InnovLab E2E tests
 * Provides reusable functions for testing shop functionality
 */

// ============================================
// Navigation Helpers
// ============================================

/**
 * Navigate to the shop page
 */
export async function navigateToShop(page: Page): Promise<void> {
  await page.goto('/app/shop');
  await page.waitForLoadState('networkidle');

  // Verify we're on the shop page
  await expect(page).toHaveURL(/\/app\/shop/);
}

/**
 * Navigate to a specific product details page
 */
export async function navigateToProduct(page: Page, productId: string): Promise<void> {
  await page.goto(`/app/shop/product/${productId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to cart page
 */
export async function navigateToCart(page: Page): Promise<void> {
  await page.goto('/app/shop/cart');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to orders page
 */
export async function navigateToOrders(page: Page): Promise<void> {
  await page.goto('/app/shop/orders');
  await page.waitForLoadState('networkidle');
}

// ============================================
// Product Interaction Helpers
// ============================================

/**
 * Get the first visible product card
 */
export async function getFirstProduct(page: Page) {
  const productCard = page.locator('[data-testid="product-card"]').first();
  await expect(productCard).toBeVisible({ timeout: 10000 });
  return productCard;
}

/**
 * Get all product cards on the page
 */
export async function getAllProducts(page: Page) {
  await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
  return page.locator('[data-testid="product-card"]');
}

/**
 * Click on a product to view details
 */
export async function clickProduct(page: Page, productIndex = 0): Promise<void> {
  const products = page.locator('[data-testid="product-card"]');
  await products.nth(productIndex).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Get product information from a product card
 */
export async function getProductInfo(productCard: any) {
  const name = await productCard.locator('[data-testid="product-name"]').textContent();
  const priceText = await productCard.locator('[data-testid="product-price"]').textContent();
  const price = parseFloat(priceText?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');

  return {
    name: name?.trim() || '',
    price,
  };
}

// ============================================
// Cart Helpers
// ============================================

/**
 * Add a product to cart from product card
 */
export async function addToCartFromCard(page: Page, productIndex = 0): Promise<void> {
  const products = page.locator('[data-testid="product-card"]');
  const product = products.nth(productIndex);

  const addButton = product.locator('[data-testid="add-to-cart-button"]');
  await addButton.click();

  // Wait for success feedback
  await page.waitForTimeout(1000);
}

/**
 * Add a product to cart from product details page
 */
export async function addToCartFromDetails(page: Page, quantity = 1): Promise<void> {
  // Set quantity if different from 1
  if (quantity > 1) {
    const quantityInput = page.locator('[data-testid="quantity-input"]');
    await quantityInput.fill(quantity.toString());
  }

  // Click add to cart
  const addButton = page.locator('[data-testid="add-to-cart-button"]');
  await addButton.click();

  // Wait for success feedback
  await expect(page.locator('[data-testid="cart-success-message"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Open cart drawer
 */
export async function openCartDrawer(page: Page): Promise<void> {
  const cartButton = page.locator('[data-testid="cart-button"]');
  await cartButton.click();

  // Wait for drawer to open
  await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
}

/**
 * Close cart drawer
 */
export async function closeCartDrawer(page: Page): Promise<void> {
  const closeButton = page.locator('[data-testid="cart-drawer-close"]');
  await closeButton.click();

  // Wait for drawer to close
  await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible();
}

/**
 * Get cart item count from the cart badge
 */
export async function getCartItemCount(page: Page): Promise<number> {
  const badge = page.locator('[data-testid="cart-badge"]');

  if (await badge.isVisible().catch(() => false)) {
    const text = await badge.textContent();
    return parseInt(text || '0', 10);
  }

  return 0;
}

/**
 * Update quantity of an item in cart
 */
export async function updateCartItemQuantity(
  page: Page,
  itemIndex: number,
  quantity: number
): Promise<void> {
  const cartItems = page.locator('[data-testid="cart-item"]');
  const item = cartItems.nth(itemIndex);

  const quantityInput = item.locator('[data-testid="cart-item-quantity"]');
  await quantityInput.fill(quantity.toString());
  await quantityInput.blur(); // Trigger update

  // Wait for update to complete
  await page.waitForTimeout(1000);
}

/**
 * Remove an item from cart
 */
export async function removeCartItem(page: Page, itemIndex: number): Promise<void> {
  const cartItems = page.locator('[data-testid="cart-item"]');
  const item = cartItems.nth(itemIndex);

  const removeButton = item.locator('[data-testid="remove-cart-item"]');
  await removeButton.click();

  // Wait for removal animation
  await page.waitForTimeout(500);
}

/**
 * Clear entire cart
 */
export async function clearCart(page: Page): Promise<void> {
  const clearButton = page.locator('[data-testid="clear-cart-button"]');

  if (await clearButton.isVisible().catch(() => false)) {
    await clearButton.click();

    // Confirm if there's a confirmation dialog
    const confirmButton = page.locator('[data-testid="confirm-clear-cart"]');
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    await page.waitForTimeout(1000);
  }
}

/**
 * Get cart total price
 */
export async function getCartTotal(page: Page): Promise<number> {
  const totalElement = page.locator('[data-testid="cart-total"]');
  const totalText = await totalElement.textContent();
  return parseFloat(totalText?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
}

// ============================================
// Order Helpers
// ============================================

/**
 * Proceed to checkout from cart
 */
export async function proceedToCheckout(page: Page): Promise<void> {
  const checkoutButton = page.locator('[data-testid="checkout-button"]');
  await checkoutButton.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Create an order from cart
 */
export async function createOrder(page: Page): Promise<void> {
  // Navigate to cart if not already there
  if (!page.url().includes('/cart')) {
    await navigateToCart(page);
  }

  // Proceed to checkout
  await proceedToCheckout(page);

  // Fill shipping information if required
  const shippingForm = page.locator('[data-testid="shipping-form"]');
  if (await shippingForm.isVisible({ timeout: 3000 }).catch(() => false)) {
    await fillShippingForm(page);
  }

  // Confirm order
  const confirmButton = page.locator('[data-testid="confirm-order-button"]');
  await confirmButton.click();

  // Wait for order confirmation
  await expect(page.locator('[data-testid="order-success"]')).toBeVisible({ timeout: 10000 });
}

/**
 * Fill shipping form
 */
export async function fillShippingForm(page: Page): Promise<void> {
  await page.locator('[data-testid="shipping-address"]').fill('123 Test Street');
  await page.locator('[data-testid="shipping-city"]').fill('Test City');
  await page.locator('[data-testid="shipping-zipcode"]').fill('12345');

  const continueButton = page.locator('[data-testid="continue-to-payment"]');
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click();
  }
}

/**
 * Get order details by order ID
 */
export async function getOrderDetails(page: Page, orderId: string) {
  await page.goto(`/app/shop/orders/${orderId}`);
  await page.waitForLoadState('networkidle');

  const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
  const status = await page.locator('[data-testid="order-status"]').textContent();
  const total = await page.locator('[data-testid="order-total"]').textContent();

  return {
    orderNumber: orderNumber?.trim() || '',
    status: status?.trim() || '',
    total: parseFloat(total?.replace(/[^\d.,]/g, '').replace(',', '.') || '0'),
  };
}

/**
 * Cancel an order
 */
export async function cancelOrder(page: Page, orderId: string): Promise<void> {
  await page.goto(`/app/shop/orders/${orderId}`);
  await page.waitForLoadState('networkidle');

  const cancelButton = page.locator('[data-testid="cancel-order-button"]');
  await cancelButton.click();

  // Confirm cancellation
  const confirmButton = page.locator('[data-testid="confirm-cancel-order"]');
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
  }

  // Wait for cancellation to complete
  await expect(page.locator('[data-testid="order-status"]')).toContainText(/cancelled|annulée/i);
}

// ============================================
// Filter and Search Helpers
// ============================================

/**
 * Search for products
 */
export async function searchProducts(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('[data-testid="product-search"]');
  await searchInput.fill(query);
  await searchInput.press('Enter');

  // Wait for search results
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Filter products by category
 */
export async function filterByCategory(page: Page, category: string): Promise<void> {
  const categoryFilter = page.locator('[data-testid="category-filter"]');
  await categoryFilter.selectOption({ label: category });

  // Wait for filter to apply
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Filter products by price range
 */
export async function filterByPriceRange(
  page: Page,
  minPrice: number,
  maxPrice: number
): Promise<void> {
  const minPriceInput = page.locator('[data-testid="min-price-filter"]');
  const maxPriceInput = page.locator('[data-testid="max-price-filter"]');

  await minPriceInput.fill(minPrice.toString());
  await maxPriceInput.fill(maxPrice.toString());

  // Apply filter
  const applyButton = page.locator('[data-testid="apply-price-filter"]');
  if (await applyButton.isVisible().catch(() => false)) {
    await applyButton.click();
  } else {
    await maxPriceInput.press('Enter');
  }

  // Wait for filter to apply
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Filter products by stock status
 */
export async function filterByStock(page: Page, inStockOnly: boolean): Promise<void> {
  const stockCheckbox = page.locator('[data-testid="in-stock-filter"]');

  const isChecked = await stockCheckbox.isChecked();
  if (inStockOnly && !isChecked) {
    await stockCheckbox.check();
  } else if (!inStockOnly && isChecked) {
    await stockCheckbox.uncheck();
  }

  // Wait for filter to apply
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Sort products
 */
export async function sortProducts(
  page: Page,
  sortBy: 'price-asc' | 'price-desc' | 'name' | 'date'
): Promise<void> {
  const sortSelect = page.locator('[data-testid="product-sort"]');
  await sortSelect.selectOption(sortBy);

  // Wait for sorting to apply
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Clear all filters
 */
export async function clearFilters(page: Page): Promise<void> {
  const clearButton = page.locator('[data-testid="clear-filters"]');

  if (await clearButton.isVisible().catch(() => false)) {
    await clearButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }
}

// ============================================
// View Mode Helpers
// ============================================

/**
 * Switch to grid view
 */
export async function switchToGridView(page: Page): Promise<void> {
  const gridButton = page.locator('[data-testid="view-grid"]');
  await gridButton.click();
  await page.waitForTimeout(500);
}

/**
 * Switch to list view
 */
export async function switchToListView(page: Page): Promise<void> {
  const listButton = page.locator('[data-testid="view-list"]');
  await listButton.click();
  await page.waitForTimeout(500);
}

// ============================================
// Recommendations Helpers
// ============================================

/**
 * Get recommended products
 */
export async function getRecommendedProducts(page: Page) {
  const recommendations = page.locator('[data-testid="recommended-product"]');
  await expect(recommendations.first()).toBeVisible({ timeout: 10000 });
  return recommendations;
}

/**
 * Click on a recommended product
 */
export async function clickRecommendedProduct(page: Page, index = 0): Promise<void> {
  const recommendations = page.locator('[data-testid="recommended-product"]');
  await recommendations.nth(index).click();
  await page.waitForLoadState('networkidle');
}

// ============================================
// Wishlist Helpers
// ============================================

/**
 * Add product to wishlist
 */
export async function addToWishlist(page: Page): Promise<void> {
  const wishlistButton = page.locator('[data-testid="add-to-wishlist"]');
  await wishlistButton.click();
  await page.waitForTimeout(1000);
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(page: Page): Promise<void> {
  const wishlistButton = page.locator('[data-testid="remove-from-wishlist"]');
  await wishlistButton.click();
  await page.waitForTimeout(1000);
}

// ============================================
// Product Details Helpers
// ============================================

/**
 * Navigate through product image gallery
 */
export async function navigateImageGallery(page: Page, imageIndex: number): Promise<void> {
  const thumbnails = page.locator('[data-testid="product-image-thumbnail"]');
  await thumbnails.nth(imageIndex).click();
  await page.waitForTimeout(500);
}

/**
 * Increment product quantity
 */
export async function incrementQuantity(page: Page): Promise<void> {
  const incrementButton = page.locator('[data-testid="quantity-increment"]');
  await incrementButton.click();
  await page.waitForTimeout(300);
}

/**
 * Decrement product quantity
 */
export async function decrementQuantity(page: Page): Promise<void> {
  const decrementButton = page.locator('[data-testid="quantity-decrement"]');
  await decrementButton.click();
  await page.waitForTimeout(300);
}

/**
 * Get current product quantity
 */
export async function getProductQuantity(page: Page): Promise<number> {
  const quantityInput = page.locator('[data-testid="quantity-input"]');
  const value = await quantityInput.inputValue();
  return parseInt(value, 10);
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Verify product is displayed correctly
 */
export async function verifyProductDisplay(page: Page): Promise<void> {
  await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
  await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
  await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
  await expect(page.locator('[data-testid="product-image"]')).toBeVisible();
}

/**
 * Verify cart is empty
 */
export async function verifyCartIsEmpty(page: Page): Promise<void> {
  const emptyMessage = page.locator('[data-testid="cart-empty-message"]');
  await expect(emptyMessage).toBeVisible();
}

/**
 * Verify cart has items
 */
export async function verifyCartHasItems(page: Page, expectedCount?: number): Promise<void> {
  const cartItems = page.locator('[data-testid="cart-item"]');
  await expect(cartItems.first()).toBeVisible();

  if (expectedCount !== undefined) {
    await expect(cartItems).toHaveCount(expectedCount);
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  endpoint: string,
  timeout = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  );
}

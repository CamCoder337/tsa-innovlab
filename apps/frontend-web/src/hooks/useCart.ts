import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { Product } from '@/types/product.types';
import type { Cart } from '@/types/cart.types';

/**
 * Custom hook for cart operations
 * Provides a clean interface to the cart store with automatic initialization
 */
export const useCart = () => {
  const {
    cart,
    isLoading,
    error,
    isInitialized,
    initializeCart,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    syncWithServer,
    getItemByProductId,
    getItemQuantity,
    setLoading,
    setError,
    reset,
  } = useCartStore();

  // Initialize cart on first use
  useEffect(() => {
    if (!isInitialized) {
      initializeCart();
    }
  }, [isInitialized, initializeCart]);

  // Enhanced methods with additional logic
  const addToCart = (product: Product, quantity: number = 1) => {
    try {
      setError(null);
      addItem(product, quantity);
    } catch (error) {
      setError('Failed to add item to cart');
      console.error('Error adding item to cart:', error);
    }
  };

  const removeFromCart = (productId: string) => {
    try {
      setError(null);
      removeItem(productId);
    } catch (error) {
      setError('Failed to remove item from cart');
      console.error('Error removing item from cart:', error);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    try {
      setError(null);
      updateItemQuantity(productId, quantity);
    } catch (error) {
      setError('Failed to update item quantity');
      console.error('Error updating item quantity:', error);
    }
  };

  const clearAllItems = () => {
    try {
      setError(null);
      clearCart();
    } catch (error) {
      setError('Failed to clear cart');
      console.error('Error clearing cart:', error);
    }
  };

  // Helper methods
  const isInCart = (productId: string): boolean => {
    return getItemQuantity(productId) > 0;
  };

  const getTotalItems = (): number => {
    return cart.totalQuantity;
  };

  const getTotalPrice = (): number => {
    return cart.totalPrice;
  };

  const getFormattedTotalPrice = (): string => {
    return `${cart.totalPrice.toLocaleString()} FCFA`;
  };

  const isEmpty = (): boolean => {
    return cart.items.length === 0;
  };

  // For authenticated users - sync local cart with server
  const syncCartWithServer = async (serverCart: Cart) => {
    try {
      setLoading(true);
      setError(null);

      // If cart has no ID but has items, we need to add them to server cart
      if (!cart.id && cart.items.length > 0) {
        // This would be implemented when Cart API is available
        console.log('Would sync local items to server:', cart.items);
        // TODO: Implement API calls to add local items to server cart
      }

      syncWithServer(serverCart);
    } catch (error) {
      setError('Failed to sync cart with server');
      console.error('Error syncing cart with server:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    cart,
    isLoading,
    error,
    isInitialized,

    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearAllItems,
    syncCartWithServer,
    reset,

    // Getters
    getItemByProductId,
    getItemQuantity,
    isInCart,
    getTotalItems,
    getTotalPrice,
    getFormattedTotalPrice,
    isEmpty,

    // Utility
    setError,
  };
};

/**
 * Hook for cart loading state
 */
export const useCartLoading = () => {
  const isLoading = useCartStore((state) => state.isLoading);
  return isLoading;
};

/**
 * Hook for cart error state
 */
export const useCartError = () => {
  const error = useCartStore((state) => state.error);
  return error;
};

/**
 * Hook for cart items count
 */
export const useCartItemsCount = () => {
  const totalQuantity = useCartStore((state) => state.cart.totalQuantity);
  return totalQuantity;
};

/**
 * Hook for cart total price
 */
export const useCartTotalPrice = () => {
  const totalPrice = useCartStore((state) => state.cart.totalPrice);
  return totalPrice;
};

/**
 * Hook to check if a specific product is in cart
 */
export const useIsInCart = (productId: string) => {
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  return getItemQuantity(productId) > 0;
};

/**
 * Hook to get quantity of a specific product in cart
 */
export const useCartItemQuantity = (productId: string) => {
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  return getItemQuantity(productId);
};

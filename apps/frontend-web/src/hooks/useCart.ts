import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { Product } from '@/types/product.types';

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
    fetchCart,
    getItemByProductId,
    getItemQuantity,
    getTotalItems: getStoreTotalItems,
    getTotalPrice: getStoreTotalPrice,
    setLoading,
    setError,
    reset,
  } = useCartStore();

  // Initialize cart on first use
  useEffect(() => {
    if (!isInitialized) {
      initializeCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // Enhanced methods with additional logic
  const addToCart = (product: Product, quantity: number = 1) => {
    try {
      setError(null);
      addItem(product.id, quantity);
    } catch (error) {
      setError('Failed to add item to cart');
      console.error('Error adding item to cart:', error);
    }
  };

  const removeFromCart = (itemId: string) => {
    try {
      setError(null);
      removeItem(itemId);
    } catch (error) {
      setError('Failed to remove item from cart');
      console.error('Error removing item from cart:', error);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    try {
      setError(null);
      updateItemQuantity(itemId, quantity);
    } catch (error) {
      setError('Failed to update item quantity');
      console.error('Error updating item quantity:', error);
    }
  };

  // Helper methods
  const isInCart = (productId: string): boolean => {
    return getItemQuantity(productId) > 0;
  };

  const getTotalItems = (): number => {
    return getStoreTotalItems();
  };

  const getTotalPrice = (): number => {
    return getStoreTotalPrice();
  };

  const getFormattedTotalPrice = (): string => {
    return `${getTotalPrice().toLocaleString()} FCFA`;
  };

  const isEmpty = (): boolean => {
    return cart.items.length === 0;
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
    clearCart,
    fetchCart,

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
    setLoading,
    reset,
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
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  return getTotalItems();
};

/**
 * Hook for cart total price
 */
export const useCartTotalPrice = () => {
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  return getTotalPrice();
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

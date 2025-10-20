import { create } from 'zustand';
import type { Cart, CartItem, CartStore, AddToCartRequest } from '@/types/cart.types';
import type { Product } from '@/types/product.types';
import { getPersistedUser, useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';
import { shopService } from '@/services/shop.service';
import { createJSONStorage, persist } from 'zustand/middleware';

const CART_STORAGE_KEY = 'tsa_cart';

// Initial empty cart state
const createEmptyCart = (): Cart => {
  const currentUser = useAuthStore.getState().currentUser;
  return {
    userId: currentUser?.id || '',
    status: 'active',
    items: [],
  };
};

// Cart calculation utilities
function calculateCartTotals(items: CartItem[]): {
  itemsCount: number;
  totalPrice: number;
  totalQuantity: number;
} {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + parseInt(item.unitPrice) * item.quantity, 0);
  const itemsCount = items.length;

  return { itemsCount, totalPrice, totalQuantity };
}

function updateCartTotals(cart: Cart): Cart {
  const totals = calculateCartTotals(cart.items);
  return {
    ...cart,
    ...totals,
  };
}

function getPersistedCart(): Cart {
  try {
    const persistedData = localStorage.getItem(CART_STORAGE_KEY);
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      const cartData: Cart = parsed.state.cart;
      // Populate missing product fields for cart items
      cartData.items = cartData.items.map((item) => {
        if (!item.product) {
          // Find the product from the product store
          const products = useProductStore.getState().products;
          const product = products.find((p: Product) => p.id === item.productId);
          if (product) {
            return { ...item, product };
          }
        }
        return item;
      });
      return cartData;
    }
  } catch (error) {
    console.error('Error loading persisted cart data:', error);
  }
  return createEmptyCart();
}

const currentUser = getPersistedUser() || null;

const initialState = {
  cart: createEmptyCart(),
  isLoading: false,
  error: null,
  isInitialized: false,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Initialize cart from localStorage
      initializeCart: async () => {
        const savedCart = getPersistedCart();
        const updatedCart = updateCartTotals(savedCart);

        set({
          cart: updatedCart,
          isInitialized: true,
          error: null,
        });
      },

      // Add item to cart
      addItem: async (productId: string, quantity: number = 1, sync: boolean = false) => {
        const { cart } = get();

        try {
          set({ isLoading: true, error: null });

          if (currentUser) {
            // Authenticated user - use API
            const addRequest: AddToCartRequest = { productId, quantity };
            const response = await shopService.addCartItem(addRequest);

            if (response.error) {
              set({ error: response.error.message, isLoading: false });
              return;
            }

            if (response.data) {
              if (sync) {
                return;
              }
              const updatedCart = {
                ...cart,
                items: [...cart.items, response.data],
              };
              set({
                cart: updateCartTotals(updatedCart),
                isLoading: false,
                error: null,
              });
            }
          } else {
            // Unauthenticated user - use local storage
            const products = useProductStore.getState().products;
            const product = products.find((p: Product) => p.id === productId);

            if (!product) {
              set({ error: 'Product not found', isLoading: false });
              return;
            }

            const existingItemIndex = cart.items.findIndex((item) => item.productId === productId);
            let updatedItems: CartItem[];

            if (existingItemIndex >= 0) {
              updatedItems = cart.items.map((item, index) =>
                index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item
              );
            } else {
              const newItem: CartItem = {
                id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                cartId: cart.id || '',
                productId: product.id,
                product,
                quantity,
                unitPrice: product.price,
              };
              updatedItems = [...cart.items, newItem];
            }

            const updatedCart = updateCartTotals({ ...cart, items: updatedItems });
            set({ cart: updatedCart, isLoading: false, error: null });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add item to cart',
            isLoading: false,
          });
        }
      },

      // Remove item from cart
      removeItem: async (itemId: string) => {
        const { cart } = get();

        try {
          set({ isLoading: true, error: null });

          if (currentUser) {
            // Authenticated user - use API
            const response = await shopService.deleteCartItem(itemId);

            if (response.error) {
              set({ error: response.error.message, isLoading: false });
              return;
            }
          }
          // Unauthenticated user - use local storage
          const updatedItems = cart.items.filter((item) => item.id !== itemId);
          const updatedCart = updateCartTotals({ ...cart, items: updatedItems });
          set({ cart: updatedCart, isLoading: false, error: null });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to remove item from cart',
            isLoading: false,
          });
        }
      },

      // Update item quantity
      updateItemQuantity: async (itemId: string, quantity: number) => {
        const { cart, removeItem } = get();

        if (quantity <= 0) {
          await removeItem(itemId);
          return;
        }

        try {
          set({ isLoading: true, error: null });

          if (currentUser) {
            // Authenticated user - use API
            const response = await shopService.updateCartItem(itemId, quantity);

            if (response.error) {
              set({ error: response.error.message, isLoading: false });
              return;
            }

            if (response.data) {
              const updatedCart = {
                ...cart,
                items: [...cart.items, response.data],
              };
              set({
                cart: updateCartTotals(updatedCart),
                isLoading: false,
                error: null,
              });
            }
          } else {
            // Unauthenticated user - use local storage
            const updatedItems = cart.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            );
            const updatedCart = updateCartTotals({ ...cart, items: updatedItems });
            set({ cart: updatedCart, isLoading: false, error: null });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update item quantity',
            isLoading: false,
          });
        }
      },

      // Clear cart
      clearCart: async () => {
        try {
          set({ isLoading: true, error: null });

          if (currentUser) {
            // Authenticated user - use API
            const response = await shopService.clearCart();

            if (response.error) {
              set({ error: response.error.message, isLoading: false });
              return;
            }

            // Refresh cart from server
            await get().fetchCart();
          } else {
            // Unauthenticated user - clear local storage
            const emptyCart = createEmptyCart();
            set({ cart: emptyCart, isLoading: false, error: null });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to clear cart',
            isLoading: false,
          });
        }
      },

      // Fetch cart from server
      fetchCart: async () => {
        const currentUser = useAuthStore.getState().currentUser;
        const { cart: localCart, syncWithServer } = get();

        try {
          set({ isLoading: true, error: null });

          if (currentUser) {
            if (!localCart.id && localCart.items.length > 0) {
              syncWithServer();
            }
            // Authenticated user - fetch from API
            const response = await shopService.getCart();

            if (response.error) {
              set({ error: response.error.message, isLoading: false });
              return;
            }

            if (response.data) {
              set({ cart: response.data, isLoading: false, error: null });
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch cart',
            isLoading: false,
          });
        }
      },

      // Sync with server cart (for authenticated users)
      syncWithServer: async () => {
        const { cart: localCart, addItem, error } = get();

        try {
          // If local cart has items and no ID, merge them with server cart
          for (const item of localCart.items) {
            await addItem(item.productId, item.quantity, true);
            if (error) {
              console.error(error);
              return;
            }
            const updatedItems = localCart.items.filter((localItem) => localItem.id !== item.id);
            const updatedCart = updateCartTotals({ ...localCart, items: updatedItems });
            set({ cart: updatedCart, isLoading: false, error: null });
          }

          localStorage.removeItem(CART_STORAGE_KEY);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to sync with server',
            isLoading: false,
          });
        }
      },

      // Get item by product ID
      getItemByProductId: (productId: string) => {
        const { cart } = get();
        return cart.items.find((item) => item.productId === productId);
      },

      // Get item quantity by product ID
      getItemQuantity: (productId: string) => {
        const item = get().getItemByProductId(productId);
        return item?.quantity ?? 0;
      },

      // Get total number of items in cart
      getTotalItems: () => {
        const { cart } = get();
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
      },

      // Get total price of all items in cart
      getTotalPrice: () => {
        const { cart } = get();
        return cart.items.reduce((sum, item) => sum + parseInt(item.unitPrice) * item.quantity, 0);
      },

      // Utility actions
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      reset: () => {
        const emptyCart = createEmptyCart();
        set({
          cart: emptyCart,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    }),
    {
      name: 'tsa_cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);

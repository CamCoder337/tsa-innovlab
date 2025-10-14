import { create } from 'zustand';
import type { Cart, CartItem, CartStore } from '@/types/cart.types';
import type { Product } from '@/types/product.types';
import { useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';

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

// localStorage utilities
function persistCartToLocalStorage(cart: Cart): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to persist cart to localStorage:', error);
  }
}

function loadCartFromLocalStorage(): Cart {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const cartData: Cart = JSON.parse(raw);
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
    console.error('Failed to load cart from localStorage:', error);
  }
  return createEmptyCart();
}

function clearCartFromLocalStorage(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear cart from localStorage:', error);
  }
}

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

export const useCartStore = create<CartStore>((set, get) => ({
  // State
  cart: createEmptyCart(),
  isLoading: false,
  error: null,
  isInitialized: false,

  // Initialize cart from localStorage
  initializeCart: async () => {
    const savedCart = loadCartFromLocalStorage();
    const updatedCart = updateCartTotals(savedCart);

    set({
      cart: updatedCart,
      isInitialized: true,
      error: null,
    });
  },

  // Add item to cart
  addItem: async (product: Product, quantity: number = 1) => {
    const { cart } = get();
    const existingItemIndex = cart.items.findIndex((item) => item.productId === product.id);

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
        product, // Include the full product object
        quantity,
        unitPrice: product.price,
      };
      updatedItems = [...cart.items, newItem];
    }

    const updatedCart = updateCartTotals({ ...cart, items: updatedItems });

    // For unauthenticated users, persist to localStorage
    if (!cart.id) {
      persistCartToLocalStorage(updatedCart);
    }

    set({ cart: updatedCart, error: null });
  },

  // Remove item from cart
  removeItem: async (itemId: string) => {
    const { cart } = get();
    const updatedItems = cart.items.filter((item) => item.id !== itemId);
    const updatedCart = updateCartTotals({ ...cart, items: updatedItems });

    // For unauthenticated users, persist to localStorage
    if (!cart.id) {
      persistCartToLocalStorage(updatedCart);
    }

    set({ cart: updatedCart, error: null });
  },

  // Update item quantity
  updateItemQuantity: async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await get().removeItem(itemId);
      return;
    }

    const { cart } = get();
    const updatedItems = cart.items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );

    const updatedCart = updateCartTotals({ ...cart, items: updatedItems });

    // For unauthenticated users, persist to localStorage
    if (!cart.id) {
      persistCartToLocalStorage(updatedCart);
    }

    set({ cart: updatedCart, error: null });
  },

  // Clear cart
  clearCart: async () => {
    const emptyCart = createEmptyCart();
    clearCartFromLocalStorage();
    set({ cart: emptyCart, error: null });
  },

  // Fetch cart from server
  fetchCart: async () => {
    try {
      set({ isLoading: true, error: null });

      // TODO: Implement API call to fetch cart from server
      // const cartData = await cartService.getCart();
      // const updatedCart = updateCartTotals(cartData);
      // set({ cart: updatedCart, isLoading: false });

      // For now, just load from localStorage
      const savedCart = loadCartFromLocalStorage();
      const updatedCart = updateCartTotals(savedCart);
      set({ cart: updatedCart, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch cart',
        isLoading: false,
      });
    }
  },

  // Sync with server cart (for authenticated users)
  syncWithServer: (serverCart: Cart) => {
    const { cart: localCart } = get();

    // If local cart has no ID and has items, we need to merge
    if (!localCart.id && localCart.items.length > 0) {
      // This would typically involve API calls to add local items to server cart
      // For now, we'll just replace with server cart and note the merge requirement
      console.log('Local cart items need to be synced to server:', localCart.items);
    }

    const updatedCart = updateCartTotals(serverCart);
    persistCartToLocalStorage(updatedCart);
    set({ cart: updatedCart, error: null });
  },

  // Get item by product ID
  getItemByProductId: (productId: string) => {
    const { cart } = get();
    return cart.items.find((item) => item.productId === productId);
  },

  // Get item quantity by product ID
  getItemQuantity: (productId: string) => {
    const item = get().getItemByProductId(productId);
    return item ? item.quantity : 0;
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
    clearCartFromLocalStorage();
    set({
      cart: emptyCart,
      isLoading: false,
      error: null,
      isInitialized: false,
    });
  },
}));

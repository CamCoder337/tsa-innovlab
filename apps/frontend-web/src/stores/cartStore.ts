import { create } from 'zustand';
import type { Cart, CartItem, CartStore, LocalCartData } from '@/types/cart.types';
import type { Product } from '@/types/product.types';

const CART_STORAGE_KEY = 'tsa_cart';

// Initial empty cart state
const createEmptyCart = (): Cart => ({
  items: [],
  itemsCount: 0,
  totalPrice: 0,
  totalQuantity: 0,
});

// localStorage utilities
function persistCartToLocalStorage(cart: Cart): void {
  try {
    const cartData: LocalCartData = {
      cart,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
  } catch (error) {
    console.error('Failed to persist cart to localStorage:', error);
  }
}

function loadCartFromLocalStorage(): Cart {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const cartData: LocalCartData = JSON.parse(raw);
      return cartData.cart;
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
  const totalPrice = items.reduce((sum, item) => sum + item.priceAtTime * item.quantity, 0);
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
  initializeCart: () => {
    const savedCart = loadCartFromLocalStorage();
    const updatedCart = updateCartTotals(savedCart);

    set({
      cart: updatedCart,
      isInitialized: true,
      error: null,
    });
  },

  // Add item to cart
  addItem: (product: Product, quantity: number = 1) => {
    const { cart } = get();
    const existingItemIndex = cart.items.findIndex((item) => item.productId === product.id);

    let updatedItems: CartItem[];

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      updatedItems = cart.items.map((item, index) =>
        index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product.id,
        product,
        quantity,
        priceAtTime: parseFloat(product.price),
        addedAt: new Date().toISOString(),
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
  removeItem: (productId: string) => {
    const { cart } = get();
    const updatedItems = cart.items.filter((item) => item.productId !== productId);
    const updatedCart = updateCartTotals({ ...cart, items: updatedItems });

    // For unauthenticated users, persist to localStorage
    if (!cart.id) {
      persistCartToLocalStorage(updatedCart);
    }

    set({ cart: updatedCart, error: null });
  },

  // Update item quantity
  updateItemQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const { cart } = get();
    const updatedItems = cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );

    const updatedCart = updateCartTotals({ ...cart, items: updatedItems });

    // For unauthenticated users, persist to localStorage
    if (!cart.id) {
      persistCartToLocalStorage(updatedCart);
    }

    set({ cart: updatedCart, error: null });
  },

  // Clear cart
  clearCart: () => {
    const emptyCart = createEmptyCart();
    clearCartFromLocalStorage();
    set({ cart: emptyCart, error: null });
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

import type { Product } from './product.types';

export interface CartItem {
  id?: string; // Optional for local cart items
  productId: string;
  product: Product;
  quantity: number;
  priceAtTime: number; // Price when item was added to cart
  addedAt: string;
}

export interface Cart {
  id?: string; // Optional for local cart (unauthenticated users)
  userId?: string; // Only for authenticated users
  items: CartItem[];
  itemsCount: number;
  totalPrice: number;
  totalQuantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartStore {
  // State
  cart: Cart;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initializeCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncWithServer: (serverCart: Cart) => void;

  // Computed getters
  getItemByProductId: (productId: string) => CartItem | undefined;
  getItemQuantity: (productId: string) => number;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface LocalCartData {
  cart: Cart;
  lastUpdated: string;
}

// For API integration (when available)
export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface CartApiResponse {
  success: boolean;
  data: Cart;
  message?: string;
}

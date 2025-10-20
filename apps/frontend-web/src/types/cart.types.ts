import type { Product } from './product.types';
import type { User } from './auth.types';
import type { Timestamps } from './common.types';

export type CartStatus = 'active' | 'abandoned' | 'converted';

export interface CartItem extends Partial<Timestamps> {
  id: string;
  cartId: string;
  productId: string;
  product?: Product; // Optional populated relation
  quantity: number;
  unitPrice: string; // Prix unitaire au moment de l'ajout au panier (decimal as string)
}

export interface Cart extends Partial<Timestamps> {
  id?: string;
  userId: string;
  user?: User; // Optional populated relation
  status: CartStatus;
  items: CartItem[]; // Optional populated relation
}

export interface CartStore {
  // State
  cart: Cart;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initializeCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, sync?: boolean) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;

  // Computed getters
  getItemByProductId: (productId: string) => CartItem | undefined;
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// API Request DTOs (matching validators)
export interface AddToCartRequest {
  productId: string;
  quantity?: number; // Optional, defaults to 1 (min: 1, max: 100)
  sync?: boolean;
}

export interface UpdateCartItemRequest {
  quantity: number; // min: 1, max: 100
}

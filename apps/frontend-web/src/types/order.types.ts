import type { Address } from './address.types';
import type { User } from './auth.types';
import type { Timestamps } from './common.types';

export enum OrderStatus {
  PENDING = 'pending', // En attente de paiement
  PAID = 'paid', // Payée
  PROCESSING = 'processing', // En cours de traitement
  SHIPPED = 'shipped', // Expédiée
  DELIVERED = 'delivered', // Livrée
  CANCELLED = 'cancelled', // Annulée
  REFUNDED = 'refunded', // Remboursée
}

export enum PaymentMethod {
  ORANGE_MONEY = 'orange_money',
  MTN_MOMO = 'mtn_momo',
  WAVE = 'wave',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface OrderItem extends Partial<Timestamps> {
  id: string;
  orderId: string;
  productId: string;
  productName?: string;
  productReference?: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: string; // Decimal stored as string
  subtotal: string; // Decimal stored as string
}

export interface Order extends Partial<Timestamps> {
  id: string;
  userId: string;
  user?: User; // Optional populated relation
  orderNumber: string; // Numéro de commande unique (ex: ORD-20250101-0001)
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paymentReference: string | null; // Référence de paiement externe
  subtotal: string; // Sous-total (produits uniquement)
  shippingCost: string; // Frais de livraison
  tax: string; // Taxes
  total: string; // Total final
  shippingAddressId: string | null;
  billingAddressId: string | null;
  shippingAddress?: Address; // Optional populated relation
  billingAddress?: Address; // Optional populated relation
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string | null; // Notes de la commande
  trackingNumber: string | null; // Numéro de suivi de livraison
  items?: OrderItem[]; // Optional populated relation
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
}

// DTOs for API requests
export interface CreateOrderRequest {
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  trackingNumber?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface OrdersListResponse {
  orders: Order[];
  pagination?: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Store types for order management
export interface OrderStore {
  // State
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: () => Promise<void>;
  fetchOrder: (orderId: string) => Promise<void>;
  createOrder: (orderData: CreateOrderRequest) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Development utility methods
  loadMockData: () => void;
  addMockOrder: (order: Order) => void;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Query params version (strings from URL)
export interface OrderFiltersQuery {
  page?: string;
  limit?: string;
  status?: OrderStatus;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

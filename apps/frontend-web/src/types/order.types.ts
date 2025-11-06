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
  MTN_MOMO = 'mtn_mobile_money',
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
  totalPrice: string; // Backend uses totalPrice instead of subtotal
  subtotal?: string; // Alias for compatibility
}

export interface Order extends Timestamps {
  id: string;
  userId: string;
  user?: User; // Optional populated relation (contains firstName, lastName, email, phone)
  orderNumber: string; // Numéro de commande unique (ex: ORD-202511-0001)
  status: OrderStatus;
  paymentMethod: string; // PaymentMethod as string from backend
  paymentStatus: PaymentStatus;
  totalAmount: string; // Total amount from backend as string (decimal)
  shippingAddressId: string;
  billingAddressId: string;
  shippingAddress?: Address; // Optional populated relation
  billingAddress?: Address; // Optional populated relation
  notes: string | null; // Notes de la commande
  items?: OrderItem[]; // Optional populated relation
  payment?: any; // Optional payment relation
}

// DTOs for API requests
export interface CreateOrderRequest {
  // Option 1: Use existing addresses by ID
  shippingAddressId?: string;
  billingAddressId?: string;
  // Option 2: Provide address data to create new addresses
  shippingAddress?: {
    street: string;
    city: string;
    region: string;
    country: string;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    label?: string | null;
  };
  billingAddress?: {
    street: string;
    city: string;
    region: string;
    country: string;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    label?: string | null;
  };
  paymentMethod: PaymentMethod | string; // Accept both enum and string values
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
  fetchOrders: (params?: OrderFiltersQuery) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<void>;
  createOrder: (orderData: CreateOrderRequest) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
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

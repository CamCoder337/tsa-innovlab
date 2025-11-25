import type { Address } from './address.types';
import type { User } from './auth.types';
import type { Timestamps } from './common.types';
import type { Product } from './product.types';

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
  MOOV = 'moov_money',
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
  product?: Product;
  quantity: number;
  unitPrice: string; // Decimal stored as string
  totalPrice: string; // Decimal stored as string (used by backend)
}

export interface Order extends Timestamps {
  id: string;
  userId: string;
  user?: User; // Optional populated relation
  orderNumber: string; // Numéro de commande unique (ex: ORD-20250101-0001)
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  shippingAddress: Address; // Optional populated relation
  billingAddress: Address; // Optional populated relation
  notes: string | null; // Notes de la commande
  items: OrderItem[]; // Optional populated relation
}

// DTOs for API requests
export interface CreateOrderRequest {
  shippingAddressId?: string | null;
  billingAddressId?: string | null;
  shippingAddress?: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  billingAddress?: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
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

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Query params version (strings from URL)
export interface OrderFiltersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  userId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminOrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: {
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  ordersByPaymentStatus: {
    pending: number;
    completed: number;
    failed: number;
    refunded: number;
  };
  recentOrders: Order[];
  topProducts?: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export interface BulkOrderActionRequest {
  orderIds: string[];
  action: 'cancel' | 'update_status' | 'export' | 'delete';
  data?: {
    status?: OrderStatus;
    reason?: string;
  };
}

export interface BulkOrderActionResult {
  success: number;
  failed: number;
  errors: Array<{
    orderId: string;
    error: string;
  }>;
}

// Store types for order management
export interface OrderStore {
  // State
  orders: Order[];
  currentOrder: Order | null;
  stats: AdminOrderStats | OrderStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: (params?: OrderFiltersQuery) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<void>;
  createOrder: (orderData: CreateOrderRequest) => Promise<Order>;
  updateOrderStatus: (orderId: string, data: UpdateOrderStatusRequest) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<void>;
  fetchStats: () => Promise<void>;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

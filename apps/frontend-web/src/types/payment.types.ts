import type { Timestamps } from './common.types';
import type { Order } from './order.types';

// Align with backend Order model PaymentStatus enum
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Align with backend Order model PaymentMethod enum
export type PaymentMethod =
  | 'orange_money'
  | 'mtn_mobile_money'
  | 'wave'
  | 'bank_transfer'
  | 'cash_on_delivery';

// Legacy type for backward compatibility
export type PaymentMethodType = 'card' | 'mobile' | 'cash';

export type MobileMoneyProvider = 'orange_money' | 'mtn_mobile_money' | 'wave';

// Updated Payment interface to match backend e-commerce flow
export interface Payment extends Timestamps {
  id: string;
  orderId: string;
  order?: Order;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  phoneNumber?: string;
}

// Enhanced Mobile Money Details for MTN integration
export interface MobileMoneyDetails {
  provider: MobileMoneyProvider;
  phoneNumber: string;
  receiverName?: string;
  // MTN Mobile Money specific fields
  amount: string;
  currency?: string;
  externalId?: string;
  payerMessage?: string;
  payeeNote?: string;
}

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  saveCard?: boolean;
}

// Updated for e-commerce and MTN Mobile Money integration
export interface CreatePaymentRequest {
  orderId: string;
  payerMessage: string;
}

// MTN Mobile Money payment confirmation
export interface ConfirmPaymentRequest {
  transactionId?: string;
  metadata?: Record<string, unknown>;
}

// Saved payment method for users
export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethod;
  // For mobile money
  phoneNumber?: string;
  provider?: MobileMoneyProvider;
  // For cards (future)
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// MTN Mobile Money API Response types
export interface MTNPaymentResponse {
  financialTransactionId: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage?: string;
  payeeNote?: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
}

// Payment simulation for development
export interface PaymentSimulation {
  success: boolean;
  transactionId: string;
  message: string;
  processingTime?: number;
}

// E-commerce specific payment types
export interface OrderPaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  phoneNumber?: string; // For mobile money
  deliveryAddress?: {
    street: string;
    city: string;
    postalCode?: string;
    country: string;
  };
}

export interface PaymentWebhookData {
  paymentId: string;
  status: PaymentStatus;
  transactionId?: string;
  amount: string;
  currency: string;
  timestamp: string;
}

// Payment filters and queries
export interface PaymentFilters {
  status?: PaymentStatus[];
  paymentMethod?: PaymentMethod[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  orderId?: string;
  missionId?: string;
}

export interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

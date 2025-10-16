// Align with backend Order model PaymentStatus enum
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Align with backend Order model PaymentMethod enum
export type PaymentMethod =
  | 'orange_money'
  | 'mtn_momo'
  | 'wave'
  | 'bank_transfer'
  | 'cash_on_delivery';

// Legacy type for backward compatibility
export type PaymentMethodType = 'card' | 'mobile' | 'cash';

export type MobileMoneyProvider = 'orange_money' | 'mtn_momo' | 'wave';

// Updated Payment interface to match backend e-commerce flow
export interface Payment {
  id: string;
  orderId?: string; // For e-commerce orders
  missionId?: string; // For mission payments
  amount: number; // Decimal as string to match backend
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string; // MTN Mobile Money transaction ID
  reference?: string; // Payment reference
  receiptUrl?: string;
  paidAt?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  // MTN Mobile Money specific fields
  mtnTransactionId?: string;
  mtnStatus?: string;
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
  orderId?: string; // For e-commerce orders
  missionId?: string; // For mission payments
  amount: string; // Decimal as string
  currency?: string;
  paymentMethod: PaymentMethod;
  // MTN Mobile Money specific fields
  phoneNumber?: string;
  payerMessage?: string;
  payeeNote?: string;
}

// MTN Mobile Money payment confirmation
export interface ConfirmPaymentRequest {
  paymentId: string;
  transactionId?: string; // MTN transaction ID
  confirmationCode?: string;
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

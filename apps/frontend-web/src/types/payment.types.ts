export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethodType = 'card' | 'mobile' | 'cash';

export type MobileMoneyProvider = 'orange_money' | 'mtn_mobile_money';

export interface Payment {
  id: string;
  // missionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;
  paymentIntentId?: string;
  receiptUrl?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MobileMoneyDetails {
  provider: MobileMoneyProvider;
  phoneNumber: string;
  receiverName: string;
}

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  saveCard?: boolean;
}

export interface CreatePaymentIntentDto {
  // missionId: string;
  amount: number;
  currency?: string;
  paymentMethodId?: string;
}

export interface ConfirmPaymentDto {
  paymentIntentId: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

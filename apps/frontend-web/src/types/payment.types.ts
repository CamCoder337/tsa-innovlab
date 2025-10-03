export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface Payment {
  id: string;
  missionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  paymentIntentId?: string;
  receiptUrl?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentIntentDto {
  missionId: string;
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

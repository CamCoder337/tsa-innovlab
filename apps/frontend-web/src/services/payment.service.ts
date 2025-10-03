import type {
  Payment,
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  PaymentMethod,
} from '@/types/payment.types';

const API_BASE_URL = '/api/payments';

export const paymentService = {
  async createPaymentIntent(
    paymentData: CreatePaymentIntentDto
  ): Promise<{ clientSecret: string }> {
    const response = await fetch(`${API_BASE_URL}/intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    return response.json();
  },

  async confirmPayment(confirmData: ConfirmPaymentDto): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to confirm payment');
    }

    return response.json();
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await fetch(`${API_BASE_URL}/methods`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payment methods');
    }

    return response.json();
  },

  async getPaymentHistory(missionId?: string): Promise<Payment[]> {
    const url = missionId ? `${API_BASE_URL}?missionId=${missionId}` : `${API_BASE_URL}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payment history');
    }

    return response.json();
  },

  async requestRefund(paymentId: string, reason: string): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request refund');
    }

    return response.json();
  },
};

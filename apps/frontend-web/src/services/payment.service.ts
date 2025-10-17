import type {
  Payment,
  CreatePaymentRequest,
  ConfirmPaymentRequest,
  SavedPaymentMethod,
  OrderPaymentRequest,
  PaymentFilters,
  PaymentListResponse,
  MTNPaymentResponse,
  PaymentSimulation,
} from '@/types/payment.types';
import { BaseApi } from './api';

class PaymentService extends BaseApi {
  constructor() {
    super();
  }

  // Create payment for e-commerce orders
  async createOrderPayment(paymentData: OrderPaymentRequest): Promise<Payment> {
    const response = await this.post('/client/orders/payment', paymentData);
    return response.data;
  }

  // Create payment for missions
  async createMissionPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    const response = await this.post('/payments/missions', paymentData);
    return response.data;
  }

  // MTN Mobile Money payment simulation (for development)
  async simulateMTNPayment(phoneNumber: string, amount: string): Promise<PaymentSimulation> {
    const response = await this.post('/payments/mtn/simulate', {
      phoneNumber,
      amount,
      currency: 'XOF',
    });
    return response.data;
  }

  // Confirm MTN Mobile Money payment
  async confirmPayment(confirmData: ConfirmPaymentRequest): Promise<Payment> {
    const response = await this.post('/payments/confirm', confirmData);
    return response.data;
  }

  // Check payment status
  async getPaymentStatus(paymentId: string): Promise<Payment> {
    const response = await this.get(`/payments/${paymentId}`);
    return response.data;
  }

  // Get user's saved payment methods
  async getSavedPaymentMethods(): Promise<SavedPaymentMethod[]> {
    const response = await this.get('/client/payment-methods');
    return response.data;
  }

  // Save a new payment method
  async savePaymentMethod(paymentMethod: Partial<SavedPaymentMethod>): Promise<SavedPaymentMethod> {
    const response = await this.post('/client/payment-methods', paymentMethod);
    return response.data;
  }

  // Delete a saved payment method
  async deletePaymentMethod(methodId: string): Promise<void> {
    await this.delete(`/client/payment-methods/${methodId}`);
  }

  // Get payment history with filters
  async getPaymentHistory(filters?: PaymentFilters): Promise<PaymentListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await this.get(`/client/payments?${params.toString()}`);
    return response.data;
  }

  // Get payments for a specific order
  async getOrderPayments(orderId: string): Promise<Payment[]> {
    const response = await this.get(`/client/orders/${orderId}/payments`);
    return response.data;
  }

  // Get payments for a specific mission
  async getMissionPayments(missionId: string): Promise<Payment[]> {
    const response = await this.get(`/payments/missions/${missionId}`);
    return response.data;
  }

  // Request payment refund
  async requestRefund(paymentId: string, reason: string): Promise<Payment> {
    const response = await this.post(`/payments/${paymentId}/refund`, { reason });
    return response.data;
  }

  // Get refund status
  async getRefundStatus(paymentId: string): Promise<Payment> {
    const response = await this.get(`/payments/${paymentId}/refund`);
    return response.data;
  }

  // Webhook handler for payment status updates (admin only)
  async handlePaymentWebhook(webhookData: Record<string, unknown>): Promise<void> {
    await this.post('/admin/payments/webhook', webhookData);
  }

  // Get MTN Mobile Money transaction status
  async getMTNTransactionStatus(transactionId: string): Promise<MTNPaymentResponse> {
    const response = await this.get(`/payments/mtn/status/${transactionId}`);
    return response.data;
  }
}

export const paymentService = new PaymentService();

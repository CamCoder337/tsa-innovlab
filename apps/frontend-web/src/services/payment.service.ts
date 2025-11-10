import type {
  Payment,
  CreatePaymentRequest,
  ConfirmPaymentRequest,
  PaymentSimulation,
  OrderPaymentRequest,
} from '@/types/payment.types';
import { BaseApi } from './api';
import type { ApiResponse } from '@/types/common.types';
import type { AxiosError } from 'axios';
import { PaymentMethod, PaymentStatus } from '@/types/order.types';

class PaymentService extends BaseApi {
  private isAxiosError(
    error: unknown
  ): error is AxiosError<{ message?: string; errors?: unknown[] }> {
    return (error as AxiosError).isAxiosError === true;
  }

  private getErrorMessage(error: AxiosError<{ message?: string; errors?: unknown[] }>): string {
    return error.response?.data?.message || error.message || 'An error occurred';
  }

  private getErrorResponse(error: unknown): {
    success: false;
    status: number;
    message: string;
    errors: string[];
  } {
    if (this.isAxiosError(error)) {
      const errors = error.response?.data?.errors || [];
      const stringErrors = errors.map((err) =>
        typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
      );

      return {
        success: false,
        status: error.response?.status || 500,
        message: this.getErrorMessage(error),
        errors: stringErrors,
      };
    }
    return {
      success: false,
      status: 500,
      message: 'An unexpected error occurred',
      errors: [],
    };
  }

  // Payment Operations
  async initiatePayment(data: CreatePaymentRequest): Promise<ApiResponse<Payment>> {
    try {
      const response = await this.insertToken().post('/api/client/payments/initiate', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getPaymentStatus(id: string): Promise<ApiResponse<Payment>> {
    try {
      const response = await this.insertToken().get(`/api/client/payments/${id}/status`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async confirmPayment(id: string, data: ConfirmPaymentRequest): Promise<ApiResponse<Payment>> {
    try {
      const response = await this.insertToken().post(`/api/client/payments/${id}/confirm`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getOrderPayment(orderId: string): Promise<ApiResponse<Payment>> {
    try {
      const response = await this.insertToken().get(`/api/client/orders/${orderId}/payment`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async createOrderPayment(data: OrderPaymentRequest): Promise<Payment> {
    try {
      const response = await this.insertToken().post('/api/client/orders/payment', data);
      return response.data.data;
    } catch (error) {
      if (this.isAxiosError(error)) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error('Failed to create order payment');
    }
  }

  async getPaymentHistory(params: {
    missionId?: string;
    orderId?: string;
  }): Promise<{ payments: Payment[] }> {
    // Simulate API call with mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockPayments: Payment[] = [
          {
            id: 'pay_1',
            orderId: params.orderId || 'order_1',
            amount: 150000, // Amount in cents (1500 FCFA)
            method: PaymentMethod.ORANGE_MONEY,
            status: PaymentStatus.COMPLETED,
            transactionId: 'TXN_OM_123456',
            phoneNumber: '+237600000000',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:35:00Z',
          },
          {
            id: 'pay_2',
            orderId: params.orderId || 'order_2',
            amount: 75000, // Amount in cents (750 FCFA)
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PENDING,
            transactionId: 'TXN_BT_789012',
            createdAt: '2024-01-10T14:20:00Z',
            updatedAt: '2024-01-10T14:20:00Z',
          },
          {
            id: 'pay_3',
            orderId: params.orderId || 'order_3',
            amount: 200000, // Amount in cents (2000 FCFA)
            method: PaymentMethod.MTN_MOMO,
            status: PaymentStatus.FAILED,
            transactionId: 'TXN_MTN_345678',
            phoneNumber: '+237677000000',
            createdAt: '2024-01-05T09:15:00Z',
            updatedAt: '2024-01-05T09:16:00Z',
          },
        ];

        resolve({ payments: mockPayments });
      }, 1000); // Simulate 1 second delay
    });
  }

  // MTN Mobile Money Payment Simulation
  async simulateMTNPayment(phoneNumber: string, amount: number): Promise<PaymentSimulation> {
    // Simulate API call with processing time
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a random transaction ID
        const transactionId = `MTN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Simulate success/failure based on phone number validation
        const isValidPhone = /^\+237[679]\d{8}$/.test(phoneNumber);
        const hasEnoughBalance = amount <= 1000000; // Simulate balance limit of 10,000 FCFA

        if (!isValidPhone) {
          resolve({
            success: false,
            transactionId: '',
            message: 'Numéro de téléphone MTN invalide. Utilisez le format +237XXXXXXXXX',
            processingTime: 2000,
          });
        } else if (!hasEnoughBalance) {
          resolve({
            success: false,
            transactionId: '',
            message: 'Solde insuffisant sur votre compte MTN Mobile Money',
            processingTime: 3000,
          });
        } else {
          resolve({
            success: true,
            transactionId,
            message: `Simulation réussie pour ${phoneNumber}. Montant: ${amount / 100} FCFA`,
            processingTime: 2500,
          });
        }
      }, 2000); // Simulate 2 second processing delay
    });
  }
}

export const paymentService = new PaymentService();

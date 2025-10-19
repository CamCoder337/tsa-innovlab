// ============================================================================
// SHOP SERVICE
// ============================================================================

import { BaseApi } from './api';
import type { ApiResponse, PaginatedMetaResponse, Paginator } from '@/types/common.types';
import type { CategoryFilterParams, CategoryResponse } from '@/types/category.types';
import type { Product, ProductFilterParams } from '@/types/product.types';
import type { AxiosError } from 'axios';
import type { AddToCartRequest, Cart, CartItem } from '@/types/cart.types';
import type { CreateOrderRequest, Order, OrderFiltersQuery, OrderStats } from '@/types/order.types';

export class ShopService extends BaseApi {
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

  // Product Operations
  async getProducts(params?: ProductFilterParams): Promise<ApiResponse<Paginator<Product>>> {
    try {
      const response = await this.axiosInstance.get('/api/shop/products', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await this.insertToken().get(`/api/shop/products/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getSimilarProducts(
    id: string,
    limit?: number
  ): Promise<ApiResponse<{ products: Product[]; strategy: string; total?: number }>> {
    try {
      const response = await this.insertToken().get(
        `/api/shop/product-recommendations/similar/${id}`,
        { params: { limit } }
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getProductRecommendations(
    limit?: number
  ): Promise<ApiResponse<{ products: Product[]; strategy: string; total: number }>> {
    try {
      const response = await this.insertToken().get('/api/shop/product-recommendations/popular', {
        params: { limit },
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async visualRecognitionSearch(
    limit?: number
  ): Promise<ApiResponse<{ products: Product[]; processing_time_ms: number; total: number }>> {
    try {
      const response = await this.insertToken().get('/api/shop/product-recommendations/popular', {
        params: { limit },
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Category Operations
  async getCategories(params?: CategoryFilterParams): Promise<ApiResponse<CategoryResponse>> {
    try {
      const response = await this.axiosInstance.get('/api/shop/categories', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Cart Operations
  async getCart(): Promise<ApiResponse<Cart>> {
    try {
      const response = await this.insertToken().get('/api/client/cart');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async addCartItem(data: AddToCartRequest): Promise<ApiResponse<CartItem>> {
    try {
      const response = await this.insertToken().post('/api/client/cart/items', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<ApiResponse<CartItem>> {
    try {
      const response = await this.insertToken().put(`/api/client/cart/items/${id}`, { quantity });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async deleteCartItem(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/client/cart/items/${id}`);
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async clearCart(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/client/cart/`);
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Order Operations
  async getOrders(
    params?: OrderFiltersQuery
  ): Promise<ApiResponse<PaginatedMetaResponse<Order, 'orders'>>> {
    try {
      const response = await this.insertToken().get('/api/client/orders', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.insertToken().get(`/api/client/orders/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Record<string, Order>>> {
    try {
      const response = await this.insertToken().post('/api/client/orders', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async cancelOrder(id: string): Promise<ApiResponse<Record<string, Order>>> {
    try {
      const response = await this.insertToken().post(`/api/client/orders/${id}/cancel`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getOrdersStats(): Promise<ApiResponse<OrderStats>> {
    try {
      const response = await this.insertToken().get('/api/client/orders/stats');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const shopService = new ShopService();

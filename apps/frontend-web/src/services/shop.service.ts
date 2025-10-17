// ============================================================================
// SHOP SERVICE
// ============================================================================

import { BaseApi } from './api';
import type { ApiResponse, PaginatedMetaResponse, Paginator } from '@/types/common.types';
import type {
  Category,
  CreateCategory,
  UpdateCategory,
  CategoryFilterParams,
  CategoryWithStats,
  CategoryResponse,
} from '@/types/category.types';
import type {
  Product,
  CreateProduct,
  UpdateProduct,
  ProductFilterParams,
  ProductStats,
} from '@/types/product.types';
import type { AxiosError } from 'axios';
import type { AddToCartRequest, Cart, CartItem } from '@/types/cart.types';
import type { CreateOrderRequest, Order, OrderFiltersQuery } from '@/types/order.types';

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

  async adminGetProducts(
    params?: ProductFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Product, 'products'>>> {
    try {
      const response = await this.insertToken().get('/api/admin/products', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getProduct(id: string): Promise<ApiResponse<Product[]>> {
    try {
      const response = await this.insertToken().get(`/api/shop/products/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminGetProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await this.insertToken().get(`/api/admin/products/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getProductStats(): Promise<ApiResponse<ProductStats>> {
    try {
      const response = await this.insertToken().get(`/api/admin/stats/products`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getAdminProductStats(): Promise<ApiResponse<ProductStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/products/stats');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async createProduct(data: CreateProduct): Promise<ApiResponse<Record<string, Product>>> {
    try {
      const response = await this.insertToken().post('/api/admin/products', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateProduct(
    id: string,
    data: UpdateProduct
  ): Promise<ApiResponse<Record<string, Product>>> {
    try {
      const response = await this.insertToken().put(`/api/admin/products/${id}`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async deleteProduct(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/admin/products/${id}`);
      return { data: response.data };
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

  async adminGetCategories(
    params?: CategoryFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Category, 'categories'>>> {
    try {
      const response = await this.insertToken().get('/api/admin/categories', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getCategory(id: string): Promise<ApiResponse<CategoryWithStats>> {
    try {
      const response = await this.insertToken().get(`/api/admin/categories/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async createCategory(data: CreateCategory): Promise<ApiResponse<Record<string, Category>>> {
    try {
      const response = await this.insertToken().post('/api/admin/categories', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateCategory(
    id: string,
    data: UpdateCategory
  ): Promise<ApiResponse<Record<string, Category>>> {
    try {
      const response = await this.insertToken().put(`/api/admin/categories/${id}`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async deleteCategory(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/admin/categories/${id}`);
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Cart Operations

  async getCart(): Promise<ApiResponse<Cart>> {
    try {
      const response = await this.insertToken().get('/api/shop/cart');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async addCartItem(data: AddToCartRequest): Promise<ApiResponse<CartItem>> {
    try {
      const response = await this.insertToken().post('/api/shop/cart/items', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<ApiResponse<CartItem>> {
    try {
      const response = await this.insertToken().put(`/api/shop/cart/items/${id}`, { quantity });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async deleteCartItem(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/shop/cart/items/${id}`);
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async clearCart(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/shop/cart/`);
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
      const response = await this.insertToken().get('/api/shop/orders', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.insertToken().get(`/api/shop/orders/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Record<string, Order>>> {
    try {
      const response = await this.insertToken().post('/api/shop/orders', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async cancelOrder(id: string): Promise<ApiResponse<Record<string, Order>>> {
    try {
      const response = await this.insertToken().post(`/api/shop/orders/${id}/cancel`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const shopService = new ShopService();

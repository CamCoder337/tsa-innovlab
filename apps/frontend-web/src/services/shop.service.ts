// ============================================================================
// SHOP SERVICE
// ============================================================================

import { BaseApi } from './api';
import type { ApiResponse, PaginatedMetaResponse } from '@/types/common.types';
import type {
  Category,
  CreateCategory,
  UpdateCategory,
  CategoryFilterParams,
  CategoryWithStats,
} from '@/types/category.types';
import type {
  Product,
  CreateProduct,
  UpdateProduct,
  ProductFilterParams,
  ProductStats,
} from '@/types/product.types';
import type { AxiosError } from 'axios';

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
  async getProducts(
    params?: ProductFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Product, 'products'>>> {
    try {
      const response = await this.insertToken().get('/api/shop/products', { params });
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

  async getProduct(id: string): Promise<ApiResponse<Product>> {
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

  async getAdminProductStats(): Promise<
    ApiResponse<{
      stats: {
        products: {
          total: number;
          active: number;
          inactive: number;
          lowStock: number;
          outOfStock: number;
        };
        inventory: {
          totalValue: number;
        };
        topCategories: Array<{
          name: string;
          productCount: number;
        }>;
      };
    }>
  > {
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

  async getCategories(
    params?: CategoryFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Category, 'categories'>>> {
    try {
      const response = await this.insertToken().get('/api/shop/categories', { params });
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
}

export const shopService = new ShopService();

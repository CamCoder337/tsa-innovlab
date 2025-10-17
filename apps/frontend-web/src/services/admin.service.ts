import type {
  CreateProduct,
  Product,
  ProductFilterParams,
  ProductStats,
  UpdateProduct,
} from '@/types/product.types';
import { BaseApi } from './api';
import type { AxiosError } from 'axios';
import type {
  ApiResponse,
  PaginatedKeyResponse,
  PaginatedMetaResponse,
} from '@/types/common.types';
import type {
  Category,
  CategoryFilterParams,
  CategoryWithStats,
  CreateCategory,
  UpdateCategory,
} from '@/types/category.types';
import type {
  Mission,
  MissionFilterParams,
  MissionStats,
  UpdateMissionDto,
} from '@/types/mission.types';
import type { User, UpdateUserRequest } from '@/types/auth.types';
import type { UserFilterParams, UserStats, UserStatusUpdateRequest } from '@/types/user.types';

export class AdminService extends BaseApi {
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

  async adminGetProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await this.insertToken().get(`/api/admin/products/${id}`);
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

  // Mission Operations
  async adminGetMissions(
    params?: MissionFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
    try {
      const response = await this.insertToken().get('/api/admin/missions', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminGetMission(id: string): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().get(`/api/admin/missions/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminUpdateMission(
    id: string,
    data: Partial<UpdateMissionDto>
  ): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().put(`/api/admin/missions/${id}`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminDeleteMission(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      await this.insertToken().delete(`/api/admin/missions/${id}`);
      return { data: { success: true } };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getMissionStats(): Promise<ApiResponse<MissionStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/missions/stats');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // User Operations

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/users/stats');
      return { data: response.data.data.stats };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getUsers(
    params?: UserFilterParams
  ): Promise<ApiResponse<PaginatedKeyResponse<User, 'users'>>> {
    try {
      const response = await this.insertToken().get('/api/admin/users', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getUser(
    id: string
  ): Promise<ApiResponse<{ user: User; stats: Record<string, number | string> }>> {
    try {
      const response = await this.insertToken().get(`/api/admin/users/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateUser(
    id: string,
    data: UpdateUserRequest
  ): Promise<ApiResponse<Record<string, User>>> {
    try {
      const response = await this.insertToken().put(`/api/admin/users/${id}`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async suspendUser(
    id: string,
    data: UserStatusUpdateRequest
  ): Promise<ApiResponse<Record<string, User>>> {
    try {
      const response = await this.insertToken().post(`/api/admin/users/${id}/suspend`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async activateUser(
    id: string,
    data: UserStatusUpdateRequest
  ): Promise<ApiResponse<Record<string, User>>> {
    try {
      const response = await this.insertToken().post(`/api/admin/users/${id}/activate`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<Record<string, User>>> {
    try {
      const response = await this.insertToken().delete(`/api/admin/users/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const adminService = new AdminService();

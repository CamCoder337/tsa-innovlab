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
  PaginationMeta,
} from '@/types/common.types';
import type {
  Category,
  CategoryFilterParams,
  CategoryWithStats,
  CreateCategory,
  UpdateCategory,
} from '@/types/category.types';
import type {
  CreateMissionDto,
  Mission,
  MissionFilterParams,
  MissionStats,
  MissionStatus,
  UpdateMissionStatus,
  MissionFeedback,
  FeedbackFilterParams,
  FeedbackStats,
} from '@/types/mission.types';
import type { User, UpdateUserRequest } from '@/types/auth.types';
import type { UserFilterParams, UserStats, UserStatusUpdateRequest } from '@/types/user.types';
import type {
  OverviewStats,
  AdminMissionStats,
  AdminProductStats,
  UserStats as AdminUserStats,
} from '@/types/admin-stats.types';
import type {
  Order,
  AdminOrderFilterParams,
  AdminOrderStats,
  UpdateOrderStatusRequest,
  RefundOrderRequest,
  BulkOrderActionRequest,
  BulkOrderActionResult,
} from '@/types/order.types';

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

  async adminCreateMission(data: CreateMissionDto): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().post('/api/admin/missions', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminUpdateMissionStatus(
    id: string,
    data: UpdateMissionStatus
  ): Promise<
    ApiResponse<{
      mission: Mission;
      oldStatus: MissionStatus;
      newStatus: MissionStatus;
      commentaire: string;
    }>
  > {
    try {
      const response = await this.insertToken().put(`/api/admin/missions/${id}/status`, data);
      return { data: response.data.data };
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

  // Feedback Operations

  async getFeedbacks(
    params?: FeedbackFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<MissionFeedback, 'feedbacks'>>> {
    try {
      const response = await this.insertToken().get('/api/admin/feedbacks', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getFeedback(id: string): Promise<ApiResponse<MissionFeedback>> {
    try {
      const response = await this.insertToken().get(`/api/admin/feedbacks/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getFeedbackStats(): Promise<ApiResponse<FeedbackStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/feedbacks/stats');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Admin Statistics Operations

  async getOverviewStats(): Promise<ApiResponse<OverviewStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/stats/overview');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getAdminUserStats(): Promise<ApiResponse<AdminUserStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/stats/users');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getAdminMissionStats(): Promise<ApiResponse<AdminMissionStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/stats/missions');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getAdminProductsStats(): Promise<ApiResponse<AdminProductStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/stats/products');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Order Operations

  async adminGetOrders(
    params?: AdminOrderFilterParams
  ): Promise<ApiResponse<{ data: Order[]; meta: PaginationMeta }>> {
    try {
      const response = await this.insertToken().get('/api/admin/orders', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminGetOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.insertToken().get(`/api/admin/orders/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminUpdateOrderStatus(
    id: string,
    data: UpdateOrderStatusRequest
  ): Promise<ApiResponse<Order>> {
    try {
      const response = await this.insertToken().put(`/api/admin/orders/${id}/status`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminCancelOrder(id: string, reason?: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.insertToken().post(`/api/admin/orders/${id}/cancel`, { reason });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminRefundOrder(id: string, data: RefundOrderRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await this.insertToken().post(`/api/admin/orders/${id}/refund`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getAdminOrderStats(): Promise<ApiResponse<AdminOrderStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/orders/stats');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async exportOrders(params?: Partial<AdminOrderFilterParams>): Promise<ApiResponse<Blob>> {
    try {
      const response = await this.insertToken().get('/api/admin/orders/export', {
        params,
        responseType: 'blob',
      });
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async bulkOrderAction(data: BulkOrderActionRequest): Promise<ApiResponse<BulkOrderActionResult>> {
    try {
      const response = await this.insertToken().post('/api/admin/orders/bulk-action', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const adminService = new AdminService();

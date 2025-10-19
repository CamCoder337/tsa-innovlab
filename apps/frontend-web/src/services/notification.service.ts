// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

import { BaseApi } from './api';
import type {
  Notification,
  NotificationFilters,
  NotificationListResponse,
  NotificationApiResponse,
  CreateNotificationRequest,
  NotificationStats,
} from '@/types/notification.types';
import type { ApiResponse } from '@/types/common.types';
import type { AxiosError } from 'axios';

export class NotificationService extends BaseApi {
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

  async getNotifications(
    params: NotificationFilters
  ): Promise<ApiResponse<NotificationListResponse>> {
    try {
      const response = await this.insertToken().get('/api/common/notifications', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getNotificationStats(): Promise<ApiResponse<NotificationStats>> {
    try {
      const response = await this.insertToken().get('/api/common/notifications/stats');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
    try {
      const response = await this.insertToken().put(`/api/common/notifications/${id}/read`);
      return { data: response.data.notification };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async markAllNotificationsRead(): Promise<
    ApiResponse<{ message: string; updatedCount: number }>
  > {
    try {
      const response = await this.insertToken().put('/api/common/notifications/read-all');
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async deleteNotification(
    id: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/common/notifications/${id}`);
      return { data: { success: true, message: response.data.message } };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async createNotification(data: CreateNotificationRequest): Promise<ApiResponse<Notification>> {
    try {
      const response = await this.insertToken().post<NotificationApiResponse>(
        '/api/common/notifications',
        data
      );
      return { data: response.data.notification };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getNotification(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const response = await this.insertToken().get<NotificationApiResponse>(
        `/api/common/notifications/${notificationId}`
      );
      return { data: response.data.notification };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    try {
      const response = await this.insertToken().get<{ unreadCount: number }>(
        '/api/common/notifications/unread-count'
      );
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async sendTestNotification(): Promise<ApiResponse<Notification>> {
    try {
      const response = await this.insertToken().post<NotificationApiResponse>(
        '/api/common/notifications/test'
      );
      return { data: response.data.notification };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async deleteMultipleNotifications(
    notificationIds: string[]
  ): Promise<ApiResponse<{ deletedCount: number; message: string }>> {
    try {
      const response = await this.insertToken().delete<{ deletedCount: number; message: string }>(
        '/api/common/notifications/bulk-delete',
        {
          data: { notificationIds },
        }
      );
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const notificationService = new NotificationService();

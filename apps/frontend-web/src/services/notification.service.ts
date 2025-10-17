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
  /**
   * Get user's notifications with optional filters
   */
  async getNotifications(
    filters: NotificationFilters = {}
  ): Promise<ApiResponse<NotificationListResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.read !== undefined) params.append('read', filters.read.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString
        ? `/api/common/notifications?${queryString}`
        : '/api/common/notifications';

      const response = await this.insertToken().get(url);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<ApiResponse<NotificationStats>> {
    try {
      const response = await this.insertToken().get('/api/common/notifications/stats');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const response = await this.insertToken().patch<NotificationApiResponse>(
        `/api/common/notifications/${notificationId}/read`
      );
      return { data: response.data.notification };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<
    ApiResponse<{ message: string; updatedCount: number }>
  > {
    try {
      const response = await this.insertToken().patch<{ message: string; updatedCount: number }>(
        '/api/common/notifications/mark-all-read'
      );
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete<{ message: string }>(
        `/api/common/notifications/${notificationId}`
      );
      return { data: { success: true, message: response.data.message } };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Create a new notification (admin only)
   */
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

  /**
   * Get a specific notification by ID
   */
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

  /**
   * Get unread notifications count
   */
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

  /**
   * Send a test notification (for development/testing)
   */
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

  /**
   * Delete multiple notifications
   */
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

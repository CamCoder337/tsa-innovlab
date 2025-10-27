import React from 'react';
import type { Renderable } from 'react-hot-toast';
import type { PaginationMeta } from './common.types';

export enum NotificationType {
  MISSION_ASSIGNED = 'mission_assigned',
  MISSION_STATUS_CHANGED = 'mission_status_changed',
  MISSION_NEW = 'mission_new',
  NEW_MESSAGE = 'new_message',
  SYSTEM = 'system',
  PAYMENT_RECEIVED = 'payment_received',
  MISSION_COMPLETED = 'mission_completed',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Notification data types for different notification types
export interface MissionNotificationData {
  missionId: string;
  missionTitle?: string;
  status?: string;
  affreteurId?: string;
  transporteurId?: string;
}

export interface MessageNotificationData {
  messageId: string;
  senderId: string;
  senderName?: string;
  conversationId?: string;
}

export interface PaymentNotificationData {
  paymentId: string;
  amount: string;
  currency?: string;
  missionId?: string;
}

export interface SystemNotificationData {
  level?: 'info' | 'warning' | 'error';
  action?: string;
  url?: string;
}

// Union type for all possible notification data
export type NotificationData =
  | MissionNotificationData
  | MessageNotificationData
  | PaymentNotificationData
  | SystemNotificationData
  | Record<string, string | number | boolean | null>;

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: NotificationData;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  filter?: 'all' | 'unread' | 'read' | 'urgent';
  page?: number;
  limit?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byType: Record<NotificationType, number>;
}

// WebSocket notification events
export interface NotificationEventData {
  notification: Notification;
}

// UI-specific types
export interface NotificationListItem extends Notification {
  timeAgo?: string;
  isNew?: boolean;
}

export interface ToastNotificationOptions {
  duration?: number;
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  style?: React.CSSProperties;
  className?: string;
  icon?: Renderable;
  dismissible?: boolean;
  onClick?: () => void;
}

// API DTOs
export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: NotificationData;
}

export interface MarkNotificationReadRequest {
  notificationId: string;
}

export interface NotificationApiResponse {
  notification: Notification;
}

export interface NotificationListResponse {
  notifications: {
    meta: PaginationMeta;
    data: Notification[];
  };
  stats: {
    unread: number;
    urgent: number;
  };
}

export interface NotificationStatsResponse {
  data: NotificationStats;
}

export interface NotificationStore {
  // State
  notifications: NotificationListItem[];
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchNotificationStats: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  sendTestNotification: () => Promise<void>;

  // Real-time event handlers
  handleNewNotification: (data: NotificationEventData) => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // WebSocket subscription management
  initializeWebSocketSubscriptions: () => void;
  cleanupWebSocketSubscriptions: () => void;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationService } from '@/services/notification.service';
import { webSocketService } from '@/services/websocket.service';
import type { NotificationEventData, NotificationStore } from '@/types/notification.types';

const initialState = {
  notifications: [],
  stats: null,
  isLoading: false,
  error: null,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      fetchNotifications: async (filters = {}) => {
        try {
          set({ isLoading: true, error: null });

          const response = await notificationService.getNotifications(filters);
          if (response.data) {
            const notifications = response.data.notifications?.data?.map((notification) => ({
              ...notification,
              isNew: false, // Will be set to true for real-time notifications
            }));

            set({
              notifications,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch notifications',
            isLoading: false,
          });
        }
      },

      fetchNotificationStats: async () => {
        try {
          const response = await notificationService.getNotificationStats();
          if (response.data) {
            set({ stats: response.data });
          }
        } catch (error) {
          console.error('Failed to fetch notification stats:', error);
        }
      },

      markNotificationRead: async (notificationId: string) => {
        try {
          // Optimistic update
          set((state) => ({
            notifications: state.notifications.map((notification) =>
              notification.id === notificationId
                ? { ...notification, readAt: new Date().toISOString() }
                : notification
            ),
          }));

          await notificationService.markNotificationRead(notificationId);

          // Update stats
          get().fetchNotificationStats();
        } catch (error) {
          console.error('Failed to mark notification as read:', error);

          // Revert optimistic update
          set((state) => ({
            notifications: state.notifications.map((notification) =>
              notification.id === notificationId
                ? { ...notification, readAt: undefined }
                : notification
            ),
            error: error instanceof Error ? error.message : 'Failed to mark notification as read',
          }));
        }
      },

      markAllNotificationsRead: async () => {
        try {
          // Optimistic update
          const now = new Date().toISOString();
          set((state) => ({
            notifications: state.notifications.map((notification) => ({
              ...notification,
              readAt: notification.readAt || now,
            })),
          }));

          await notificationService.markAllNotificationsRead();

          // Update stats
          get().fetchNotificationStats();
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to mark all notifications as read',
          });

          // Refresh notifications to revert optimistic update
          get().fetchNotifications();
        }
      },

      deleteNotification: async (notificationId: string) => {
        try {
          // Optimistic update
          set((state) => ({
            notifications: state.notifications.filter(
              (notification) => notification.id !== notificationId
            ),
          }));

          await notificationService.deleteNotification(notificationId);

          // Update stats
          get().fetchNotificationStats();
        } catch (error) {
          console.error('Failed to delete notification:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete notification',
          });

          // Refresh notifications to revert optimistic update
          get().fetchNotifications();
        }
      },

      sendTestNotification: async () => {
        try {
          await notificationService.sendTestNotification();
        } catch (error) {
          console.error('Failed to send test notification:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to send test notification',
          });
        }
      },

      // Real-time event handlers
      handleNewNotification: (data: NotificationEventData) => {
        const { notification } = data;

        set((state) => ({
          notifications: [{ ...notification, isNew: true }, ...state.notifications],
        }));

        // Update stats
        get().fetchNotificationStats();
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),

      // WebSocket subscription management
      initializeWebSocketSubscriptions: () => {
        const { handleNewNotification } = get();

        // Subscribe to notification events

        webSocketService.connect();
        webSocketService.subscribe('notification', handleNewNotification);
      },

      cleanupWebSocketSubscriptions: () => {
        const { handleNewNotification } = get();

        // Unsubscribe from notification events
        webSocketService.unsubscribe('notification', handleNewNotification);
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        // Only persist notifications and stats, not loading/error states
        notifications: state.notifications,
        stats: state.stats,
      }),
    }
  )
);

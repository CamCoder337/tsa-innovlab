import { useNotificationStore } from '@/stores/notificationStore';

/**
 * Main notifications hook providing all notification functionality
 */
export const useNotifications = () => {
  const store = useNotificationStore();

  return {
    // State
    notifications: store.notifications,
    stats: store.stats,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    fetchNotifications: store.fetchNotifications,
    fetchNotificationStats: store.fetchNotificationStats,
    markNotificationRead: store.markNotificationRead,
    markAllNotificationsRead: store.markAllNotificationsRead,
    deleteNotification: store.deleteNotification,
    sendTestNotification: store.sendTestNotification,

    // Real-time handlers
    handleNewNotification: store.handleNewNotification,

    // Utility
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    reset: store.reset,

    // WebSocket management
    initializeWebSocketSubscriptions: store.initializeWebSocketSubscriptions,
    cleanupWebSocketSubscriptions: store.cleanupWebSocketSubscriptions,
  };
};

/**
 * Hook for notification loading state
 */
export const useNotificationLoading = () => {
  return useNotificationStore((state) => state.isLoading);
};

/**
 * Hook for notification error state
 */
export const useNotificationError = () => {
  return useNotificationStore((state) => state.error);
};

/**
 * Hook for notification list
 */
export const useNotificationList = () => {
  return useNotificationStore((state) => state.notifications);
};

/**
 * Hook for notification statistics
 */
export const useNotificationStats = () => {
  return useNotificationStore((state) => state.stats);
};

/**
 * Hook for unread notification count
 */
export const useUnreadNotificationCount = () => {
  return useNotificationStore((state) => state.stats?.unread || 0);
};

/**
 * Hook for notification actions
 */
export const useNotificationActions = () => {
  const store = useNotificationStore();

  return {
    fetchNotifications: store.fetchNotifications,
    fetchNotificationStats: store.fetchNotificationStats,
    markNotificationRead: store.markNotificationRead,
    markAllNotificationsRead: store.markAllNotificationsRead,
    deleteNotification: store.deleteNotification,
    sendTestNotification: store.sendTestNotification,
    clearError: store.clearError,
  };
};

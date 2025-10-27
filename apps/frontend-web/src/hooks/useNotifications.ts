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

import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { toastNotificationService } from '@/services/toast-notification.service';
import { webSocketService } from '@/services/websocket.service';
import type { NotificationEventData } from '@/types/notification.types';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const { handleNewNotification } = useNotifications();

  useEffect(() => {
    if (isAuthenticated && user && token) {
      // Initialize WebSocket connection with JWT token
      webSocketService.initialize(token);

      // Set up enhanced notification event handler with toast integration
      // Backend sends: { type: 'notification:new', data: {...notification...}, timestamp }
      // WebSocket service extracts 'data' and passes it directly to this handler
      const enhancedNotificationHandler = (notificationData: unknown) => {
        // notificationData is already the notification object from backend
        const notification = notificationData as NotificationEventData['notification'];

        // Validate notification
        if (!notification || !notification.title) {
          console.error('❌ Invalid notification received:', notificationData);
          return;
        }

        // Wrap in expected format for store
        const eventData: NotificationEventData = { notification };

        // Handle the notification in the store first
        handleNewNotification(eventData);

        // Show toast notification (navigation is handled inside toast components)
        toastNotificationService.showNotification(notification);
      };

      // Subscribe to WebSocket notification events with our enhanced handler
      // Backend sends notifications with type 'notification:new'
      webSocketService.subscribe('notification:new', enhancedNotificationHandler);

      return () => {
        // Cleanup: unsubscribe from WebSocket events
        // Note: We don't disconnect the WebSocket here because it's shared
        // across the app and other components might be using it
        webSocketService.unsubscribe('notification:new', enhancedNotificationHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, token]);

  return (
    <>
      {children}
      <Toaster position="top-right" expand={false} richColors closeButton duration={4000} />
    </>
  );
};

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { toastNotificationService } from '@/services/toast-notification.service';
import { webSocketService } from '@/services/websocket.service';
import type {
  MessageNotificationData,
  MissionNotificationData,
  NotificationEventData,
  PaymentNotificationData,
} from '@/types/notification.types';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const { handleNewNotification } =
    useNotifications();

  useEffect(() => {
    if (isAuthenticated && user && token) {
      // Initialize WebSocket connection with JWT token
      webSocketService.initialize(token);

      // Set up enhanced notification event handler with toast integration
      // Backend sends: { type: 'notification:new', data: {...notification...}, timestamp }
      const enhancedNotificationHandler = (notificationData: unknown) => {
        // Extract notification from WebSocket message data
        const notification = notificationData as NotificationEventData['notification'];

        // Wrap in expected format for store
        const eventData: NotificationEventData = { notification };

        // Handle the notification in the store first
        handleNewNotification(eventData);

        // Show toast notification with soft aggressiveness based on priority
        toastNotificationService.showNotification(notification, {
          onClick: () => {
            // Navigate to relevant page based on notification type
            const { type, data } = notification;
            const missionData = data as MissionNotificationData;
            const paymentData = data as PaymentNotificationData;
            const messageData = data as MessageNotificationData;

            switch (type) {
              case 'mission_assigned':
              case 'mission_status_changed':
              case 'mission_completed':
                if (missionData) {
                  window.location.href = `/missions/${missionData.missionId}`;
                }
                break;
              case 'new_message':
                if (messageData) {
                  window.location.href = `/chat?conversation=${messageData.conversationId}`;
                }
                break;
              case 'payment_received':
                if (paymentData) {
                  window.location.href = `/orders/${paymentData.paymentId}`;
                }
                break;
              default:
                // For system notifications, open notification center
                break;
            }
          },
        });
      };

      // Subscribe to WebSocket notification events with our enhanced handler
      // Backend sends notifications with type 'notification:new'
      webSocketService.subscribe('notification:new', enhancedNotificationHandler);

      return () => {
        // Cleanup: unsubscribe from WebSocket events
        webSocketService.unsubscribe('notification:new', enhancedNotificationHandler);
        webSocketService.disconnect();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, token]);

  return (
    <>
      {children}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Global toast options
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            maxWidth: '400px',
          },
          // Success toast styling
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          // Error toast styling
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          // Loading toast styling
          loading: {
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
};

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
  const { user, isAuthenticated } = useAuth();
  const { initializeWebSocketSubscriptions, cleanupWebSocketSubscriptions, handleNewNotification } =
    useNotifications();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize WebSocket subscriptions for real-time notifications
      initializeWebSocketSubscriptions();

      // Set up enhanced notification event handler with toast integration
      const enhancedNotificationHandler = (data: NotificationEventData) => {
        // Handle the notification in the store first
        handleNewNotification(data);

        // Show toast notification with soft aggressiveness based on priority
        toastNotificationService.showNotification(data.notification, {
          onClick: () => {
            // Navigate to relevant page based on notification type
            const { type, data: notificationData } = data.notification;
            const missionData = notificationData as MissionNotificationData;
            const paymentData = notificationData as PaymentNotificationData;
            const messageData = notificationData as MessageNotificationData;

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
      webSocketService.subscribe('notification', enhancedNotificationHandler);

      return () => {
        // Cleanup: unsubscribe from WebSocket events and cleanup store subscriptions
        webSocketService.unsubscribe('notification', enhancedNotificationHandler);
        cleanupWebSocketSubscriptions();
      };
    }
  }, [
    isAuthenticated,
    user,
    initializeWebSocketSubscriptions,
    cleanupWebSocketSubscriptions,
    handleNewNotification,
  ]);

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

import toast from 'react-hot-toast';
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  MessageSquare,
  Truck,
  CreditCard,
} from 'lucide-react';
import type {
  Notification,
  ToastNotificationOptions,
  MissionNotificationData,
  PaymentNotificationData,
} from '@/types/notification.types';

class ToastNotificationService {
  /**
   * Show a toast notification with soft aggressiveness based on priority
   */
  showNotification(notification: Notification, options: ToastNotificationOptions = {}) {
    const config = this.getNotificationConfig(notification);
    const mergedOptions = { ...config, ...options };

    // Create toast based on priority
    switch (notification.priority) {
      case 'urgent':
        return toast.error(notification.message, {
          ...mergedOptions,
          duration: mergedOptions.duration || 8000, // 8 seconds for urgent
          icon: mergedOptions.icon || <AlertCircle className="h-5 w-5" />,
        });

      case 'high':
        return toast(notification.message, {
          ...mergedOptions,
          duration: mergedOptions.duration || 6000, // 6 seconds for high
          icon: mergedOptions.icon || <Bell className="h-5 w-5" />,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B',
            ...mergedOptions.style,
          },
        });

      case 'medium':
        return toast(notification.message, {
          ...mergedOptions,
          duration: mergedOptions.duration || 4000, // 4 seconds for medium
          icon: mergedOptions.icon || <Info className="h-5 w-5" />,
          style: {
            background: '#DBEAFE',
            color: '#1E40AF',
            border: '1px solid #3B82F6',
            ...mergedOptions.style,
          },
        });

      case 'low':
      default:
        return toast(notification.message, {
          ...mergedOptions,
          duration: mergedOptions.duration || 3000, // 3 seconds for low
          icon: mergedOptions.icon || <CheckCircle className="h-4 w-4" />,
          style: {
            background: '#F0FDF4',
            color: '#166534',
            border: '1px solid #22C55E',
            ...mergedOptions.style,
          },
        });
    }
  }

  /**
   * Get notification configuration based on type and priority
   */
  private getNotificationConfig(notification: Notification): ToastNotificationOptions {
    const baseConfig: ToastNotificationOptions = {
      position: 'top-right',
      dismissible: true,
    };

    // Type-specific configurations
    switch (notification.type) {
      case 'mission_assigned':
        return {
          ...baseConfig,
          icon: <Truck className="h-5 w-5 text-blue-600" />,
          onClick: () => this.handleMissionClick(notification),
        };

      case 'mission_status_changed':
        return {
          ...baseConfig,
          icon: <Truck className="h-5 w-5 text-orange-600" />,
          onClick: () => this.handleMissionClick(notification),
        };

      case 'new_message':
        return {
          ...baseConfig,
          icon: <MessageSquare className="h-5 w-5 text-green-600" />,
          onClick: () => this.handleMessageClick(notification),
        };

      case 'payment_received':
        return {
          ...baseConfig,
          icon: <CreditCard className="h-5 w-5 text-emerald-600" />,
          onClick: () => this.handlePaymentClick(notification),
        };

      case 'mission_completed':
        return {
          ...baseConfig,
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          onClick: () => this.handleMissionClick(notification),
        };

      case 'system':
      default:
        return {
          ...baseConfig,
          icon: <Bell className="h-5 w-5 text-gray-600" />,
        };
    }
  }

  /**
   * Handle mission-related notification clicks
   */
  private handleMissionClick(notification: Notification) {
    // Type guard to ensure we have mission notification data
    const data = notification.data as MissionNotificationData | PaymentNotificationData;
    const missionId = 'missionId' in data ? data.missionId : undefined;
    if (missionId) {
      // Navigate to mission details - using history API for SPA navigation
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState(null, '', `/missions/${missionId}`);
        // Dispatch a custom event to trigger route change in React Router
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }

  /**
   * Handle message notification clicks
   */
  private handleMessageClick(notification: Notification) {
    const data = notification.data as MissionNotificationData | PaymentNotificationData;
    const conversationId = 'conversationId' in data ? data.conversationId : undefined;
    if (conversationId) {
      // Navigate to chat or open chat sidebar
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState(null, '', `/chat?conversation=${conversationId}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }

  /**
   * Handle payment notification clicks
   */
  private handlePaymentClick(notification: Notification) {
    const data = notification.data as MissionNotificationData | PaymentNotificationData;
    const orderId = 'orderId' in data ? data.orderId : undefined;
    if (orderId) {
      // Navigate to order details
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState(null, '', `/orders/${orderId}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }

  /**
   * Show a success toast
   */
  showSuccess(message: string, options: ToastNotificationOptions = {}) {
    return toast.success(message, {
      duration: 3000,
      position: 'top-right',
      icon: <CheckCircle className="h-5 w-5" />,
      ...options,
    });
  }

  /**
   * Show an error toast
   */
  showError(message: string, options: ToastNotificationOptions = {}) {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      icon: <AlertCircle className="h-5 w-5" />,
      ...options,
    });
  }

  /**
   * Show an info toast
   */
  showInfo(message: string, options: ToastNotificationOptions = {}) {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: <Info className="h-5 w-5" />,
      style: {
        background: '#DBEAFE',
        color: '#1E40AF',
        border: '1px solid #3B82F6',
      },
      ...options,
    });
  }

  /**
   * Show a warning toast
   */
  showWarning(message: string, options: ToastNotificationOptions = {}) {
    return toast(message, {
      duration: 5000,
      position: 'top-right',
      icon: <AlertCircle className="h-5 w-5" />,
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B',
      },
      ...options,
    });
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(toastId: string) {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    toast.dismiss();
  }

  /**
   * Show a loading toast
   */
  showLoading(message: string, options: ToastNotificationOptions = {}) {
    return toast.loading(message, {
      position: 'top-right',
      ...options,
    });
  }

  /**
   * Update an existing toast (useful for loading states)
   */
  updateToast(toastId: string, message: string, type: 'success' | 'error' | 'loading' = 'success') {
    if (type === 'success') {
      toast.success(message, { id: toastId });
    } else if (type === 'error') {
      toast.error(message, { id: toastId });
    } else {
      toast.loading(message, { id: toastId });
    }
  }
}

export const toastNotificationService = new ToastNotificationService();

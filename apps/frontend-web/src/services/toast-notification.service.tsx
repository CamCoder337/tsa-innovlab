import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { Notification, ToastNotificationOptions } from '@/types/notification.types';
import { MissionToastContent } from '@/components/notifications/toast/MissionToastContent';
import { MessageToastContent } from '@/components/notifications/toast/MessageToastContent';
import { GenericToastContent } from '@/components/notifications/toast/GenericToastContent';

class ToastNotificationService {
  /**
   * Show a rich notification toast based on a notification type
   */
  showNotification(notification: Notification, options: ToastNotificationOptions = {}) {
    try {
      // Validate notification object - must have at least title
      if (!notification || !notification.title) {
        console.error('Invalid notification object:', notification);
        return;
      }

      // Ensure message exists (use description as fallback)
      if (!notification.message && (notification as any).description) {
        notification.message = (notification as any).description;
      }

      const duration = this.getDurationByPriority(notification.priority);
      const toastOptions = {
        duration,
        ...options,
      };

      // Route to appropriate toast component based on notification type
      switch (notification.type) {
        case 'mission_assigned':
        case 'mission_status_changed':
        case 'mission_completed':
        case 'mission_new':
          return toast.custom(
            (t) => (
              <MissionToastContent notification={notification} onClose={() => toast.dismiss(t)} />
            ),
            toastOptions
          );

        case 'new_message':
          return toast.custom(
            (t) => (
              <MessageToastContent notification={notification} onClose={() => toast.dismiss(t)} />
            ),
            toastOptions
          );

        case 'payment_received':
        case 'system':
        default:
          return toast.custom(
            (t) => (
              <GenericToastContent notification={notification} onClose={() => toast.dismiss(t)} />
            ),
            toastOptions
          );
      }
    } catch (error) {
      console.error('Error showing notification toast:', error);
      // Fallback to simple toast
      toast.error(notification?.message || 'Notification reçue', { duration: 3000 });
    }
  }

  /**
   * Get toast duration based on priority
   */
  private getDurationByPriority(priority: string): number {
    switch (priority) {
      case 'urgent':
        return 8000; // 8 seconds
      case 'high':
        return 6000; // 6 seconds
      case 'medium':
        return 4000; // 4 seconds
      case 'low':
      default:
        return 3000; // 3 seconds
    }
  }

  /**
   * Show a success toast (simple)
   */
  showSuccess(message: string, options: ToastNotificationOptions = {}) {
    return toast.success(message, {
      duration: 3000,
      icon: <CheckCircle className="h-5 w-5" />,
      ...options,
    });
  }

  /**
   * Show an error toast (simple)
   */
  showError(message: string, options: ToastNotificationOptions = {}) {
    return toast.error(message, {
      duration: 5000,
      icon: <AlertCircle className="h-5 w-5" />,
      ...options,
    });
  }

  /**
   * Show an info toast (simple)
   */
  showInfo(message: string, options: ToastNotificationOptions = {}) {
    return toast.info(message, {
      duration: 4000,
      icon: <Info className="h-5 w-5" />,
      ...options,
    });
  }

  /**
   * Show a warning toast (simple)
   */
  showWarning(message: string, options: ToastNotificationOptions = {}) {
    return toast.warning(message, {
      duration: 5000,
      icon: <AlertCircle className="h-5 w-5" />,
      ...options,
    });
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(toastId: string | number) {
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
      ...options,
    });
  }

  /**
   * Update an existing toast (useful for loading states)
   */
  updateToast(
    toastId: string | number,
    message: string,
    type: 'success' | 'error' | 'loading' = 'success'
  ) {
    if (type === 'success') {
      toast.success(message, { id: toastId });
    } else if (type === 'error') {
      toast.error(message, { id: toastId });
    } else {
      toast.loading(message, { id: toastId });
    }
  }

  /**
   * Show a promise toast (for async operations)
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) {
    return toast.promise(promise, messages);
  }
}

export const toastNotificationService = new ToastNotificationService();

import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { toastNotificationService } from '@/services/toast-notification.service';
import { useNotificationsTranslation } from '@/hooks/useTranslation';
import type { NotificationPriority, NotificationType } from '@/types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { t } = useNotificationsTranslation();
  const {
    notifications,
    stats,
    isLoading,
    error,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearError,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = stats?.unread || 0;
  const filteredNotifications =
    filter === 'unread' ? notifications?.filter((n) => !n.readAt) : notifications;

  const handleNotificationClick = async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.readAt) {
      await markNotificationRead(notificationId);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toastNotificationService.showSuccess(t('markAllRead.success'));
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      toastNotificationService.showError(t('markAllRead.error'));
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      toastNotificationService.showSuccess(t('delete.success'));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toastNotificationService.showError(t('delete.error'));
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: NotificationPriority) => {
    return t(`priority.${priority}`);
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'mission_assigned':
      case 'mission_status_changed':
      case 'mission_completed':
        return '🚛';
      case 'new_message':
        return '💬';
      case 'payment_received':
        return '💳';
      case 'system':
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <DropdownMenuLabel className="text-base font-semibold">{t('title')}</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              {filter === 'all' ? t('filter.all') : t('filter.unread')}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
                <CheckCheck className="h-3 w-3 mr-1" />
                {t('markAllRead.button')}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto">
          {error && (
            <div className="p-3 text-center">
              <div className="text-red-500 text-sm mb-2">{error}</div>
              <Button variant="outline" size="sm" onClick={clearError}>
                {t('retry')}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              {t('loading')}
            </div>
          ) : filteredNotifications?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{filter === 'unread' ? t('empty.unread') : t('empty.all')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications?.map((notification) => {
                const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: fr,
                });

                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.readAt ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon and Priority Indicator */}
                      <div className="relative">
                        <div className="text-lg">{getTypeIcon(notification.type)}</div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(notification.priority)}`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4
                            className={`text-sm font-medium truncate ${
                              !notification.readAt ? 'text-gray-900' : 'text-gray-600'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">{timeAgo}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        <p
                          className={`text-xs break-words ${
                            !notification.readAt ? 'text-gray-700' : 'text-gray-500'
                          }`}
                        >
                          {notification.message || 'Pas de message'}
                        </p>

                        {/* Read status indicator */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                notification.priority === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : notification.priority === 'high'
                                    ? 'bg-orange-100 text-orange-700'
                                    : notification.priority === 'medium'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {getPriorityLabel(notification.priority)}
                            </span>
                          </div>
                          {!notification.readAt && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications?.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-center text-tsa-blue hover:text-blue-700"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/notifications';
                }}
              >
                {t('viewAll')}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

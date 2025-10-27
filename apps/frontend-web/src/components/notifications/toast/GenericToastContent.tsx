import { Bell, AlertCircle, CheckCircle, Info, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Notification } from '@/types/notification.types';

interface GenericToastContentProps {
  notification: Notification;
  onClose?: () => void;
}

export function GenericToastContent({ notification }: GenericToastContentProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'payment_received':
        return <CreditCard className="h-5 w-5 text-emerald-600" />;
      case 'system':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = () => {
    switch (notification.priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 p-4 rounded-lg shadow-lg border min-w-[320px] max-w-[420px] ${getBackgroundColor()}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/80 rounded-full">{getIcon()}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-gray-900">{notification.title}</h4>
              {notification.priority !== 'low' && getPriorityIcon()}
            </div>
          </div>
        </div>
        <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
          {notification.priority}
        </Badge>
      </div>

      {/* Message */}
      {notification.message && (
        <div className="pl-13">
          <p className="text-sm text-gray-700">{notification.message}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
        <span className="text-xs text-gray-500">
          {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <span className="text-xs text-gray-400 capitalize">
          {notification.type?.replace(/_/g, ' ') || 'notification'}
        </span>
      </div>
    </div>
  );
}

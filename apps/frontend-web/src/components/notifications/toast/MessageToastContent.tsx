import { MessageSquare, Reply } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Notification, MessageNotificationData } from '@/types/notification.types';

interface MessageToastContentProps {
  notification: Notification;
  onClose?: () => void;
}

export function MessageToastContent({ notification, onClose }: MessageToastContentProps) {
  const data = notification.data as MessageNotificationData;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleReply = () => {
    if (data?.conversationId) {
      window.location.href = `/app/chat?conversation=${data.conversationId}`;
    }
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[350px] max-w-[450px]">
      {/* Header avec avatar */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-green-100 text-green-700">
            {getInitials(data?.senderName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold text-sm text-gray-900">{notification.title}</h4>
          </div>
          {data?.senderName && (
            <p className="text-xs text-gray-500 mt-0.5">De: {data.senderName}</p>
          )}
        </div>
      </div>

      {/* Aperçu du message */}
      {notification.message && (
        <div className="pl-13">
          <p className="text-sm text-gray-700 line-clamp-3 bg-gray-50 rounded-md p-3 border-l-2 border-green-500">
            {notification.message}
          </p>
        </div>
      )}

      {/* Action button */}
      {data?.conversationId && (
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button size="sm" variant="outline" onClick={handleReply} className="text-xs">
            <Reply className="h-3 w-3 mr-1" />
            Répondre
          </Button>
        </div>
      )}
    </div>
  );
}

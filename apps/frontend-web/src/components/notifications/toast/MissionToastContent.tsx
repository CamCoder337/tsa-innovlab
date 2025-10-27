import { MapPin, Package, Wallet, Truck, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Notification, MissionNotificationData } from '@/types/notification.types';

interface MissionToastContentProps {
  notification: Notification;
  onClose?: () => void;
}

export function MissionToastContent({ notification, onClose }: MissionToastContentProps) {
  const data = notification.data as MissionNotificationData;

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

  const handleViewMission = () => {
    if (data?.missionId) {
      window.location.href = `/app/missions/${data.missionId}`;
    }
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[350px] max-w-[450px]">
      {/* Header avec badge priorité */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-900">{notification.title}</h4>
            {notification.message && (
              <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
            )}
          </div>
        </div>
        <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
          {notification.priority}
        </Badge>
      </div>

      {/* Détails de la mission */}
      {data && (
        <div className="space-y-2 pl-11">
          {/* Trajet */}
          {data.missionTitle && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700 font-medium">{data.missionTitle}</span>
            </div>
          )}

          {/* Statut */}
          {data.status && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                Statut: <span className="font-medium capitalize">{data.status}</span>
              </span>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {data.affreteurId && <span>Affreteur: {data.affreteurId.slice(0, 8)}...</span>}
            {data.transporteurId && data.affreteurId && <ArrowRight className="h-3 w-3" />}
            {data.transporteurId && <span>Transporteur: {data.transporteurId.slice(0, 8)}...</span>}
          </div>
        </div>
      )}

      {/* Action button */}
      {data?.missionId && (
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button size="sm" onClick={handleViewMission} className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            Voir la mission
          </Button>
        </div>
      )}
    </div>
  );
}

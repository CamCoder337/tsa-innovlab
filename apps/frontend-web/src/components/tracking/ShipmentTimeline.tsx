'use client';

import type { ShipmentDetails, TrackingPoint } from '@/types/tracking.types';
import { MapPin, Package, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_ICONS = {
  in_transit: <Loader2 className="w-4 h-4 animate-spin" />,
  delivered: <CheckCircle className="w-4 h-4 text-green-500" />,
  exception: <AlertCircle className="w-4 h-4 text-red-500" />,
  default: <Package className="w-4 h-4 text-gray-400" />,
};

const getStatusIcon = (status: string) => {
  return STATUS_ICONS[status as keyof typeof STATUS_ICONS] || STATUS_ICONS.default;
};

interface ShipmentTimelineProps {
  shipment: ShipmentDetails;
  className?: string;
  maxItems?: number;
}

export function ShipmentTimeline({ shipment, className, maxItems = 10 }: ShipmentTimelineProps) {
  // Sort history by timestamp in descending order (newest first)
  const sortedHistory = [...shipment.history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Get the most recent items
  const recentHistory = maxItems ? sortedHistory.slice(0, maxItems) : sortedHistory;

  // Group events by date
  const eventsByDate: Record<string, TrackingPoint[]> = {};

  recentHistory.forEach((event) => {
    const date = new Date(event.timestamp).toLocaleDateString();
    if (!eventsByDate[date]) {
      eventsByDate[date] = [];
    }
    eventsByDate[date].push(event);
  });

  if (shipment.history.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm p-6', className)}>
        <h3 className="font-medium text-gray-800 mb-4">Historique du colis</h3>
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Aucun historique disponible pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm p-6', className)}>
      <h3 className="font-medium text-gray-800 mb-4">Dernières mises à jour</h3>

      <div className="space-y-6">
        {Object.entries(eventsByDate).map(([date, events]) => (
          <div key={date} className="relative">
            {/* Date header */}
            <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-500">
                {new Date(date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>

            {/* Timeline items */}
            <div className="mt-2 space-y-4">
              {events.map((event, index) => {
                const eventDate = new Date(event.timestamp);
                const timeString = eventDate.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={`${date}-${index}`}
                    className="relative pl-6 pb-4 border-l-2 border-gray-200"
                  >
                    {/* Timeline dot */}
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 mt-1.5" />

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getStatusIcon(event.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {event.eventDescription || 'Mise à jour du colis'}
                          </h4>
                          <time className="text-xs text-gray-500 whitespace-nowrap">
                            {timeString}
                          </time>
                        </div>

                        {event.address && (
                          <div className="mt-1 flex items-start text-sm text-gray-600">
                            <MapPin className="flex-shrink-0 w-3.5 h-3.5 mt-0.5 mr-1.5 text-gray-400" />
                            <span>{event.address}</span>
                          </div>
                        )}

                        {event.speed !== undefined && (
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <span>Vitesse: {Math.round(event.speed)} km/h</span>
                            {event.batteryLevel !== undefined && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Batterie: {event.batteryLevel}%</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {maxItems && shipment.history.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-blue-600 hover:underline">
            Voir plus d'historique
          </button>
        </div>
      )}
    </div>
  );
}

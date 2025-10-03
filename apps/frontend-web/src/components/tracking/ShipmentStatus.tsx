'use client';

import type { ReactElement } from 'react';
import type { ShipmentDetails } from '@/types/tracking.types';
import { getActiveAlerts, getNextCheckpoint } from '@/lib/map-utils';
import { CheckCircle, AlertTriangle, Clock, MapPin, Truck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_transit: 'En cours de livraison',
  delayed: 'Retardé',
  out_for_delivery: 'En cours de livraison',
  delivered: 'Livré',
  exception: 'Incident',
  returned: 'Retourné',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_transit: 'bg-blue-100 text-blue-800',
  delayed: 'bg-amber-100 text-amber-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  exception: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
};

const STATUS_ICONS: Record<string, ReactElement> = {
  pending: <Clock className="w-4 h-4" />,
  in_transit: <Truck className="w-4 h-4" />,
  delayed: <Clock className="w-4 h-4" />,
  out_for_delivery: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
  exception: <AlertCircle className="w-4 h-4" />,
  returned: <AlertTriangle className="w-4 h-4" />,
};

interface ShipmentStatusProps {
  shipment: ShipmentDetails;
  className?: string;
}

export function ShipmentStatus({ shipment, className }: ShipmentStatusProps) {
  const progress = Math.round(shipment.progress);
  const activeAlerts = getActiveAlerts(shipment);
  const nextCheckpoint = getNextCheckpoint(shipment);
  const hasAlerts = activeAlerts.length > 0;
  const estimatedDelivery = new Date(shipment.estimatedDelivery.latest);
  const now = new Date();
  const isDelayed = shipment.status === 'delayed' || estimatedDelivery < now;

  // Format delivery time
  const formatDeliveryTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm p-6', className)}>
      {/* Header with tracking number and status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Suivi du colis{' '}
            <span className="font-mono text-blue-600">#{shipment.trackingNumber}</span>
          </h2>
          <p className="text-sm text-gray-500">
            Mis à jour aujourd'hui à {new Date(shipment.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        <Badge
          className={cn(
            'px-3 py-1.5 text-sm font-medium flex items-center gap-2',
            STATUS_COLORS[shipment.status]
          )}
        >
          {STATUS_ICONS[shipment.status]}
          {STATUS_LABELS[shipment.status]}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progression</span>
          <span>{progress}% complété</span>
        </div>
        <Progress value={progress} className="h-2.5" />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{shipment.origin.city}</span>
          <span>{shipment.destination.city}</span>
        </div>
      </div>

      {/* Delivery estimate */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Estimation de livraison
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-blue-900">
            {formatDeliveryTime(estimatedDelivery)}
          </span>
          <span className="text-sm text-blue-700">
            {isDelayed ? 'Retard estimé' : 'Livraison prévue'}
          </span>
          {isDelayed && (
            <Badge variant="destructive" className="ml-2">
              Retard
            </Badge>
          )}
        </div>
        <p className="text-sm text-blue-600 mt-1">
          {shipment.carrier.name} • {shipment.carrier.vehicle}
        </p>
      </div>

      {/* Next checkpoint */}
      {nextCheckpoint && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Prochaine étape
          </h3>
          <p className="text-gray-900 font-medium">{nextCheckpoint.name}</p>
          <p className="text-sm text-gray-600">{nextCheckpoint.address}</p>
          {nextCheckpoint.estimatedArrival && (
            <p className="text-sm text-gray-500 mt-1">
              Estimation d'arrivée: {new Date(nextCheckpoint.estimatedArrival).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Active alerts */}
      {hasAlerts && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertes actives
          </h3>
          <div className="space-y-2">
            {activeAlerts.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 rounded-lg text-sm',
                  alert.severity === 'critical'
                    ? 'bg-red-50 text-red-700 border-l-4 border-red-500'
                    : alert.severity === 'warning'
                      ? 'bg-amber-50 text-amber-700 border-l-4 border-amber-500'
                      : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                )}
              >
                <div className="font-medium">{alert.message}</div>
                <div className="text-xs opacity-80 mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                  {alert.estimatedDelay && ` • Retard estimé: ${alert.estimatedDelay} min`}
                </div>
                {alert.actionRequired && alert.actionUrl && (
                  <button
                    className="mt-2 text-xs font-medium underline hover:no-underline"
                    onClick={() => window.open(alert.actionUrl, '_blank')}
                  >
                    {alert.actionLabel || 'Voir les détails'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

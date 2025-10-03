import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TrackingAlert } from '@/types/tracking.types';
import { getAlertColor } from '@/services/alertService';
import { X, ExternalLink, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

interface SmartAlertsPanelProps {
  alerts: TrackingAlert[];
  onDismissAlert?: (alertId: string) => void;
  onAlertAction?: (alert: TrackingAlert) => void;
  className?: string;
}

/**
 * Smart Alerts Panel - Displays proactive, intelligent alerts
 */
export function SmartAlertsPanel({
  alerts,
  onDismissAlert,
  onAlertAction,
  className = '',
}: SmartAlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));
  const criticalAlerts = visibleAlerts.filter((a) => a.severity === 'critical');
  const warningAlerts = visibleAlerts.filter((a) => a.severity === 'warning');
  const infoAlerts = visibleAlerts.filter((a) => a.severity === 'info');

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
    onDismissAlert?.(alertId);
  };

  if (visibleAlerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            ✅ Alertes intelligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Aucune alerte pour le moment</p>
            <p className="text-xs mt-1">Tout se passe bien ! 🎉</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            🔔 Alertes intelligentes
            <span className="text-sm font-normal text-gray-500">({visibleAlerts.length})</span>
          </span>
          {criticalAlerts.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {criticalAlerts.length} critique{criticalAlerts.length > 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {/* Critical Alerts */}
            {criticalAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onAction={onAlertAction}
              />
            ))}

            {/* Warning Alerts */}
            {warningAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onAction={onAlertAction}
              />
            ))}

            {/* Info Alerts */}
            {infoAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onAction={onAlertAction}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Individual Alert Item
 */
function AlertItem({
  alert,
  onDismiss,
  onAction,
}: {
  alert: TrackingAlert;
  onDismiss: (id: string) => void;
  onAction?: (alert: TrackingAlert) => void;
}) {
  const colors = getAlertColor(alert.severity);
  const icon = alert.icon || getDefaultIcon(alert.type);

  return (
    <div className={`relative p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
      {/* Dismiss button */}
      {alert.canDismiss && (
        <button
          onClick={() => onDismiss(alert.id)}
          className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
      )}

      <div className="flex items-start gap-3 pr-6">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${colors.text}`}>{alert.title}</h4>
          <p className="text-xs text-gray-700 mt-1">{alert.message}</p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(alert.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {alert.estimatedDelay && (
              <div className="flex items-center gap-1">
                <span className="text-orange-600 font-medium">+{alert.estimatedDelay} min</span>
              </div>
            )}

            {alert.delayProbability && (
              <div className="flex items-center gap-1">
                <span className="text-orange-600">{alert.delayProbability}% risque</span>
              </div>
            )}

            {alert.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{alert.location.name}</span>
              </div>
            )}
          </div>

          {/* Action button */}
          {alert.actionRequired && alert.actionLabel && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 text-xs h-7"
              onClick={() => onAction?.(alert)}
            >
              {alert.actionLabel}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultIcon(type: TrackingAlert['type']): string {
  const icons = {
    delay: '⏰',
    route_change: '🗺️',
    weather: '🌧️',
    checkpoint: '🚧',
    traffic: '🚦',
    mechanical: '🔧',
    custom: '📢',
    delivery_soon: '📦',
  };
  return icons[type] || '📢';
}

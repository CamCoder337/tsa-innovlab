import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import type { TrackingPoint, ShipmentDetails } from '@/types/tracking.types';
import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripHistoryTimelineProps {
  history: TrackingPoint[];
  currentLocation?: ShipmentDetails['currentLocation'];
  onTimelineChange?: (point: TrackingPoint) => void;
  className?: string;
}

/**
 * Trip History Timeline - Visualize complete trip history with playback
 */
export function TripHistoryTimeline({
  history,
  onTimelineChange,
  className = '',
}: TripHistoryTimelineProps) {
  const [selectedIndex, setSelectedIndex] = useState(history.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedPoint = history[selectedIndex];

  const handleSliderChange = (value: number[]) => {
    const index = value[0];
    setSelectedIndex(index);
    if (onTimelineChange) {
      onTimelineChange(history[index]);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement playback logic
  };

  const handleSkipBack = () => {
    setSelectedIndex(Math.max(0, selectedIndex - 1));
  };

  const handleSkipForward = () => {
    setSelectedIndex(Math.min(history.length - 1, selectedIndex + 1));
  };

  const getStatusIcon = (status: TrackingPoint['status']) => {
    const icons = {
      pending: '⏳',
      in_transit: '🚚',
      delayed: '⏰',
      out_for_delivery: '📦',
      delivered: '✅',
      exception: '⚠️',
      returned: '↩️',
    };
    return icons[status] || '📍';
  };

  const getStatusColor = (status: TrackingPoint['status']) => {
    const colors = {
      pending: 'text-gray-600 bg-gray-100',
      in_transit: 'text-blue-600 bg-blue-100',
      delayed: 'text-orange-600 bg-orange-100',
      out_for_delivery: 'text-green-600 bg-green-100',
      delivered: 'text-green-700 bg-green-100',
      exception: 'text-red-600 bg-red-100',
      returned: 'text-purple-600 bg-purple-100',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const formatDuration = (point: TrackingPoint, prevPoint?: TrackingPoint) => {
    if (!prevPoint) return '';
    const duration = new Date(point.timestamp).getTime() - new Date(prevPoint.timestamp).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `+${hours}h${minutes}min`;
    return `+${minutes}min`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🕐 Historique du trajet
          <span className="text-sm font-normal text-gray-500">({history.length} points)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSkipBack}
            disabled={selectedIndex === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSkipForward}
            disabled={selectedIndex === history.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="flex-1 px-2">
            <Slider
              value={[selectedIndex]}
              max={history.length - 1}
              step={1}
              onValueChange={handleSliderChange}
              className="cursor-pointer"
            />
          </div>

          <div className="text-xs text-gray-600 min-w-[80px] text-right">
            {selectedIndex + 1} / {history.length}
          </div>
        </div>

        {/* Selected Point Details */}
        {selectedPoint && (
          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-start gap-3">
              <div className={`text-2xl p-2 rounded-lg ${getStatusColor(selectedPoint.status)}`}>
                {getStatusIcon(selectedPoint.status)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {selectedPoint.address || selectedPoint.city || 'Position'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPoint.eventDescription || `Statut: ${selectedPoint.status}`}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>📅 {new Date(selectedPoint.timestamp).toLocaleDateString('fr-FR')}</span>
                  <span>🕐 {new Date(selectedPoint.timestamp).toLocaleTimeString('fr-FR')}</span>
                  {selectedPoint.speed && <span>🚗 {selectedPoint.speed} km/h</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-4">
            {history.map((point, index) => {
              const isSelected = index === selectedIndex;
              const isCurrent = index === history.length - 1;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedIndex(index);
                    onTimelineChange?.(point);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Timeline dot and line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isCurrent ? 'bg-green-500' : isSelected ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                      {index < history.length - 1 && <div className="w-0.5 h-8 bg-gray-300 my-1" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getStatusIcon(point.status)}</span>
                        <h5 className="font-medium text-sm text-gray-900 truncate">
                          {point.city || point.address || 'Position inconnue'}
                        </h5>
                        {isCurrent && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Actuel
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {point.eventDescription || point.address}
                      </p>

                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>
                          {new Date(point.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {index > 0 && (
                          <span className="text-blue-600">
                            {formatDuration(point, history[index - 1])}
                          </span>
                        )}
                        {point.speed !== undefined && <span>{point.speed} km/h</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-600">Durée totale</p>
            <p className="text-sm font-bold text-gray-900">
              {(() => {
                const duration =
                  new Date(history[history.length - 1].timestamp).getTime() -
                  new Date(history[0].timestamp).getTime();
                const hours = Math.floor(duration / (1000 * 60 * 60));
                return `${hours}h${Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))}min`;
              })()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Points GPS</p>
            <p className="text-sm font-bold text-gray-900">{history.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Vitesse moy.</p>
            <p className="text-sm font-bold text-gray-900">
              {(() => {
                const speeds = history.filter((p) => p.speed).map((p) => p.speed!);
                if (speeds.length === 0) return 'N/A';
                const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
                return `${Math.round(avg)} km/h`;
              })()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

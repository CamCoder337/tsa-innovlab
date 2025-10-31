import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckCircle, AlertTriangle, FileText, MessageSquare, Loader2 } from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { missionService } from '@/services/mission.service';
import { useEffect, useState } from 'react';
import {
  useMissionsTranslation,
  useCommonTranslation,
  useErrorsTranslation,
} from '@/hooks/useTranslation';
import { getStatusLabel } from '@/lib/mission-utils';
import { useAuth } from '@/hooks/useAuth';

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'message' | 'document' | 'note';
  title: string;
  description?: string;
  date: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, unknown>;
}

interface MissionTimelineProps {
  mission: Mission;
}

export function MissionTimeline({ mission }: MissionTimelineProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();

  useEffect(() => {
    const fetchMissionHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch mission history from API
        const response =
          user?.role === 'transporteur'
            ? await missionService.getTransporteurMissionHistory(mission.id)
            : await missionService.getMissionHistory(mission.id);

        if (response.error) {
          setError(tErrors('missions.timelineLoadingError'));
        } else if (response.data?.missions?.data) {
          // Transform API response to timeline events
          const historyEvents = transformHistoryToEvents(response.data.missions.data);
          // Remove duplicates and sort
          const uniqueEvents = historyEvents.filter(
            (event, index, self) => index === self.findIndex((e) => e.id === event.id)
          );
          setEvents(
            uniqueEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          );
        }
      } catch {
        setError(tErrors('missions.timelineLoadingError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id]);

  // Transform mission history data to timeline events
  const transformHistoryToEvents = (historyMissions: Mission[]): TimelineEvent[] => {
    const historyEvents: TimelineEvent[] = [];

    historyMissions.forEach((historyMission, index) => {
      if (index > 0) {
        const previousMission = historyMissions[index - 1];

        // Status changes
        if (historyMission.status !== previousMission.status) {
          historyEvents.push({
            id: `history-status-${historyMission.id}-${index}`,
            type: 'status_change',
            title: `${tMissions('timeline.statusUpdated', { status: getStatusLabel(historyMission.status, tCommon) })}`,
            description: `${tMissions('timeline.statusChange', { oldStatus: getStatusLabel(previousMission.status, tCommon), newStatus: getStatusLabel(historyMission.status, tCommon) })}`,
            date: historyMission.updatedAt,
          });
        }

        // Location updates
        if (
          historyMission.currentPosition &&
          (!previousMission.currentPosition ||
            historyMission.currentPosition.lat !== previousMission.currentPosition.lat ||
            historyMission.currentPosition.lng !== previousMission.currentPosition.lng)
        ) {
          historyEvents.push({
            id: `history-location-${historyMission.id}-${index}`,
            type: 'status_change',
            title: tMissions('timeline.positionUpdated'),
            description: `${tMissions('timeline.newPosition')}: ${historyMission.currentPosition.lat.toFixed(4)}, ${historyMission.currentPosition.lng.toFixed(4)}`,
            date: historyMission.lastPositionUpdate || historyMission.updatedAt,
          });
        }
      }
    });

    return historyEvents;
  };

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'status_change':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'note':
        return event.title.includes('évaluation') ? (
          <CheckCircle className="h-4 w-4 text-yellow-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        );
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {tMissions('timeline.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{tCommon('loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {tMissions('timeline.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {tMissions('timeline.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{tMissions('timeline.noEvents')}</p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="relative pb-6 pl-8 border-l-2 border-gray-200 dark:border-gray-700"
                >
                  <div className="absolute -left-2.5 mt-1.5 h-4 w-4 rounded-full bg-tsa-blue/90 flex items-center justify-center">
                    {getEventIcon(event)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{event.title}</h4>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(event.date), 'PPPp', { locale: fr })}
                      </time>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                    {event.user && (
                      <p className="text-xs text-gray-500 mt-1">
                        {tCommon('by')} {event.user.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

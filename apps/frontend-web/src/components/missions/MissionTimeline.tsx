import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckCircle, AlertTriangle, FileText, Loader2, MapPin } from 'lucide-react';
import type { Mission, MissionUpdate } from '@/types/mission.types';
import { missionService } from '@/services/mission.service';
import { useEffect, useState } from 'react';
import {
  useMissionsTranslation,
  useCommonTranslation,
  useErrorsTranslation,
} from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';

interface MissionTimelineProps {
  mission: Mission;
}

export function MissionTimeline({ mission }: MissionTimelineProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<MissionUpdate[]>([]);
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
        }

        if (response.data) {
          console.log(response.data);
          setEvents(response.data.updates.data);
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

  const getEventIcon = (event: MissionUpdate) => {
    switch (event.type) {
      case 'status_change':
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />;
      case 'location_update':
        return <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />;
      case 'proof_upload':
        return <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />;
      case 'note':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />;
      case 'issue':
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getLocalizedEventTitle = (event: MissionUpdate) => {
    if (event.type === 'status_change' && event.oldStatus && event.newStatus) {
      const oldStatusTranslated = tCommon(`status.${event.oldStatus}`, event.oldStatus);
      const newStatusTranslated = tCommon(`status.${event.newStatus}`, event.newStatus);

      return tMissions('timeline.statusChangeTitle', {
        oldStatus: oldStatusTranslated,
        newStatus: newStatusTranslated,
      });
    }

    return event.title;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            {tMissions('timeline.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
            <span className="ml-2 text-xs sm:text-sm">{tCommon('loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            {tMissions('timeline.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8 text-red-600">
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
            <p className="text-xs sm:text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          {tMissions('timeline.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8 text-xs sm:text-sm">
            {tMissions('timeline.noEvents')}
          </p>
        ) : (
          <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
            <div className="space-y-4 sm:space-y-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="relative pb-4 sm:pb-6 pl-6 sm:pl-8 border-l-2 border-gray-200 dark:border-gray-700"
                >
                  <div className="absolute -left-2 sm:-left-2.5 mt-1 sm:mt-1.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-tsa-blue/90 flex items-center justify-center">
                    {getEventIcon(event)}
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <h4 className="text-xs sm:text-sm font-medium leading-tight">
                        {getLocalizedEventTitle(event)}
                      </h4>
                      <time className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(event.createdAt), 'PPPp', { locale: fr })}
                      </time>
                    </div>
                    {event.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    {event.transporteur && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {tCommon('by')}{' '}
                        {event.transporteur.firstName + ' ' + event.transporteur.lastName}
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

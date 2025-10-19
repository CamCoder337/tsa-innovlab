import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckCircle, AlertTriangle, FileText, MessageSquare, Loader2 } from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { missionService } from '@/services/mission.service';
import { useEffect, useState } from 'react';

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
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMissionHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch mission history from API
        const response = await missionService.getMissionHistory(mission.id);

        if (response.error) {
          setError("Erreur lors du chargement de l'historique");
          // Fallback to generated events
          setEvents(generateTimelineEvents());
        } else if (response.data?.missions?.data) {
          // Transform API response to timeline events
          const historyEvents = transformHistoryToEvents(response.data.missions.data);
          // Combine with basic mission events
          const basicEvents = generateTimelineEvents();
          const allEvents = [...historyEvents, ...basicEvents];
          // Remove duplicates and sort
          const uniqueEvents = allEvents.filter(
            (event, index, self) => index === self.findIndex((e) => e.id === event.id)
          );
          setEvents(
            uniqueEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          );
        } else {
          // Fallback to generated events if no data
          setEvents(generateTimelineEvents());
        }
      } catch {
        setError("Erreur lors du chargement de l'historique");
        // Fallback to generated events
        setEvents(generateTimelineEvents());
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
            title: `Statut mis à jour: ${getStatusLabel(historyMission.status)}`,
            description: `Changement de "${getStatusLabel(previousMission.status)}" vers "${getStatusLabel(historyMission.status)}"`,
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
            title: 'Position mise à jour',
            description: `Nouvelle position: ${historyMission.currentPosition.lat.toFixed(4)}, ${historyMission.currentPosition.lng.toFixed(4)}`,
            date: historyMission.lastPositionUpdate || historyMission.updatedAt,
          });
        }
      }
    });

    return historyEvents;
  };

  // Generate timeline events based on mission data (fallback)
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add creation event
    events.push({
      id: 'created',
      type: 'status_change',
      title: 'Mission créée',
      date: mission.createdAt,
      user: {
        id: mission.affreteurId,
        name: 'Affréteur',
        role: 'affreteur',
      },
    });

    // Add status changes
    if (mission.updatedAt !== mission.createdAt) {
      events.push({
        id: 'status-update',
        type: 'status_change',
        title: `Statut mis à jour: ${getStatusLabel(mission.status)}`,
        date: mission.updatedAt,
        metadata: {
          previousStatus: 'draft',
          newStatus: mission.status,
        },
      });
    }

    // Add estimated dates
    if (mission.dateDepartEstime) {
      events.push({
        id: 'estimated-departure',
        type: 'status_change',
        title: 'Date de départ estimée définie',
        description: `Prévu le ${format(new Date(mission.dateDepartEstime), 'PPP', { locale: fr })}`,
        date: mission.dateDepartEstime,
      });
    }

    if (mission.dateArriveePrevue) {
      events.push({
        id: 'estimated-arrival',
        type: 'status_change',
        title: "Date d'arrivée prévue définie",
        description: `Prévu le ${format(new Date(mission.dateArriveePrevue), 'PPP', { locale: fr })}`,
        date: mission.dateArriveePrevue,
      });
    }

    // Add real dates if available
    if (mission.dateDebutReelle) {
      events.push({
        id: 'actual-departure',
        type: 'status_change',
        title: 'Départ effectif',
        description: `Départ le ${format(new Date(mission.dateDebutReelle), 'PPPp', { locale: fr })}`,
        date: mission.dateDebutReelle,
      });
    }

    if (mission.dateFinReelle) {
      events.push({
        id: 'actual-arrival',
        type: 'status_change',
        title: 'Arrivée effective',
        description: `Arrivée le ${format(new Date(mission.dateFinReelle), 'PPPp', { locale: fr })}`,
        date: mission.dateFinReelle,
      });
    }

    // Add ratings if available
    if (mission.ratingAffreteur) {
      events.push({
        id: 'rating-affreteur',
        type: 'note',
        title: "Évaluation de l'affréteur",
        description: `Note: ${'★'.repeat(mission.ratingAffreteur)}${'☆'.repeat(5 - mission.ratingAffreteur)}`,
        date: mission.updatedAt,
      });
    }

    if (mission.ratingTransporteur) {
      events.push({
        id: 'rating-transporteur',
        type: 'note',
        title: 'Évaluation du transporteur',
        description: `Note: ${'★'.repeat(mission.ratingTransporteur)}${'☆'.repeat(5 - mission.ratingTransporteur)}`,
        date: mission.updatedAt,
      });
    }

    // Add comments if available
    if (mission.commentaireAffreteur) {
      events.push({
        id: 'comment-affreteur',
        type: 'message',
        title: "Commentaire de l'affréteur",
        description: mission.commentaireAffreteur,
        date: mission.updatedAt,
      });
    }

    if (mission.commentaireTransporteur) {
      events.push({
        id: 'comment-transporteur',
        type: 'message',
        title: 'Commentaire du transporteur',
        description: mission.commentaireTransporteur,
        date: mission.updatedAt,
      });
    }

    // Sort events by date (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      published: 'Publiée',
      assigned: 'Assignée',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique de la mission</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Chargement de l'historique...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-muted-foreground mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">
              Affichage des données de base disponibles
            </p>
          </div>
        ) : null}

        {events.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun événement à afficher pour le moment
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="relative pb-6 pl-8 border-l-2 border-gray-200 dark:border-gray-700"
                >
                  <div className="absolute -left-2.5 mt-1.5 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
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
                      <div className="text-xs text-muted-foreground">
                        Par {event.user.name} ({event.user.role})
                      </div>
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

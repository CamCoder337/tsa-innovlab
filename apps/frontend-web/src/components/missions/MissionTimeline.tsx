import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckCircle, AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import type { Mission } from '@/types/mission.types';

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
  // Generate timeline events based on mission data
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

  const events = generateTimelineEvents();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique de la mission</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
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

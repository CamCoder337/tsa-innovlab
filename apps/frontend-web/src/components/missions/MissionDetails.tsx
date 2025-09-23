import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, DollarSign, Info, AlertTriangle } from 'lucide-react';
import type { Mission } from '@/types/mission.types';

interface MissionDetailsProps {
  mission: Mission;
}

export function MissionDetails({ mission }: MissionDetailsProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'published':
        return 'secondary';
      case 'assigned':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {mission.titre}
                <Badge variant={getStatusBadgeVariant(mission.status)}>
                  {getStatusLabel(mission.status)}
                </Badge>
                {mission.isFlexibleDates && (
                  <Badge variant="outline" className="text-xs">
                    Dates flexibles
                  </Badge>
                )}
                {mission.isFlexibleRoute && (
                  <Badge variant="outline" className="text-xs">
                    Itinéraire flexible
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                #{mission.id} • {mission.typeMarchandise || 'Type non spécifié'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mission.description && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" /> Description
              </h3>
              <p className="text-sm text-muted-foreground">{mission.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Itinéraire
              </h3>
              <div className="text-sm space-y-1">
                <div className="font-medium">Départ</div>
                <p className="text-muted-foreground">
                  {mission.adresseDepart?.label || 'Non spécifié'}
                </p>
                <div className="font-medium mt-2">Arrivée</div>
                <p className="text-muted-foreground">
                  {mission.adresseArrivee?.label || 'Non spécifié'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Dates
              </h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Départ estimé:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.dateDepartEstime
                      ? new Date(mission.dateDepartEstime).toLocaleDateString()
                      : 'Non défini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Arrivée prévue:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.dateArriveePrevue
                      ? new Date(mission.dateArriveePrevue).toLocaleDateString()
                      : 'Non défini'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Budget
              </h3>
              <div className="text-sm">
                <div>
                  <span className="font-medium">Budget:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.budgetMin?.toLocaleString() || 'N/A'} -{' '}
                    {mission.budgetMax?.toLocaleString() || 'N/A'} FCFA
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-medium">Type de marchandise:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.typeMarchandise || 'Non spécifié'}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-medium">Poids:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.poids ? `${mission.poids} kg` : 'Non spécifié'}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-medium">Volume:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.volume ? `${mission.volume} m³` : 'Non spécifié'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {mission.notesComplementaires && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Notes complémentaires
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {mission.notesComplementaires}
              </p>
            </div>
          )}

          {mission.documents && mission.documents.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Documents</h3>
              <div className="flex flex-wrap gap-2">
                {mission.documents.map((doc, index) => (
                  <a
                    key={index}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-accent"
                  >
                    Document {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

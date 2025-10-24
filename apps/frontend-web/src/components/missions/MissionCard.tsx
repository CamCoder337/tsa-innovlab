import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Eye, Edit, MessageSquare } from 'lucide-react';
import { getStatusColor, getStatusIcon, getStatusLabel } from '@/lib/mission-utils';
import { useMissions } from '@/hooks/useMissions';
import type { Mission } from '@/types/mission.types';

interface MissionCardProps {
  mission: Mission;
  onPublish?: (id: string) => void;
  onApply?: (mission: Mission) => void;
  onCancel?: (id: string) => void;
  showApplyButton?: boolean;
  showPublishButton?: boolean;
  className?: string;
}

export default function MissionCard({
  mission,
  onPublish,
  onApply,
  onCancel,
  className = '',
}: MissionCardProps) {
  const { setCurrentMission } = useMissions();

  const handleMissionClick = () => {
    setCurrentMission(mission);
  };

  // const fetchPropositions = useCallback(async () => {
  //   const response = await missionService.getMissionPropositions(mission.id);
  //   if (response.error) {
  //     console.error(response.error.message);
  //   }
  //   if (response.data) {
  //     setMyPropositions(response.data.propositions.data);
  //   }
  // }, [mission.id]);

  // useEffect(() => {
  //   if (user && user.role === 'affreteur') fetchPropositions();
  // }, [fetchPropositions, user]);

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-1 flex-col lg:flex-row lg:items-center gap-4">
          <Link
            to={`/app/missions/${mission.id}`}
            className="flex flex-col flex-1"
            aria-label={`Voir ${mission.title}`}
            onClick={handleMissionClick}
          >
            <div className="flex flex-col flex-1">
              <div className="flex flex-1 items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{mission.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {mission.adresseDepart?.label} → {mission.adresseArrivee?.label}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Crée le {new Date(mission.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(mission.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(mission.status)}
                    {getStatusLabel(mission.status)}
                  </div>
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Tarif:</span>
                  <span className="ml-1 font-medium">
                    {mission.budgetMin?.toLocaleString() || 0} FCFA
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Départ:</span>
                  <span className="ml-1 font-medium">
                    {mission.dateDepartEstime
                      ? new Date(mission.dateDepartEstime).toLocaleDateString('fr-FR')
                      : 'Non spécifiée'}
                  </span>
                </div>
                {mission.dateArriveePrevue && (
                  <div>
                    <span className="text-gray-500">Arrivée:</span>
                    <span className="ml-1 font-medium">
                      {mission.dateArriveePrevue
                        ? new Date(mission.dateArriveePrevue).toLocaleDateString('fr-FR')
                        : 'Non spécifiée'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>

          <div className="flex flex-col gap-2 lg:w-48">
            <Link
              to={`/app/missions/${mission.id}`}
              aria-label={`Voir ${mission.title}`}
              onClick={handleMissionClick}
            >
              <Button variant="outline" className="gap-2 bg-transparent w-full">
                <Eye className="h-4 w-4" />
                Voir Détails
              </Button>
            </Link>
            {mission.status === 'draft' && onPublish && (
              <Button
                variant="outline"
                className="gap-2 bg-tsa-blue text-white w-full"
                onClick={() => onPublish(mission.id)}
              >
                <Edit className="h-4 w-4" />
                Publier
              </Button>
            )}
            {mission.status === 'published' && onApply && (
              <Button
                className="gap-2 w-full"
                style={{ backgroundColor: 'var(--tsa-blue)' }}
                onClick={() => onApply(mission)}
              >
                <MessageSquare className="h-4 w-4" />
                Postuler
              </Button>
            )}
            {mission.status === 'published' && onCancel && (
              <Button
                className="gap-2 w-full"
                style={{ backgroundColor: 'var(--tsa-blue)' }}
                onClick={() => onCancel(mission.id)}
              >
                <MessageSquare className="h-4 w-4" />
                Annuler la Mission
              </Button>
            )}
            {mission.status === 'assigned' && (
              <Link
                to={`/app/missions/${mission.id}/tracking`}
                aria-label={`Suivre ${mission.title}`}
                onClick={handleMissionClick}
              >
                <Button className="gap-2 w-full" style={{ backgroundColor: 'var(--tsa-blue)' }}>
                  <MapPin className="h-4 w-4" />
                  Suivre Expédition
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

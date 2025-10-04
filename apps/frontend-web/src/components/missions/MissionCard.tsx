import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Calendar, DollarSign } from 'lucide-react';
import { getStatusColor } from '@/lib/functions';
import MissionTrackingButton from './MissionTrackingButton';
import type { Mission } from '@/types/mission.types';

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
  showTrackingButton?: boolean;
  className?: string;
}

const getPriorityColor = (budgetMax: number) => {
  if (budgetMax > 200000) return 'bg-red-100 text-red-800';
  if (budgetMax > 100000) return 'bg-orange-100 text-orange-800';
  if (budgetMax > 50000) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'published':
      return 'Publiée';
    case 'assigned':
      return 'Assignée';
    case 'completed':
      return 'Terminée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status;
  }
};

export default function MissionCard({
  mission,
  onClick,
  showTrackingButton = true,
  className = '',
}: MissionCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-gray-900">{mission.titre}</h3>
              <Badge className={getPriorityColor(mission.budgetMax)}>
                {mission.budgetMax > 200000 ? 'Urgent' : 'Normal'}
              </Badge>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(mission.status)}`} />
                <span className="text-sm text-gray-600">{getStatusLabel(mission.status)}</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-3">{mission.description}</p>
          </div>
          {showTrackingButton && (
            <MissionTrackingButton missionId={mission.id} onClick={(e) => e.stopPropagation()} />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-gray-500">Marchandise</p>
              <p className="font-medium">{mission.typeMarchandise}</p>
              <p className="text-xs text-gray-400">{mission.poids} kg</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-gray-500">Budget</p>
              <p className="font-medium">
                {mission.budgetMin.toLocaleString()}-{mission.budgetMax.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-gray-500">Départ estimé</p>
              <p className="font-medium">
                {new Date(mission.dateDepartEstime).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-gray-500">Livraison prévue</p>
              <p className="font-medium">
                {new Date(mission.dateArriveePrevue).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {mission.transporteurId && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-700 font-medium">
                Transporteur assigné #{mission.transporteurId}
              </span>
            </div>
          </div>
        )}

        {mission.currentPosition && (
          <div className="mt-2 p-2 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">
                Position en temps réel disponible
              </span>
              {mission.lastPositionUpdate && (
                <span className="text-xs text-green-600">
                  • MAJ: {new Date(mission.lastPositionUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

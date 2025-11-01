import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Eye, Edit, MessageSquare, X } from 'lucide-react';
import { getStatusColor, getStatusIcon, getStatusLabel } from '@/lib/mission-utils';
import { useMissions } from '@/hooks/useMissions';
import type { Mission } from '@/types/mission.types';
import { useMissionsTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useVehicleInfo } from '@/hooks/useVehicleInfo';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

interface MissionCardProps {
  mission: Mission;
  onPublish?: (id: string) => void;
  onStart?: () => void;
  onApply?: () => void;
  onCancel?: (id: string) => void;
  className?: string;
}

export default function MissionCard({
  mission,
  onPublish,
  onStart,
  onApply,
  onCancel,
  className = '',
}: MissionCardProps) {
  const { user } = useAuth();
  const { setCurrentMission } = useMissions();
  const { getUserName } = useUserSearch();
  const { getVehicleRegistration } = useVehicleInfo();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [transporteurName, setTransporteurName] = useState<string>('');
  const [affreteurName, setAffreteurName] = useState<string>('');
  const [vehicleRegistration, setVehicleRegistration] = useState<string>('');

  // Fetch user names and vehicle info
  useEffect(() => {
    const fetchInfo = async () => {
      // Fetch transporteur name for affreteurs
      if (user?.role === 'affreteur' && mission.transporteurId) {
        const name = await getUserName(mission.transporteurId);
        setTransporteurName(name);
      }

      // Fetch affreteur name for transporteurs
      if (user?.role === 'transporteur' && mission.affreteurId) {
        const name = await getUserName(mission.affreteurId);
        setAffreteurName(name);
      }

      // Fetch vehicle registration for transporteurs
      if (mission.vehicleId) {
        const registration = await getVehicleRegistration(mission.vehicleId);
        setVehicleRegistration(registration);
      }
    };

    fetchInfo();
  }, [
    mission.transporteurId,
    mission.affreteurId,
    mission.vehicleId,
    user?.role,
    getUserName,
    getVehicleRegistration,
  ]);

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-1 flex-col lg:flex-row lg:items-center gap-4">
          <Link
            to={`/app/missions/${mission.id}`}
            className="flex flex-col flex-1"
            aria-label={`${tCommon('actions.view')} ${mission.title}`}
            onClick={() => {
              setCurrentMission(mission);
            }}
          >
            <div className="flex flex-col flex-1">
              <div className="flex flex-1 items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{mission.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="max-w-sm">
                        {mission.adresseDepart?.label} → {mission.adresseArrivee?.label}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {tMissions('createdOn')}{' '}
                        {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(mission.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(mission.status)}
                    {getStatusLabel(mission.status, tCommon)}
                  </div>
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500">{tMissions('budget')}:</span>
                  <span className="ml-1 font-medium">
                    {mission.budgetMin?.toLocaleString() || 0} FCFA
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{tMissions('departure')}:</span>
                  <span className="ml-1 font-medium">
                    {mission.dateDepartEstime
                      ? new Date(mission.dateDepartEstime).toLocaleDateString('fr-FR')
                      : tCommon('notSpecified')}
                  </span>
                </div>
                {mission.dateArriveePrevue && (
                  <div>
                    <span className="text-gray-500">{tMissions('arrival')}:</span>
                    <span className="ml-1 font-medium">
                      {mission.dateArriveePrevue
                        ? new Date(mission.dateArriveePrevue).toLocaleDateString('fr-FR')
                        : tCommon('notSpecified')}
                    </span>
                  </div>
                )}
                {/* Show transporteur name for affreteurs */}
                {user?.role === 'affreteur' && transporteurName && (
                  <div>
                    <span className="text-gray-500">{tCommon('roles.transporteur')}:</span>
                    <span className="ml-1 font-medium">{transporteurName}</span>
                  </div>
                )}
                {/* Show affreteur name for transporteurs */}
                {user?.role === 'transporteur' && affreteurName && (
                  <div>
                    <span className="text-gray-500">{tCommon('roles.affreteur')}:</span>
                    <span className="ml-1 font-medium">{affreteurName}</span>
                  </div>
                )}
                {/* Show vehicle registration for transporteurs */}
                {user?.role === 'transporteur' && vehicleRegistration && (
                  <div>
                    <span className="text-gray-500">Véhicule:</span>
                    <span className="ml-1 font-medium">{vehicleRegistration}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>

          <div className="flex flex-col gap-2 lg:w-48">
            <Link
              to={`/app/missions/${mission.id}`}
              aria-label={`${tCommon('actions.view')} ${mission.title}`}
              onClick={() => {
                setCurrentMission(mission);
              }}
            >
              <Button variant="outline" className="gap-2 bg-transparent w-full">
                <Eye className="h-4 w-4" />
                {tCommon('actions.viewDetails')}
              </Button>
            </Link>

            {mission.status === 'draft' && onPublish && (
              <Button
                variant="outline"
                className="gap-2 bg-tsa-blue text-white w-full"
                onClick={() => onPublish(mission.id)}
              >
                <Edit className="h-4 w-4" />
                {tCommon('actions.publish')}
              </Button>
            )}

            {mission.status === 'published' && onApply && (
              <Button
                className="gap-2 w-full"
                style={{ backgroundColor: 'var(--tsa-blue)' }}
                onClick={onApply}
              >
                <MessageSquare className="h-4 w-4" />
                {tCommon('actions.apply')}
              </Button>
            )}

            {mission.status === 'published' && onCancel && (
              <Button className="gap-2 w-full bg-red-00" onClick={() => onCancel(mission.id)}>
                <X className="h-4 w-4" />
                {tCommon('actions.cancel')}
              </Button>
            )}

            {mission.status === 'assigned' && onStart && (
              <Button
                className="gap-2 w-full"
                style={{ backgroundColor: 'var(--tsa-blue)' }}
                onClick={onStart}
              >
                <MapPin className="h-4 w-4" />
                {tMissions('actions.start')}
              </Button>
            )}

            {mission.status === 'in_progress' && (
              <Link
                to={`/app/mission/${mission.id}/tracking`}
                aria-label={`${tMissions('track')} ${mission.title}`}
                onClick={() => {
                  setCurrentMission(mission);
                }}
              >
                <Button className="gap-2 w-full" style={{ backgroundColor: 'var(--tsa-blue)' }}>
                  <MapPin className="h-4 w-4" />
                  {tMissions('trackShipment')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

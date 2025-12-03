import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Calendar,
  Eye,
  Edit,
  MessageSquare,
  X,
  Package,
  Weight,
  DollarSign,
  User,
  Truck,
  ArrowDown,
} from 'lucide-react';
import { getStatusColor, getStatusIcon, getStatusLabel } from '@/lib/utils';
import { useMissions } from '@/hooks/useMissions';
import type { Mission } from '@/types/mission.types';
import { useMissionsTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

interface MissionCardProps {
  mission: Mission;
  onPublish?: (id: string) => void;
  onStart?: () => void;
  onApply?: () => void;
  onCancel?: (id: string) => void;
}

export default function MissionCard({
  mission,
  onPublish,
  onStart,
  onApply,
  onCancel,
}: MissionCardProps) {
  const { user } = useAuth();
  const { setCurrentMission } = useMissions();
  const { getUserName } = useUserSearch();
  const { getVehicleById } = useVehicles();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [transporteurName, setTransporteurName] = useState<string>('');
  const [affreteurName, setAffreteurName] = useState<string>('');
  const [vehicleRegistration, setVehicleRegistration] = useState<string>('');

  // Fetch user names and vehicle info (only if not preloaded)
  useEffect(() => {
    const fetchInfo = async () => {
      // Use preloaded transporteur data first, fallback to fetch
      if (user?.role !== 'transporteur' && mission.transporteurId) {
        if (mission.transporteur) {
          const name = `${mission.transporteur.firstName} ${mission.transporteur.lastName}`;
          setTransporteurName(name);
        } else {
          const name = await getUserName(mission.transporteurId);
          setTransporteurName(name);
        }
      }

      // Use preloaded affreteur data first, fallback to fetch
      if (user?.role !== 'affreteur' && mission.affreteurId) {
        if (mission.affreteur) {
          const name = `${mission.affreteur.firstName} ${mission.affreteur.lastName}`;
          setAffreteurName(name);
        } else {
          const name = await getUserName(mission.affreteurId);
          setAffreteurName(name);
        }
      }

      // Use preloaded vehicle data first, fallback to fetch
      if (user?.role === 'transporteur' && mission.vehicleId) {
        if (mission.vehicle) {
          setVehicleRegistration(mission.vehicle.registration);
        } else {
          const vehicle = await getVehicleById(mission.vehicleId);
          setVehicleRegistration(vehicle?.registration || '');
        }
      }
    };

    fetchInfo();
  }, [
    mission.transporteurId,
    mission.transporteur,
    mission.affreteurId,
    mission.affreteur,
    mission.vehicleId,
    mission.vehicle,
    user?.role,
    getUserName,
    getVehicleById,
  ]);

  return (
    <Card>
      <CardContent className="p-3 sm:p-4 lg:p-6 max-w-xs sm:max-w-none">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
          <Link
            to={`/app/missions/${mission.id}`}
            className="flex flex-col flex-1"
            aria-label={`${tCommon('actions.view')} ${mission.title}`}
            onClick={() => {
              setCurrentMission(mission);
            }}
          >
            <div className="flex flex-col flex-1 gap-1">
              <div className="flex flex-1 items-start sm:justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                    {mission.title}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="hidden sm:flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">
                        {mission.adresseDepart?.label} → {mission.adresseArrivee?.label}
                      </span>
                    </div>
                    <div className="flex flex-col sm:hidden gap-1">
                      <span className="truncate flex gap-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        {mission.adresseDepart?.label}
                      </span>
                      <span className="truncate flex items-center justify-center w-1/2">
                        <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      </span>
                      <span className="truncate flex gap-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        {mission.adresseArrivee?.label}
                      </span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">
                        {tMissions('createdOn')}{' '}
                        {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={`${getStatusColor(mission.status)} ml-2 flex-shrink-0`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(mission.status)}
                    <span>{getStatusLabel(mission.status, tCommon)}</span>
                  </div>
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                {mission.typeMarchandise && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 truncate">
                      {mission.typeMarchandise}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 sm:gap-2">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {mission.budgetMin ? `${mission.budgetMin.toLocaleString()} FCFA` : 0 + ' FCFA'}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Weight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {mission.poids ? `${mission.poids} t` : tMissions('noWeight')}
                  </span>
                </div>
              </div>

              {user?.role === 'affreteur' && mission.transporteurId && transporteurName && (
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">{tCommon('roles.transporteur')}:</span>
                    <span className="ml-1 truncate">{transporteurName}</span>
                  </span>
                </div>
              )}

              {user?.role === 'transporteur' && mission.affreteurId && affreteurName && (
                <div className="grid grid-cols-3">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">{tCommon('roles.affreteur')}:</span>
                      <span className="ml-1 truncate">{affreteurName}</span>
                    </span>
                  </div>
                  {vehicleRegistration && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">{tMissions('details.vehicle')}:</span>
                        <span className="ml-1 truncate">{vehicleRegistration}</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>

          <div className="flex flex-col gap-2 lg:w-auto">
            {mission.status === 'draft' && onPublish && (
              <Button
                className="gap-2 w-full sm:w-auto lg:w-full text-xs sm:text-sm px-3 py-2"
                style={{ backgroundColor: 'var(--tsa-blue)' }}
                onClick={() => onPublish(mission.id)}
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tCommon('actions.publish')}</span>
              </Button>
            )}

            {mission.status === 'published' && onApply && (
              <Button
                className="gap-2 w-full sm:w-auto lg:w-full text-xs sm:text-sm px-3 py-2"
                style={{ backgroundColor: 'var(--tsa-blue)' }}
                onClick={onApply}
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tCommon('actions.apply')}</span>
              </Button>
            )}

            {mission.status === 'published' && onCancel && (
              <Button
                className="gap-2 w-full sm:w-auto lg:w-full bg-red-500 text-xs sm:text-sm px-3 py-2"
                onClick={() => onCancel(mission.id)}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tCommon('actions.cancel')}</span>
              </Button>
            )}

            {mission.status === 'assigned' && onStart && (
              <Button
                className="gap-2 w-full sm:w-auto lg:w-full text-xs sm:text-sm px-3 py-2"
                style={{ backgroundColor: 'var(--tsa-blue)' }}
                onClick={onStart}
              >
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tMissions('actions.start')}</span>
              </Button>
            )}

            {user?.role === 'affreteur' && ['assigned', 'in_progress', 'delivered'].includes(mission.status) && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 w-full sm:w-auto lg:w-full text-xs sm:text-sm px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200"
              >
                <Link to={`/app/mission/${mission.id}/tracking`} onClick={() => setCurrentMission(mission)}>
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Suivre la mission</span>
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 w-full sm:w-auto lg:w-full text-xs sm:text-sm px-3 py-2"
            >
              <Link to={`/app/missions/${mission.id}`} onClick={() => setCurrentMission(mission)}>
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tCommon('actions.viewDetails')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

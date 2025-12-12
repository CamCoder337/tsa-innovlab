import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, DollarSign, Info, AlertTriangle, Copy, Check } from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { getStatusColor } from '@/lib/utils';
import { getStatusLabel } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  useMissionsTranslation,
  useCommonTranslation,
  useFormsTranslation,
} from '@/hooks/useTranslation';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/button';

interface MissionDetailsProps {
  mission: Mission;
}

export function MissionDetails({ mission }: MissionDetailsProps) {
  const { user } = useAuth();
  const { getUserName } = useUserSearch();
  const { getVehicleById } = useVehicles();
  const [transporteurName, setTransporteurName] = useState<string>('');
  const [affreteurName, setAffreteurName] = useState<string>('');
  const [vehicleRegistration, setVehicleRegistration] = useState<string>('');
  const { t: tCommon } = useCommonTranslation();
  const { t: tForms } = useFormsTranslation();
  const { t: tMissions } = useMissionsTranslation();
  const [isIdExpanded, setIsIdExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mission.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Fetch user names and vehicle info (only if not preloaded)
  useEffect(() => {
    let isMounted = true;

    const fetchInfo = async () => {
      // Use preloaded transporteur data first, fallback to fetch
      if (user?.role !== 'transporteur' && mission.transporteurId) {
        if (mission.transporteur) {
          const name = `${mission.transporteur.firstName} ${mission.transporteur.lastName}`;
          if (isMounted) setTransporteurName(name);
        } else {
          try {
            const name = await getUserName(mission.transporteurId);
            if (isMounted) setTransporteurName(name);
          } catch (error) {
            console.error('Error fetching transporteur name:', error);
          }
        }
      }

      // Use preloaded affreteur data first, fallback to fetch
      if (user?.role !== 'affreteur' && mission.affreteurId) {
        if (mission.affreteur) {
          const name = `${mission.affreteur.firstName} ${mission.affreteur.lastName}`;
          if (isMounted) setAffreteurName(name);
        } else {
          try {
            const name = await getUserName(mission.affreteurId);
            if (isMounted) setAffreteurName(name);
          } catch (error) {
            console.error('Error fetching affreteur name:', error);
          }
        }
      }

      // Use preloaded vehicle data first, fallback to fetch
      if (user?.role === 'transporteur' && mission.vehicleId) {
        if (mission.vehicle) {
          if (isMounted) setVehicleRegistration(mission.vehicle.registration);
        } else {
          const vehicle = getVehicleById(mission.vehicleId);
          if (isMounted) setVehicleRegistration(vehicle?.registration || '');
        }
      }
    };

    fetchInfo();

    return () => {
      isMounted = false;
    };
  }, [
    mission.transporteurId,
    mission.transporteur?.firstName,
    mission.transporteur?.lastName,
    mission.affreteurId,
    mission.affreteur?.firstName,
    mission.affreteur?.lastName,
    mission.vehicleId,
    mission.vehicle?.registration,
    user?.role,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  return (
    <div>
      <Card className="gap-3">
        <CardHeader className="">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl flex flex-1 justify-between sm:flex-row sm:items-center gap-2">
                <div className="flex flex-col min-w-0 sm:gap-1">
                  <span className="truncate">{mission.title}</span>
                  <div
                    className="flex items-center gap-2 mt-1 cursor-pointer group"
                    onClick={() => setIsIdExpanded(!isIdExpanded)}
                  >
                    <span
                      className={`text-xs sm:text-sm text-muted-foreground transition-all ${
                        isIdExpanded ? '' : 'truncate max-w-12'
                      }`}
                    >
                      {mission.id}
                    </span>
                    {isIdExpanded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={handleCopyId}
                      >
                        {isCopied ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(mission.status)}>
                    {getStatusLabel(mission.status, tCommon)}
                  </Badge>
                </div>
              </CardTitle>
              {mission.typeMarchandise && (
                <Badge variant="outline" className="text-xs sm:mt-2">
                  {mission.typeMarchandise}
                </Badge>
              )}
              {mission.isFlexibleDates && (
                <Badge variant="outline" className="text-xs">
                  {tMissions('details.flexibleDates')}
                </Badge>
              )}
              {mission.isFlexibleRoute && (
                <Badge variant="outline" className="text-xs">
                  {tMissions('details.flexibleRoute')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {mission.description && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />{' '}
                {tForms('labels.description')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {mission.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <h2 className="font-bold flex items-center gap-2 text-base">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />{' '}
                {tMissions('details.route')}
              </h2>
              <div className="text-xs sm:text-sm space-y-2 sm:space-y-3">
                <div>
                  <div className="font-medium mb-1">{tMissions('departure')}</div>
                  <p className="text-muted-foreground break-words">
                    {mission.adresseDepart?.label || tCommon('notSpecified')}
                  </p>
                </div>
                <div>
                  <div className="font-medium mb-1">{tMissions('arrival')}</div>
                  <p className="text-muted-foreground break-words">
                    {mission.adresseArrivee?.label || tCommon('notSpecified')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h2 className="font-bold flex items-center gap-2 text-base">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />{' '}
                {tMissions('details.dates')}
              </h2>
              <div className="text-xs sm:text-sm space-y-2 sm:space-y-3">
                <div>
                  <span className="font-medium block sm:inline">
                    {tMissions('details.estimatedDeparture')}:
                  </span>{' '}
                  <span className="text-muted-foreground">
                    {mission.dateDepartEstime
                      ? new Date(mission.dateDepartEstime).toLocaleDateString()
                      : tCommon('notDefined')}
                  </span>
                </div>
                <div>
                  <span className="font-medium block sm:inline">
                    {tMissions('details.expectedArrival')}:
                  </span>{' '}
                  <span className="text-muted-foreground">
                    {mission.dateArriveePrevue
                      ? new Date(mission.dateArriveePrevue).toLocaleDateString()
                      : tCommon('notDefined')}
                  </span>
                </div>
                {mission.status === 'completed' && (
                  <div>
                    <span className="font-medium block sm:inline">{tMissions('completedOn')}:</span>{' '}
                    <span className="text-muted-foreground">
                      {mission.updatedAt
                        ? new Date(mission.updatedAt).toLocaleDateString()
                        : tCommon('notDefined')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h2 className="font-bold flex items-center gap-2 text-base">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> {tMissions('budget')}
              </h2>
              <div className="text-xs sm:text-sm space-y-2 sm:space-y-3">
                <div>
                  <span className="font-medium block sm:inline">{tMissions('budget')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.budgetMin?.toLocaleString() || 'N/A'} FCFA
                  </span>
                </div>
                <div>
                  <span className="font-medium block sm:inline">{tForms('labels.weight')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.poids ? `${mission.poids} t` : tCommon('notSpecified')}
                  </span>
                </div>
                <div>
                  <span className="font-medium block sm:inline">{tForms('labels.volume')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.volume ? `${mission.volume} m³` : tCommon('notSpecified')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mission participants section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-3 sm:pt-4 border-t">
            {affreteurName && (
              <div className="space-y-2">
                <h2 className="font-bold text-base">{tCommon('roles.affreteur')}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  {affreteurName ||
                    mission.affreteur?.fullName ||
                    `${mission.affreteur?.firstName} ${mission.affreteur?.lastName}` ||
                    tCommon('status.notAssigned')}
                </p>
              </div>
            )}

            {transporteurName && (
              <div className="space-y-2">
                <h2 className="font-bold text-base">{tCommon('roles.transporteur')}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  {transporteurName ||
                    mission.transporteur?.fullName ||
                    `${mission.transporteur?.firstName} ${mission.transporteur?.lastName}` ||
                    tCommon('status.notAssigned')}
                </p>
              </div>
            )}

            {vehicleRegistration && (
              <div className="space-y-2">
                <h2 className="font-bold text-base">{tMissions('details.vehicle')}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  {vehicleRegistration}
                </p>
              </div>
            )}
          </div>

          {mission.notesComplementaires && (
            <div>
              <h2 className="font-bold flex items-center gap-2 text-base">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />{' '}
                {tMissions('details.additionalNotes')}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {mission.notesComplementaires}
              </p>
            </div>
          )}

          {mission.documents && mission.documents.length > 0 && (
            <div>
              <h2 className="font-bold text-base">{tMissions('details.documents')}</h2>
              <div className="flex flex-wrap gap-2">
                {mission.documents.map((doc, index) => (
                  <a
                    key={index}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border dark:border-gray-800 rounded-md hover:bg-accent transition-colors"
                  >
                    {tMissions('details.document')} {index + 1}
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

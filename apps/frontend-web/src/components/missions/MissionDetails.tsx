import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Calendar, DollarSign, Info, AlertTriangle } from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { Button } from '../ui/button';
import { getStatusColor } from '@/lib/mission-utils';
import { getStatusLabel } from '@/lib/mission-utils';
import { toast } from 'sonner';
import { useMissions } from '@/hooks/useMissions';
import { useState, useEffect } from 'react';
import {
  useMissionsTranslation,
  useCommonTranslation,
  useFormsTranslation,
} from '@/hooks/useTranslation';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useVehicleInfo } from '@/hooks/useVehicleInfo';
import { useAuth } from '@/hooks/useAuth';

interface MissionDetailsProps {
  mission: Mission;
}

export function MissionDetails({ mission }: MissionDetailsProps) {
  const { deleteMission, error } = useMissions();
  const { user } = useAuth();
  const { getUserName } = useUserSearch();
  const { getVehicleRegistration } = useVehicleInfo();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transporteurName, setTransporteurName] = useState<string>('');
  const [affreteurName, setAffreteurName] = useState<string>('');
  const [vehicleRegistration, setVehicleRegistration] = useState<string>('');
  const { t: tCommon } = useCommonTranslation();
  const { t: tForms } = useFormsTranslation();
  const { t: tMissions } = useMissionsTranslation();

  // Fetch user names and vehicle info (only if not preloaded)
  useEffect(() => {
    const fetchInfo = async () => {
      // Use preloaded transporteur data first, fallback to fetch
      if (user?.role === 'affreteur' && mission.transporteurId) {
        if (mission.transporteur) {
          const name = `${mission.transporteur.firstName} ${mission.transporteur.lastName}`;
          setTransporteurName(name);
        } else {
          const name = await getUserName(mission.transporteurId);
          setTransporteurName(name);
        }
      }

      // Use preloaded affreteur data first, fallback to fetch
      if (user?.role === 'transporteur' && mission.affreteurId) {
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
          const registration = await getVehicleRegistration(mission.vehicleId);
          setVehicleRegistration(registration);
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
    getVehicleRegistration,
  ]);

  const handleDelete = async (id: string) => {
    setIsLoading(true);

    toast.loading(tMissions('actions.deletingMission'), {
      duration: 30000,
    });

    await deleteMission(id);

    toast.dismiss();

    setIsLoading(false);

    if (error) {
      toast.error(error || tCommon('error.generic'));
      return;
    }

    toast.success(tMissions('actions.success.delete'));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl flex flex-1 justify-between sm:flex-row sm:items-center gap-2">
                <p className="truncate flex flex-col">
                  {mission.title}
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                    {mission.id}
                  </p>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(mission.status)}>
                    {getStatusLabel(mission.status, tCommon)}
                  </Badge>
                </div>
              </CardTitle>
              {mission.typeMarchandise && (
                <Badge variant="outline" className="text-xs">
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
              <h3 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />{' '}
                {tMissions('details.route')}
              </h3>
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
              <h3 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />{' '}
                {tMissions('details.dates')}
              </h3>
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
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> {tMissions('budget')}
              </h3>
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
                    {mission.poids ? `${mission.poids} kg` : tCommon('notSpecified')}
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
                <h3 className="font-medium text-sm sm:text-base">{tCommon('roles.affreteur')}</h3>
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
                <h3 className="font-medium text-sm sm:text-base">
                  {tCommon('roles.transporteur')}
                </h3>
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
                <h3 className="font-medium text-sm sm:text-base">{tMissions('details.vehicle')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  {vehicleRegistration}
                </p>
              </div>
            )}
          </div>

          {mission.notesComplementaires && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />{' '}
                {tMissions('details.additionalNotes')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {mission.notesComplementaires}
              </p>
            </div>
          )}

          {mission.documents && mission.documents.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 text-sm sm:text-base">
                {tMissions('details.documents')}
              </h3>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogDescription className="hidden">{tCommon('actions.delete')}</DialogDescription>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {tMissions('actions.delete')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <p className="text-xs sm:text-sm">
              {tCommon('actions.warning.confirmAction')}{' '}
              {tMissions('actions.confirmDelete', { mission: mission.title })}
            </p>

            <div className="bg-red-50 text-red-700 p-2 sm:p-3 rounded-md text-xs sm:text-sm">
              <p className="font-medium">{tCommon('actions.warning.irreversible')}</p>
              <p>{tMissions('actions.warning')}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(mission.id)}
              className="text-white w-full sm:w-auto text-xs sm:text-sm"
              disabled={isLoading}
            >
              {isLoading ? tMissions('actions.deleting') : tCommon('actions.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Link } from 'react-router-dom';
import { getStatusColor } from '@/lib/mission-utils';
import { getStatusLabel } from '@/lib/mission-utils';
import { toast } from 'sonner';
import { useMissions } from '@/hooks/useMissions';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import {
  useMissionsTranslation,
  useCommonTranslation,
  useFormsTranslation,
} from '@/hooks/useTranslation';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useVehicleInfo } from '@/hooks/useVehicleInfo';

interface MissionDetailsProps {
  mission: Mission;
}

export function MissionDetails({ mission }: MissionDetailsProps) {
  const { user } = useAuth();
  const { deleteMission, error } = useMissions();
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

  // Fetch user names and vehicle info
  useEffect(() => {
    const fetchInfo = async () => {
      if (mission.transporteurId) {
        const name = await getUserName(mission.transporteurId);
        setTransporteurName(name);
      }

      if (mission.affreteurId) {
        const name = await getUserName(mission.affreteurId);
        setAffreteurName(name);
      }

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {mission.title}
                <Badge className={getStatusColor(mission.status)}>
                  {getStatusLabel(mission.status, tCommon)}
                </Badge>
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
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                #{mission.id} • {mission.typeMarchandise || tMissions('details.typeNotSpecified')}
              </p>
            </div>
            {user?.role !== 'transporteur' && (
              <div className="space-x-4">
                <Link to={`/app/missions/${mission.id}/edit`}>
                  <Button variant="outline">{tCommon('actions.edit')}</Button>
                </Link>
                <Button
                  variant="destructive"
                  className="text-white"
                  onClick={() => setIsDialogOpen(true)}
                >
                  {tCommon('actions.delete')}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mission.description && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" /> {tForms('labels.description')}
              </h3>
              <p className="text-sm text-muted-foreground">{mission.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {tMissions('details.route')}
              </h3>
              <div className="text-sm space-y-1">
                <div className="font-medium">{tMissions('departure')}</div>
                <p className="text-muted-foreground">
                  {mission.adresseDepart?.label || tCommon('notSpecified')}
                </p>
                <div className="font-medium mt-2">{tMissions('arrival')}</div>
                <p className="text-muted-foreground">
                  {mission.adresseArrivee?.label || tCommon('notSpecified')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {tMissions('details.dates')}
              </h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">{tMissions('details.estimatedDeparture')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.dateDepartEstime
                      ? new Date(mission.dateDepartEstime).toLocaleDateString()
                      : tCommon('notDefined')}
                  </span>
                </div>
                <div>
                  <span className="font-medium">{tMissions('details.expectedArrival')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.dateArriveePrevue
                      ? new Date(mission.dateArriveePrevue).toLocaleDateString()
                      : tCommon('notDefined')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> {tMissions('budget')}
              </h3>
              <div className="text-sm">
                <div>
                  <span className="font-medium">{tMissions('budget')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.budgetMin?.toLocaleString() || 'N/A'} -{' '}
                    {mission.budgetMax?.toLocaleString() || 'N/A'} FCFA
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-medium">{tMissions('details.cargoType')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.typeMarchandise || tCommon('notSpecified')}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-medium">{tForms('labels.weight')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.poids ? `${mission.poids} kg` : tCommon('notSpecified')}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-medium">{tForms('labels.volume')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.volume ? `${mission.volume} m³` : tCommon('notSpecified')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mission participants section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <h3 className="font-medium">{tCommon('roles.affreteur')}</h3>
              <p className="text-sm text-muted-foreground">
                {affreteurName ||
                  mission.affreteur?.fullName ||
                  `${mission.affreteur?.firstName} ${mission.affreteur?.lastName}` ||
                  tCommon('status.notAssigned')}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">{tCommon('roles.transporteur')}</h3>
              <p className="text-sm text-muted-foreground">
                {transporteurName ||
                  mission.transporteur?.fullName ||
                  `${mission.transporteur?.firstName} ${mission.transporteur?.lastName}` ||
                  tCommon('status.notAssigned')}
              </p>
              {vehicleRegistration && (
                <div className="mt-1">
                  <span className="text-xs text-gray-500">Véhicule: </span>
                  <span className="text-xs font-medium">{vehicleRegistration}</span>
                </div>
              )}
            </div>
          </div>

          {mission.notesComplementaires && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> {tMissions('details.additionalNotes')}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {mission.notesComplementaires}
              </p>
            </div>
          )}

          {mission.documents && mission.documents.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">{tMissions('details.documents')}</h3>
              <div className="flex flex-wrap gap-2">
                {mission.documents.map((doc, index) => (
                  <a
                    key={index}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-accent"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tMissions('actions.delete')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p>
              {tCommon('actions.warning.confirmAction')}{' '}
              {tMissions('actions.confirmDelete', { mission: mission.title })}
            </p>

            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              <p className="font-medium">{tCommon('actions.warning.irreversible')}</p>
              <p>{tMissions('actions.warning')}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(mission.id)}
              className="text-white"
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

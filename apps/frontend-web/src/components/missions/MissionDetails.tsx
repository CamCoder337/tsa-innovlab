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
import toast from 'react-hot-toast';
import { useMissions } from '@/hooks/useMissions';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useMissionsTranslation, useCommonTranslation } from '@/hooks/useTranslation';

interface MissionDetailsProps {
  mission: Mission;
}

export function MissionDetails({ mission }: MissionDetailsProps) {
  const { user } = useAuth();
  const { deleteMission, error } = useMissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();

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

    toast.success(tMissions('actions.deleteSuccess'));
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
                  {getStatusLabel(mission.status, tMissions)}
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
                  <Button variant="outline">{tMissions('actions.edit')}</Button>
                </Link>
                <Button
                  variant="destructive"
                  className="text-white"
                  onClick={() => setIsDialogOpen(true)}
                >
                  {tMissions('actions.delete')}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mission.description && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" /> {tMissions('details.description')}
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
                <div className="font-medium">{tMissions('details.departure')}</div>
                <p className="text-muted-foreground">
                  {mission.adresseDepart?.label || tCommon('notSpecified')}
                </p>
                <div className="font-medium mt-2">{tMissions('details.arrival')}</div>
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
                <DollarSign className="h-4 w-4" /> {tMissions('details.budget')}
              </h3>
              <div className="text-sm">
                <div>
                  <span className="font-medium">{tMissions('details.budget')}:</span>{' '}
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
                  <span className="font-medium">{tMissions('details.weight')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.poids ? `${mission.poids} kg` : tCommon('notSpecified')}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-medium">{tMissions('details.volume')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {mission.volume ? `${mission.volume} m³` : tCommon('notSpecified')}
                  </span>
                </div>
              </div>
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
        <DialogDescription className="hidden">{tMissions('actions.delete')}</DialogDescription>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tMissions('actions.delete')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p>{tMissions('actions.deleteConfirmation')}</p>

            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              <p className="font-medium">{tCommon('warning.irreversible')}</p>
              <p>{tMissions('actions.deleteWarning')}</p>
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

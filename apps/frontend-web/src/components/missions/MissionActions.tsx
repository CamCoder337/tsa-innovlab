import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Send, X, Check, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Mission, MissionStatus } from '@/types/mission.types';
import { useMissionsTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import { useVehicles } from '@/hooks/useVehicles';
import { VehicleTypeLabels } from '@/types/vehicle.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface MissionActionsProps {
  mission: Mission;
  userRole?: string;
  onApply?: (selectedVehicleId: string) => void;
  onUpdate?: (status: MissionStatus, comment?: string) => Promise<void>;
  onStatusUpdate?: (status: MissionStatus) => Promise<void>;
  onRefresh: () => void;
}

export function MissionActions({
  mission,
  userRole,
  onApply,
  onUpdate,
  onStatusUpdate,
  onRefresh,
}: MissionActionsProps) {
  const navigate = useNavigate();
  const { availableVehicles, isLoading: vehiclesLoading } = useVehicles();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [action, setAction] = useState<{ type: string; title: string } | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = (type: string, title: string) => {
    setAction({ type, title });
    setComment('');
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!action) return;

    setIsLoading(true);
    try {
      switch (action.type) {
        case 'apply':
          await onApply?.(selectedVehicleId);
          break;
        case 'start':
          await onStatusUpdate?.('in_progress');
          break;
        default:
          await onUpdate?.(action.type as MissionStatus, comment || undefined);
      }
      toast.success(tMissions(`actions.success.${action.type}`));
      setIsDialogOpen(false);
      setIsApplyDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error(tMissions(`actions.errors.actionFailed`));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusActions = () => {
    const getCommonActions = () => {
      return (
        <>
          <DropdownMenuItem onClick={() => navigate(`/missions/${mission.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>{tCommon('actions.edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleAction('delete', tMissions('actions.deleteMission'))}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{tCommon('actions.delete')}</span>
          </DropdownMenuItem>
        </>
      );
    };

    if (userRole !== 'transporteur') {
      switch (mission.status) {
        case 'draft':
          return (
            <>
              <DropdownMenuItem
                onClick={() => handleAction('publish', tMissions('actions.publishMission'))}
              >
                <Send className="mr-2 h-4 w-4" />
                <span>{tCommon('actions.publish')}</span>
              </DropdownMenuItem>
              {getCommonActions()}
            </>
          );
        case 'published':
        case 'assigned':
          return (
            <>
              {getCommonActions()}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleAction('cancel', tMissions('actions.cancelMission'))}
              >
                <X className="mr-2 h-4 w-4" />
                <span>{tCommon('actions.cancel')}</span>
              </DropdownMenuItem>
            </>
          );
        default:
          return null;
      }
    }

    if (userRole === 'transporteur') {
      return (
        <>
          {mission.status === 'published' && (
            <DropdownMenuItem onClick={() => setIsApplyDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              <span>{tMissions('myMissions.transporteur.apply.dialogTitle')}</span>
            </DropdownMenuItem>
          )}

          {mission.status === 'assigned' && (
            <DropdownMenuItem
              onClick={() => handleAction('start', tMissions('actions.startMission'))}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>{tMissions('actions.start')}</span>
            </DropdownMenuItem>
          )}

          {mission.status === 'in_progress' && (
            <DropdownMenuItem
              onClick={() => handleAction('complete', tMissions('actions.markAsCompleted'))}
            >
              <Check className="mr-2 h-4 w-4" />
              <span>{tMissions('actions.complete')}</span>
            </DropdownMenuItem>
          )}

          {!['published', 'completed'].includes(mission.status) && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleAction('cancel', tMissions('actions.cancelMission'))}
            >
              <X className="mr-2 h-4 w-4" />
              <span>{tCommon('actions.cancel')}</span>
            </DropdownMenuItem>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRefresh()}
          className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
        >
          <RefreshCw
            className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          <span className="hidden sm:inline">{tCommon('actions.refresh')}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-auto">
            {getStatusActions()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="hidden">
            {mission.status === 'draft' ? tCommon('actions.publish') : action?.title}
          </DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{action?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <p className="text-xs sm:text-sm">
              {tCommon('actions.warning.confirmAction')} {action?.title.toLowerCase()} ?
            </p>

            {(action?.type === 'cancel' || action?.type === 'complete') && (
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-xs sm:text-sm">
                  {action.type === 'cancel'
                    ? tMissions('actions.cancellationReason')
                    : tMissions('actions.optionalComment')}
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    action.type === 'cancel'
                      ? tMissions('actions.whyCancelMission')
                      : tMissions('actions.addMissionDetails')
                  }
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>
            )}

            {action?.type === 'delete' && (
              <div className="bg-red-50 text-red-700 p-2 sm:p-3 rounded-md text-xs sm:text-sm">
                <p className="font-medium">{tMissions('actions.warningIrreversible')}</p>
                <p>{tMissions('actions.missionDataWillBeDeleted')}</p>
              </div>
            )}
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
              variant={action?.type === 'delete' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={isLoading}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {isLoading ? tCommon('messages.processing') : tCommon('actions.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Selection Dialog */}
      <Dialog
        open={isApplyDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVehicleId('');
          }
          setIsApplyDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogDescription className="hidden">
            {tMissions('myMissions.transporteur.apply.dialogDescription')}
          </DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {tMissions('myMissions.transporteur.apply.dialogTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {mission && (
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                  {mission.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {mission.description}
                </p>
                {mission.requiredVehicleType && (
                  <p className="text-xs sm:text-sm text-tsa-blue mt-2">
                    {tMissions('myMissions.transporteur.apply.requiredVehicleType')}{' '}
                    {VehicleTypeLabels[mission.requiredVehicleType]}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {tMissions('myMissions.transporteur.apply.selectVehicle')}
              </label>
              {vehiclesLoading ? (
                <div className="flex items-center justify-center p-3 sm:p-4">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 border dark:border-gray-800-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                    {tMissions('myMissions.transporteur.apply.loadingVehicles')}
                  </span>
                </div>
              ) : availableVehicles.length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-gray-600 dark:text-gray-300 bg-yellow-50 rounded-lg">
                  <p className="text-xs sm:text-sm">
                    {tMissions('myMissions.transporteur.apply.noVehiclesAvailable')}
                  </p>
                  <p className="text-xs mt-1">
                    {tMissions('myMissions.transporteur.apply.noVehiclesMessage')}
                  </p>
                </div>
              ) : (
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue
                      placeholder={tMissions('myMissions.transporteur.apply.chooseVehicle')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-xs sm:text-sm font-medium">
                            {vehicle.registration}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({VehicleTypeLabels[vehicle.type]})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsApplyDialogOpen(false);
                  setSelectedVehicleId('');
                }}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button
                onClick={() => {
                  setAction({
                    type: 'apply',
                    title: tMissions('myMissions.transporteur.apply.dialogTitle'),
                  });
                  confirmAction();
                }}
                disabled={!selectedVehicleId || availableVehicles.length === 0}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {tCommon('actions.apply')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

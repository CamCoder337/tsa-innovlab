import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Send, X, Check, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Mission, MissionStatus } from '@/types/mission.types';
import { useMissionsTranslation, useCommonTranslation } from '@/hooks/useTranslation';

interface MissionActionsProps {
  mission: Mission;
  userRole?: string;
  onStatusUpdate: (status: MissionStatus, comment?: string) => Promise<void>;
  onRefresh: () => void;
}

export function MissionActions({
  mission,
  userRole,
  onStatusUpdate,
  onRefresh,
}: MissionActionsProps) {
  const navigate = useNavigate();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<{ type: string; title: string } | null>(null);
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
      await onStatusUpdate(action.type as MissionStatus, comment || undefined);
      toast.success(tMissions(`actions.success.${action.type}`));
      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error(tMissions(`actions.errors.${action.type}`));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusActions = () => {
    if (userRole === 'admin') {
      return (
        <>
          <DropdownMenuItem onClick={() => navigate(`/missions/${mission.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>{tCommon('edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleAction('delete', tMissions('actions.deleteMission'))}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{tCommon('delete')}</span>
          </DropdownMenuItem>
        </>
      );
    }

    if (userRole === 'affreteur') {
      switch (mission.status) {
        case 'draft':
          return (
            <DropdownMenuItem
              onClick={() => handleAction('publish', tMissions('actions.publishMission'))}
            >
              <Send className="mr-2 h-4 w-4" />
              <span>{tMissions('actions.publish')}</span>
            </DropdownMenuItem>
          );
        case 'published':
          return (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleAction('cancel', tMissions('actions.cancelMission'))}
            >
              <X className="mr-2 h-4 w-4" />
              <span>{tCommon('cancel')}</span>
            </DropdownMenuItem>
          );
        case 'assigned':
          return (
            <>
              <DropdownMenuItem
                onClick={() => handleAction('complete', tMissions('actions.markAsCompleted'))}
              >
                <Check className="mr-2 h-4 w-4" />
                <span>{tMissions('actions.complete')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleAction('cancel', tMissions('actions.cancelMission'))}
              >
                <X className="mr-2 h-4 w-4" />
                <span>{tCommon('cancel')}</span>
              </DropdownMenuItem>
            </>
          );
        default:
          return null;
      }
    }

    if (userRole === 'transporteur') {
      if (mission.status === 'published') {
        return (
          <DropdownMenuItem onClick={() => navigate(`/missions/${mission.id}/propose`)}>
            <Send className="mr-2 h-4 w-4" />
            <span>{tMissions('actions.makeOffer')}</span>
          </DropdownMenuItem>
        );
      }

      if (mission.status === 'assigned') {
        return (
          <>
            <DropdownMenuItem
              onClick={() => handleAction('in_progress', tMissions('actions.startMission'))}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>{tMissions('actions.start')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAction('complete', tMissions('actions.markAsCompleted'))}
            >
              <Check className="mr-2 h-4 w-4" />
              <span>{tMissions('actions.complete')}</span>
            </DropdownMenuItem>
          </>
        );
      }
    }

    return null;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onRefresh()} className="h-8">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {tCommon('refresh')}
        </Button>

        {mission.status === 'draft' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('publish', tMissions('actions.publishMission'))}
            className="h-8 bg-tsa-blue text-white"
          >
            <Send className="mr-2 h-4 w-4" />
            <span>{tMissions('actions.publish')}</span>
          </Button>
        )}

        {mission.status !== 'draft' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">{tCommon('actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">{getStatusActions()}</DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p>
              {tMissions('actions.confirmAction')} {action?.title.toLowerCase()} ?
            </p>

            {(action?.type === 'cancel' || action?.type === 'complete') && (
              <div className="space-y-2">
                <Label htmlFor="comment">
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
                />
              </div>
            )}

            {action?.type === 'delete' && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                <p className="font-medium">{tMissions('actions.warningIrreversible')}</p>
                <p>{tMissions('actions.missionDataWillBeDeleted')}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant={action?.type === 'delete' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={isLoading}
            >
              {isLoading ? tCommon('processing') : tCommon('confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

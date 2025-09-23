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
      toast.success(`Mission ${getActionVerb(action.type)} successfully`);
      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error(`Failed to ${action.type.toLowerCase()} mission`);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionVerb = (actionType: string) => {
    switch (actionType) {
      case 'publish':
        return 'published';
      case 'cancel':
        return 'cancelled';
      case 'complete':
        return 'completed';
      default:
        return actionType + 'ed';
    }
  };

  const getStatusActions = () => {
    if (userRole === 'admin') {
      return (
        <>
          <DropdownMenuItem onClick={() => navigate(`/missions/${mission.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Modifier</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleAction('delete', 'Supprimer la mission')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Supprimer</span>
          </DropdownMenuItem>
        </>
      );
    }

    if (userRole === 'affreteur') {
      switch (mission.status) {
        case 'draft':
          return (
            <DropdownMenuItem onClick={() => handleAction('publish', 'Publier la mission')}>
              <Send className="mr-2 h-4 w-4" />
              <span>Publier</span>
            </DropdownMenuItem>
          );
        case 'published':
          return (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleAction('cancel', 'Annuler la mission')}
            >
              <X className="mr-2 h-4 w-4" />
              <span>Annuler</span>
            </DropdownMenuItem>
          );
        case 'assigned':
          return (
            <>
              <DropdownMenuItem onClick={() => handleAction('complete', 'Marquer comme terminée')}>
                <Check className="mr-2 h-4 w-4" />
                <span>Terminer</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleAction('cancel', 'Annuler la mission')}
              >
                <X className="mr-2 h-4 w-4" />
                <span>Annuler</span>
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
            <span>Faire une offre</span>
          </DropdownMenuItem>
        );
      }

      if (mission.status === 'assigned') {
        return (
          <>
            <DropdownMenuItem onClick={() => handleAction('in_progress', 'Démarrer la mission')}>
              <Clock className="mr-2 h-4 w-4" />
              <span>Démarrer</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('complete', 'Marquer comme terminée')}>
              <Check className="mr-2 h-4 w-4" />
              <span>Terminer</span>
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
          Actualiser
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">{getStatusActions()}</DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p>Êtes-vous sûr de vouloir {action?.title.toLowerCase()} ?</p>

            {(action?.type === 'cancel' || action?.type === 'complete') && (
              <div className="space-y-2">
                <Label htmlFor="comment">
                  {action.type === 'cancel'
                    ? "Raison de l'annulation (optionnel)"
                    : 'Commentaire (optionnel)'}
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    action.type === 'cancel'
                      ? 'Pourquoi annulez-vous cette mission ?'
                      : 'Ajoutez des détails sur la mission...'
                  }
                  rows={3}
                />
              </div>
            )}

            {action?.type === 'delete' && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                <p className="font-medium">Attention : Cette action est irréversible</p>
                <p>La mission et toutes les données associées seront définitivement supprimées.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              variant={action?.type === 'delete' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={isLoading}
            >
              {isLoading ? 'Traitement...' : 'Confirmer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from 'react';
import { CheckCircle, DollarSign, Lock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import missionTrackingService from '@/services/mission-tracking.service';

interface MissionPaymentActionsProps {
  missionId: string;
  missionStatus: string;
  budgetMin?: number;
  budgetMax?: number;
  onStatusChange?: () => void;
}

export default function MissionPaymentActions({
  missionId,
  missionStatus,
  budgetMin,
  budgetMax,
  onStatusChange,
}: MissionPaymentActionsProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'pay' | 'complete' | null>(null);

  const handleMarkAsPaid = async () => {
    setLoading(true);
    setAction('pay');
    try {
      await missionTrackingService.markAsPaid(missionId);
      toast.success('Mission marquée comme payée', {
        description: 'Le transporteur en a été notifié',
      });
      onStatusChange?.();
    } catch (error: unknown) {
      toast.error('Erreur lors du marquage comme payé', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleCompleteMission = async () => {
    setLoading(true);
    setAction('complete');
    try {
      await missionTrackingService.completeMission(missionId);
      toast.success('Mission clôturée avec succès', {
        description: 'La mission a été archivée',
      });
      onStatusChange?.();
    } catch (error: unknown) {
      toast.error('Erreur lors de la clôture de la mission', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const formatBudget = () => {
    if (budgetMin && budgetMax) {
      return `${budgetMin.toLocaleString('fr-FR')} - ${budgetMax.toLocaleString('fr-FR')} FCFA`;
    } else if (budgetMin) {
      return `${budgetMin.toLocaleString('fr-FR')} FCFA`;
    } else if (budgetMax) {
      return `Jusqu'à ${budgetMax.toLocaleString('fr-FR')} FCFA`;
    }
    return 'Non spécifié';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Paiement et Clôture
        </CardTitle>
        <CardDescription>Gérez le paiement et la clôture de la mission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget de la mission */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Budget de la mission</p>
              <p className="text-2xl font-bold">{formatBudget()}</p>
            </div>
            <Badge variant="outline" className="text-lg">
              {missionStatus === 'delivered' && 'En attente de paiement'}
              {missionStatus === 'paid' && 'Payée'}
              {missionStatus === 'completed' && 'Clôturée'}
              {!['delivered', 'paid', 'completed'].includes(missionStatus) && 'Non finalisée'}
            </Badge>
          </div>
        </div>

        {/* Action : Marquer comme payé */}
        {missionStatus === 'delivered' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" size="lg" disabled={loading}>
                <DollarSign className="mr-2 h-4 w-4" />
                Confirmer le Paiement
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de confirmer que le transporteur a été payé pour cette
                  mission.
                  <br />
                  <br />
                  <strong>Montant : {formatBudget()}</strong>
                  <br />
                  <br />
                  Cette action marquera la mission comme "Payée" et permettra ensuite de la clôturer
                  définitivement.
                  <br />
                  <br />
                  Êtes-vous sûr de vouloir continuer ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAsPaid} disabled={loading && action === 'pay'}>
                  {loading && action === 'pay' ? 'Traitement...' : 'Confirmer le paiement'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Action : Clôturer la mission */}
        {missionStatus === 'paid' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" size="lg" variant="default" disabled={loading}>
                <Lock className="mr-2 h-4 w-4" />
                Clôturer la Mission
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clôturer définitivement la mission</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de clôturer définitivement cette mission.
                  <br />
                  <br />
                  <strong>Cette action est irréversible.</strong>
                  <br />
                  <br />
                  Une fois clôturée, la mission sera archivée et aucune modification ne sera plus
                  possible. Le tracking GPS sera également arrêté.
                  <br />
                  <br />
                  Assurez-vous que :
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>La livraison a été effectuée</li>
                    <li>Le paiement a été confirmé</li>
                    <li>Tous les documents sont en ordre</li>
                  </ul>
                  <br />
                  Êtes-vous sûr de vouloir continuer ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCompleteMission}
                  disabled={loading && action === 'complete'}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading && action === 'complete' ? 'Traitement...' : 'Clôturer définitivement'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Statut completed */}
        {missionStatus === 'completed' && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="space-y-1">
              <p className="font-semibold">Mission Clôturée</p>
              <p className="text-sm text-muted-foreground">
                Cette mission a été clôturée et archivée avec succès.
              </p>
            </div>
          </div>
        )}

        {/* Info si pas encore livrée */}
        {!['delivered', 'paid', 'completed'].includes(missionStatus) && (
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              La mission doit d'abord être livrée (statut "Delivered") avant de pouvoir être payée
              et clôturée.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-medium">Processus de clôture :</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>Le chauffeur scanne le QR code pour valider la livraison</li>
            <li>La mission passe au statut "Delivered"</li>
            <li>Vous confirmez le paiement (statut "Paid")</li>
            <li>Vous clôturez définitivement la mission (statut "Completed")</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Order } from '@/types/order.types';
import { formatCurrency } from '@/lib/utils';

interface RefundOrderModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const RefundOrderModal = ({
  order,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RefundOrderModalProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Veuillez fournir une raison pour le remboursement');
      return;
    }

    if (reason.trim().length < 10) {
      setError('La raison doit contenir au moins 10 caractères');
      return;
    }

    setError('');
    await onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onOpenChange(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rembourser la commande</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de rembourser la commande {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cette action remboursera le montant total de{' '}
              <strong>{formatCurrency(Number(order.total) || 0)}</strong> et annulera la commande.
              Le stock des produits sera restitué.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Raison du remboursement <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Expliquez la raison du remboursement (minimum 10 caractères)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground">{reason.length}/1000 caractères</p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <h4 className="font-semibold">Informations de la commande</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">
                  {order.user?.firstName} {order.user?.lastName}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.user?.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Montant</p>
                <p className="font-medium">{formatCurrency(Number(order.total) || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Articles</p>
                <p className="font-medium">{order.items?.length || 0} article(s)</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} variant="destructive">
            {isLoading ? 'Remboursement en cours...' : 'Confirmer le remboursement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

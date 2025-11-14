import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Order, OrderStatus, PaymentStatus } from '@/types/order.types';
import { formatCurrency } from '@/lib/utils';
import { Package, MapPin, CreditCard, User, Calendar, FileText } from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getPaymentStatusColor = (status: PaymentStatus): string => {
  const colors: Record<PaymentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'En attente',
    paid: 'Payée',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
  };
  return labels[status] || status;
};

const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    pending: 'En attente',
    completed: 'Complété',
    failed: 'Échoué',
    refunded: 'Remboursé',
  };
  return labels[status] || status;
};

export const OrderDetailsModal = ({ order, open, onOpenChange }: OrderDetailsModalProps) => {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails de la commande {order.orderNumber}</span>
            <div className="flex gap-2">
              <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
              <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                {getPaymentStatusLabel(order.paymentStatus)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Informations client */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold mb-3">
                <User className="h-4 w-4" />
                Informations client
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom</p>
                  <p className="font-medium">
                    {order.user?.firstName} {order.user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{order.user?.email}</p>
                </div>
                {order.user?.phone && (
                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{order.user.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Date de commande</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Adresse de livraison */}
            {order.shippingAddress && (
              <>
                <div>
                  <h3 className="flex items-center gap-2 font-semibold mb-3">
                    <MapPin className="h-4 w-4" />
                    Adresse de livraison
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Articles */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold mb-3">
                <Package className="h-4 w-4" />
                Articles ({order.items?.length || 0})
              </h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b pb-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantité: {item.quantity} × {formatCurrency(parseFloat(item.unitPrice))}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(
                        parseFloat(item.totalPrice || item.unitPrice) * item.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.total) || 0)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Informations de paiement */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold mb-3">
                <CreditCard className="h-4 w-4" />
                Paiement
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Méthode</p>
                  <p className="font-medium">{order.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                    {getPaymentStatusLabel(order.paymentStatus)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="flex items-center gap-2 font-semibold mb-3">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </div>
              </>
            )}

            {/* Dates importantes */}
            <Separator />
            <div>
              <h3 className="flex items-center gap-2 font-semibold mb-3">
                <Calendar className="h-4 w-4" />
                Historique
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créée le</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {/* {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payée le</span>
                    <span>
                      {new Date(order.paidAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expédiée le</span>
                    <span>
                      {new Date(order.shippedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livrée le</span>
                    <span>
                      {new Date(order.deliveredAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annulée le</span>
                    <span>
                      {new Date(order.cancelledAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

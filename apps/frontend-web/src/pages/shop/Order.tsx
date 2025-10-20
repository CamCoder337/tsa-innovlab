import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import {
  ArrowLeft,
  CheckCircle,
  Download,
  MapPin,
  Package,
  Truck,
  XCircle,
  Clock,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatus, type Order } from '@/types/order.types';

const statusConfig = {
  [OrderStatus.PENDING]: {
    label: 'En attente',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    description: 'Commande en attente de paiement',
    icon: Clock,
    step: 1,
  },
  [OrderStatus.PAID]: {
    label: 'Payée',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Paiement confirmé',
    icon: CreditCard,
    step: 2,
  },
  [OrderStatus.PROCESSING]: {
    label: 'En préparation',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Commande en cours de préparation',
    icon: Package,
    step: 3,
  },
  [OrderStatus.SHIPPED]: {
    label: 'Expédiée',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Commande expédiée',
    icon: Truck,
    step: 4,
  },
  [OrderStatus.DELIVERED]: {
    label: 'Livrée',
    color: 'bg-green-50 text-green-700 border-green-200',
    description: 'Commande livrée avec succès',
    icon: CheckCircle,
    step: 5,
  },
  [OrderStatus.CANCELLED]: {
    label: 'Annulée',
    color: 'bg-red-50 text-red-700 border-red-200',
    description: 'Commande annulée',
    icon: XCircle,
    step: -1,
  },
  [OrderStatus.REFUNDED]: {
    label: 'Remboursée',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Commande remboursée',
    icon: RefreshCw,
    step: -1,
  },
};

interface TimelineStep {
  status: OrderStatus;
  date: string;
  completed: boolean;
  title: string;
  description: string;
}

const getOrderTimeline = (order: Order): TimelineStep[] => {
  const timeline: TimelineStep[] = [];

  if (order.createdAt) {
    timeline.push({
      status: OrderStatus.PENDING,
      date: order.createdAt,
      completed: true,
      title: 'Commande créée',
      description: 'Votre commande a été enregistrée',
    });
  }

  if (order.paidAt) {
    timeline.push({
      status: OrderStatus.PAID,
      date: order.paidAt,
      completed: true,
      title: 'Paiement confirmé',
      description: 'Votre paiement a été traité avec succès',
    });
  }

  if (order.status === OrderStatus.PROCESSING && order.updatedAt) {
    timeline.push({
      status: OrderStatus.PROCESSING,
      date: order.updatedAt!, // Safe because we check for existence above
      completed: true,
      title: 'En préparation',
      description: 'Votre commande est en cours de préparation',
    });
  }

  if (order.shippedAt) {
    timeline.push({
      status: OrderStatus.SHIPPED,
      date: order.shippedAt,
      completed: true,
      title: 'Commande expédiée',
      description: order.trackingNumber
        ? `Numéro de suivi: ${order.trackingNumber}`
        : 'Votre commande a été expédiée',
    });
  }

  if (order.deliveredAt) {
    timeline.push({
      status: OrderStatus.DELIVERED,
      date: order.deliveredAt,
      completed: true,
      title: 'Commande livrée',
      description: 'Votre commande a été livrée avec succès',
    });
  }

  if (order.cancelledAt) {
    timeline.push({
      status: OrderStatus.CANCELLED,
      date: order.cancelledAt,
      completed: true,
      title: 'Commande annulée',
      description: order.notes || 'Votre commande a été annulée',
    });
  }

  return timeline
    .filter((item): item is TimelineStep => Boolean(item.date)) // Remove items without dates
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default function OrderDetailsPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const { currentOrder, isLoading, fetchOrder } = useOrders();

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const order = currentOrder;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-1/3"></div>
          <div className="h-64 bg-zinc-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Commande introuvable</h1>
            <p className="text-zinc-600 mb-6">
              Cette commande n'existe pas ou vous n'y avez pas accès
            </p>
            <Button asChild>
              <Link to="/app/shop/orders">Voir mes commandes</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const statusInfo = statusConfig[order.status];
  const timeline = getOrderTimeline(order);
  const StatusIcon = statusInfo.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-600 mb-4">
          <Link
            to="/app/shop/orders"
            className="flex items-center gap-1 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Mes commandes
          </Link>
          <span>/</span>
          <span>Commande {order.orderNumber}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Commande {order.orderNumber}</h1>
            <div className="flex items-center gap-4 text-sm text-zinc-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Commandé le{' '}
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              className={`${statusInfo.color} border flex items-center gap-2 px-3 py-2 text-sm`}
            >
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </Badge>
            {order.trackingNumber && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => order.trackingNumber && copyToClipboard(order.trackingNumber)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copier suivi
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Suivi de commande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((step, index) => {
                  const StepIcon = statusConfig[step.status].icon;
                  const isLast = index === timeline.length - 1;

                  return (
                    <div key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            step.completed
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                          }`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-8 mt-2 ${
                              step.completed ? 'bg-green-200' : 'bg-zinc-200'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-zinc-900">{step.title}</h3>
                          <span className="text-sm text-zinc-500">
                            {step.date &&
                              new Date(step.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Articles commandés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles commandés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    {item.productImageUrl && (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName || 'Product'}
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900">{item.productName}</h3>
                      <p className="text-sm text-zinc-600 mb-1">Réf: {item.productReference}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-zinc-600">
                          Quantité: <span className="font-medium">{item.quantity}</span>
                        </span>
                        <span className="text-zinc-600">
                          Prix unitaire:{' '}
                          <span className="font-medium">
                            {parseFloat(item.unitPrice).toLocaleString('fr-FR')} FCFA
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-zinc-900">
                        {parseFloat(item.subtotal).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informations de livraison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Informations de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-zinc-500" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">Adresse de livraison</p>
                  <p className="text-sm text-zinc-600 mt-1">
                    {order.shippingAddress?.label ||
                      `${order.customerName}, ${order.customerPhone}`}
                  </p>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Numéro de suivi</p>
                    <p className="text-sm text-blue-700 font-mono">{order.trackingNumber}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => order.trackingNumber && copyToClipboard(order.trackingNumber)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {order.notes && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 text-zinc-500" />
                  <div>
                    <p className="font-medium text-zinc-900">Instructions de livraison</p>
                    <p className="text-sm text-zinc-600 mt-1">{order.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Résumé financier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Résumé de la commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Sous-total</span>
                  <span className="font-medium">
                    {parseFloat(order.subtotal).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Frais de livraison</span>
                  <span className="font-medium">
                    {parseFloat(order.shippingCost).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Taxes</span>
                  <span className="font-medium">
                    {parseFloat(order.tax).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{parseFloat(order.total).toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              {order.paymentMethod && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <CreditCard className="h-4 w-4" />
                    <span>Méthode de paiement: </span>
                    <span className="font-medium capitalize">
                      {order.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                  {order.paymentReference && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Référence: {order.paymentReference}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-600">Nom:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-600">{order.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-600">{order.customerPhone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.REFUNDED && (
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Télécharger la facture
              </Button>
            )}

            {order.trackingNumber && (
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Suivre le colis
              </Button>
            )}

            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link to="/app/shop">Continuer mes achats</Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link to="/app/shop/orders">Retour aux commandes</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

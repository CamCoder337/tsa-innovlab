import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { type TFunction } from 'i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
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
import { useShopTranslation } from '@/hooks/useTranslation';

// Status config will be created dynamically using translations

interface TimelineStep {
  status: OrderStatus;
  date: string;
  completed: boolean;
  title: string;
  description: string;
}

const getOrderTimeline = (order: Order, tShop: TFunction): TimelineStep[] => {
  const timeline: TimelineStep[] = [];

  if (order.createdAt) {
    timeline.push({
      status: OrderStatus.PENDING,
      date: order.createdAt,
      completed: true,
      title: tShop('orderDetails.timeline.created.title'),
      description: tShop('orderDetails.timeline.created.description'),
    });
  }

  if (order.paidAt) {
    timeline.push({
      status: OrderStatus.PAID,
      date: order.paidAt,
      completed: true,
      title: tShop('orderDetails.timeline.paid.title'),
      description: tShop('orderDetails.timeline.paid.description'),
    });
  }

  if (order.status === OrderStatus.PROCESSING && order.updatedAt) {
    timeline.push({
      status: OrderStatus.PROCESSING,
      date: order.updatedAt!, // Safe because we check for existence above
      completed: true,
      title: tShop('orderDetails.timeline.processing.title'),
      description: tShop('orderDetails.timeline.processing.description'),
    });
  }

  if (order.shippedAt) {
    timeline.push({
      status: OrderStatus.SHIPPED,
      date: order.shippedAt,
      completed: true,
      title: tShop('orderDetails.timeline.shipped.title'),
      description: order.trackingNumber
        ? tShop('orderDetails.timeline.shipped.descriptionWithTracking', {
            trackingNumber: order.trackingNumber,
          })
        : tShop('orderDetails.timeline.shipped.description'),
    });
  }

  if (order.deliveredAt) {
    timeline.push({
      status: OrderStatus.DELIVERED,
      date: order.deliveredAt,
      completed: true,
      title: tShop('orderDetails.timeline.delivered.title'),
      description: tShop('orderDetails.timeline.delivered.description'),
    });
  }

  if (order.cancelledAt) {
    timeline.push({
      status: OrderStatus.CANCELLED,
      date: order.cancelledAt,
      completed: true,
      title: tShop('orderDetails.timeline.cancelled.title'),
      description: order.notes || tShop('orderDetails.timeline.cancelled.description'),
    });
  }

  return timeline
    .filter((item): item is TimelineStep => Boolean(item.date)) // Remove items without dates
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default function OrderDetailsPage() {
  const { t: tShop } = useShopTranslation();
  const { id: orderId } = useParams<{ id: string }>();
  const { currentOrder, isLoading, fetchOrder } = useOrders();

  // Create status config with translations
  const statusConfig = {
    [OrderStatus.PENDING]: {
      label: tShop('orders.status.pending.label'),
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      description: tShop('orders.status.pending.description'),
      icon: Clock,
      step: 1,
    },
    [OrderStatus.PAID]: {
      label: tShop('orders.status.paid.label'),
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      description: tShop('orders.status.paid.description'),
      icon: CreditCard,
      step: 2,
    },
    [OrderStatus.PROCESSING]: {
      label: tShop('orders.status.processing.label'),
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: tShop('orders.status.processing.description'),
      icon: Package,
      step: 3,
    },
    [OrderStatus.SHIPPED]: {
      label: tShop('orders.status.shipped.label'),
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      description: tShop('orders.status.shipped.description'),
      icon: Truck,
      step: 4,
    },
    [OrderStatus.DELIVERED]: {
      label: tShop('orders.status.delivered.label'),
      color: 'bg-green-50 text-green-700 border-green-200',
      description: tShop('orders.status.delivered.description'),
      icon: CheckCircle,
      step: 5,
    },
    [OrderStatus.CANCELLED]: {
      label: tShop('orders.status.cancelled.label'),
      color: 'bg-red-50 text-red-700 border-red-200',
      description: tShop('orders.status.cancelled.description'),
      icon: XCircle,
      step: -1,
    },
    [OrderStatus.REFUNDED]: {
      label: tShop('orders.status.refunded.label'),
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      description: tShop('orders.status.refunded.description'),
      icon: RefreshCw,
      step: -1,
    },
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const order = currentOrder;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-8 py-6 sm:py-10">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="h-6 sm:h-8 bg-zinc-200 rounded w-1/3"></div>
          <div className="h-48 sm:h-64 bg-zinc-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-8 py-6 sm:py-10">
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">
              {tShop('orderDetails.notFound.title')}
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 mb-4 sm:mb-6">
              {tShop('orderDetails.notFound.message')}
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/app/shop/orders">{tShop('orderDetails.notFound.viewOrders')}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Debug: Log order status if not found in config
  if (!statusConfig[order.status]) {
    console.warn('Unknown order status:', order.status, 'Order:', order);
  }

  // Fallback to PENDING if status is not found in config
  const statusInfo = statusConfig[order.status] || statusConfig[OrderStatus.PENDING];
  const timeline = getOrderTimeline(order, tShop);
  const StatusIcon = statusInfo.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Breadcrumb & Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-4">
          <Link
            to="/app/shop/orders"
            className="flex items-center gap-1 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{tShop('orderDetails.breadcrumb.myOrders')}</span>
          </Link>
          <span>/</span>
          <span className="truncate">
            {tShop('orderDetails.breadcrumb.order', { number: order.orderNumber })}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 mb-2 truncate">
              {tShop('orderDetails.title', { number: order.orderNumber })}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-zinc-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  {tShop('orderDetails.orderedOn')}{' '}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                {(order.items?.length || 0) === 1
                  ? tShop('orderDetails.itemCount', { count: order.items?.length || 0 })
                  : tShop('orderDetails.itemCountPlural', { count: order.items?.length || 0 })}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Badge
              className={`${statusInfo.color} border flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm justify-center`}
            >
              <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{statusInfo.label}</span>
            </Badge>
            {order.trackingNumber && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => order.trackingNumber && copyToClipboard(order.trackingNumber)}
                className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{tShop('orderDetails.copyTracking')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Order Timeline */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                {tShop('orderDetails.orderTracking')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {timeline.map((step, index) => {
                  const StepIcon = statusConfig[step.status].icon;
                  const isLast = index === timeline.length - 1;

                  return (
                    <div key={step.status} className="flex gap-3 sm:gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                            step.completed
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                          }`}
                        >
                          <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-6 sm:h-8 mt-2 ${
                              step.completed ? 'bg-green-200' : 'bg-zinc-200'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-6 sm:pb-8 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <h3 className="font-medium text-zinc-900 text-sm sm:text-base truncate">
                            {step.title}
                          </h3>
                          <span className="text-xs sm:text-sm text-zinc-500 flex-shrink-0">
                            {step.date &&
                              new Date(step.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Articles commandés */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                {tShop('orderDetails.orderedItems')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border dark:border-gray-800 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    {item.productImageUrl && (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName || 'Product'}
                        className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover border dark:border-gray-800 flex-shrink-0 mx-auto sm:mx-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="font-semibold text-zinc-900 text-sm sm:text-base truncate">
                        {item.productName}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-600 mb-1 truncate">
                        {tShop('orderDetails.reference')}: {item.productReference}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-zinc-600">
                          {tShop('orderDetails.quantity')}:{' '}
                          <span className="font-medium">{item.quantity}</span>
                        </span>
                        <span className="text-zinc-600">
                          {tShop('orderDetails.unitPrice')}:{' '}
                          <span className="font-medium">
                            {item.unitPrice ? parseFloat(item.unitPrice).toLocaleString('fr-FR') : '0'} FCFA
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right w-full sm:w-auto">
                      <div className="font-semibold text-base sm:text-lg text-zinc-900">
                        {item.totalPrice
                          ? parseFloat(item.totalPrice).toLocaleString('fr-FR')
                          : item.subtotal
                            ? parseFloat(item.subtotal).toLocaleString('fr-FR')
                            : item.unitPrice
                              ? (parseFloat(item.unitPrice) * item.quantity).toLocaleString('fr-FR')
                              : '0'}{' '}
                        FCFA
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informations de livraison */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                {tShop('orderDetails.deliveryInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-zinc-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 text-sm sm:text-base">
                    {tShop('orderDetails.deliveryAddress')}
                  </p>
                  <p className="text-xs sm:text-sm text-zinc-600 mt-1 break-words">
                    {order.shippingAddress?.label ||
                      `${order.customerName}, ${order.customerPhone}`}
                  </p>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-900 text-sm sm:text-base">
                      {tShop('orderDetails.trackingNumber')}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-700 font-mono break-all">
                      {order.trackingNumber}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => order.trackingNumber && copyToClipboard(order.trackingNumber)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-100 flex-shrink-0"
                  >
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              )}

              {order.notes && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-zinc-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 text-sm sm:text-base">
                      {tShop('orderDetails.deliveryInstructions')}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1 break-words">
                      {order.notes}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Résumé financier */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                {tShop('orderDetails.orderSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-base sm:text-lg font-semibold">
                  <span>{tShop('orderDetails.total')}</span>
                  <span>{parseFloat(order.totalAmount).toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              {order.paymentMethod && (
                <div className="pt-3 sm:pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-600">
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{tShop('orderDetails.paymentMethod')}: </span>
                    <span className="font-medium capitalize truncate">
                      {order.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                  {order.paymentReference && (
                    <p className="text-xs text-zinc-500 mt-1 break-all">
                      {tShop('orderDetails.paymentReference')}: {order.paymentReference}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                {tShop('orderDetails.customerInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-zinc-600">{tShop('orderDetails.name')}:</span>
                <span className="font-medium truncate">
                  {order.user?.firstName && order.user?.lastName
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-500 flex-shrink-0" />
                <span className="text-zinc-600 truncate">{order.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-500 flex-shrink-0" />
                <span className="text-zinc-600">{order.user?.phone || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2 sm:space-y-3">
            {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.REFUNDED && (
              <Button variant="outline" className="w-full text-xs sm:text-sm">
                <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tShop('orderDetails.downloadInvoice')}</span>
              </Button>
            )}

            {order.trackingNumber && (
              <Button variant="outline" className="w-full text-xs sm:text-sm">
                <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tShop('orderDetails.trackPackage')}</span>
              </Button>
            )}

            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
              <Link to="/app/shop">
                <span>{tShop('orderDetails.continueShopping')}</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full text-xs sm:text-sm">
              <Link to="/app/shop/orders">
                <span>{tShop('orderDetails.backToOrders')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

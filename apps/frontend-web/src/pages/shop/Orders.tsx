import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Loader2,
  Package,
  Calendar,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatus } from '@/types/order.types';
import { useShopTranslation } from '@/hooks/useTranslation';

// Status config will be created dynamically using translations

export default function OrdersPage() {
  const { t } = useShopTranslation();
  const { orders, isLoading, error, fetchOrders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Create status config with translations
  const statusConfig = {
    [OrderStatus.PENDING]: {
      label: t('orders.status.pending.label'),
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: Clock,
      description: t('orders.status.pending.description'),
    },
    [OrderStatus.PAID]: {
      label: t('orders.status.paid.label'),
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: CreditCard,
      description: t('orders.status.paid.description'),
    },
    [OrderStatus.PROCESSING]: {
      label: t('orders.status.processing.label'),
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Package,
      description: t('orders.status.processing.description'),
    },
    [OrderStatus.SHIPPED]: {
      label: t('orders.status.shipped.label'),
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Truck,
      description: t('orders.status.shipped.description'),
    },
    [OrderStatus.DELIVERED]: {
      label: t('orders.status.delivered.label'),
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle2,
      description: t('orders.status.delivered.description'),
    },
    [OrderStatus.CANCELLED]: {
      label: t('orders.status.cancelled.label'),
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
      description: t('orders.status.cancelled.description'),
    },
    [OrderStatus.REFUNDED]: {
      label: t('orders.status.refunded.label'),
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: RefreshCw,
      description: t('orders.status.refunded.description'),
    },
  };

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some((item) =>
          item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'total':
          comparison = parseFloat(a.total) - parseFloat(b.total);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [orders, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleRefresh = () => {
    fetchOrders();
  };

  if (isLoading && !error) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">{t('orders.title')}</h1>
            <p className="text-zinc-600 mt-1">{t('orders.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('orders.refresh')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder={t('orders.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('orders.search.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('orders.search.allStatuses')}</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-') as [
                    typeof sortBy,
                    typeof sortOrder,
                  ];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('orders.search.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">{t('orders.search.newest')}</SelectItem>
                  <SelectItem value="date-asc">{t('orders.search.oldest')}</SelectItem>
                  <SelectItem value="total-desc">{t('orders.search.amountDesc')}</SelectItem>
                  <SelectItem value="total-asc">{t('orders.search.amountAsc')}</SelectItem>
                  <SelectItem value="status-asc">{t('orders.search.statusAZ')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {filteredAndSortedOrders.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-zinc-600">
            {filteredAndSortedOrders.length === 1
              ? t('orders.results.found', { count: filteredAndSortedOrders.length })
              : t('orders.results.foundPlural', { count: filteredAndSortedOrders.length })}
            {searchTerm && ` ${t('orders.results.forSearch', { term: searchTerm })}`}
            {statusFilter !== 'all' &&
              ` ${t('orders.results.withStatus', { status: statusConfig[statusFilter as OrderStatus]?.label })}`}
          </p>
        </div>
      )}

      {/* Orders List */}
      {filteredAndSortedOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 text-zinc-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              {orders.length === 0 ? t('orders.empty.noOrders') : t('orders.empty.noResults')}
            </h3>
            <p className="text-zinc-600 mb-6 max-w-md mx-auto">
              {orders.length === 0
                ? t('orders.empty.noOrdersMessage')
                : t('orders.empty.noResultsMessage')}
            </p>
            {orders.length === 0 && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link to="/app/shop">{t('orders.empty.discoverProducts')}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedOrders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow duration-200">
                <Link to={`/app/shop/order/${order.id}`} className="block">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg font-semibold">
                            {t('orders.order.number', { number: order.orderNumber })}
                          </CardTitle>
                          <Badge
                            className={`${statusInfo.color} border flex items-center gap-1.5 px-2.5 py-1`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </span>
                          <span className="font-semibold text-zinc-900">
                            {parseFloat(order.total).toLocaleString('fr-FR')} FCFA
                          </span>
                          {order.items && (
                            <span className="text-zinc-500">
                              {order.items.length === 1
                                ? t('orders.order.items', { count: order.items.length })
                                : t('orders.order.itemsPlural', { count: order.items.length })}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-zinc-600 border-t pt-4">
                          <span>{t('orders.order.orderedItems')}</span>
                        </div>
                        <div className="space-y-2">
                          {order.items.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-3">
                                {item.productImageUrl && (
                                  <img
                                    src={item.productImageUrl}
                                    alt={item.productName || 'Product'}
                                    className="h-10 w-10 rounded-md object-cover border"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-zinc-900">{item.productName}</p>
                                  <p className="text-zinc-500 text-xs">{item.productReference}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {item.quantity} ×{' '}
                                  {parseFloat(item.unitPrice).toLocaleString('fr-FR')} FCFA
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {parseFloat(item.subtotal).toLocaleString('fr-FR')} FCFA
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-zinc-500 text-center py-2">
                              {order.items.length - 2 === 1
                                ? t('orders.order.moreItems', { count: order.items.length - 2 })
                                : t('orders.order.moreItemsPlural', {
                                    count: order.items.length - 2,
                                  })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delivery Status */}
                    {(order.deliveredAt || order.shippedAt || order.trackingNumber) && (
                      <div className="flex items-center gap-2 text-sm text-zinc-600 mt-4 pt-4 border-t">
                        <MapPin className="h-4 w-4" />
                        {order.deliveredAt ? (
                          <span>
                            {t('orders.order.deliveredOn', {
                              date: new Date(order.deliveredAt).toLocaleDateString('fr-FR'),
                            })}
                          </span>
                        ) : order.shippedAt ? (
                          <span>
                            {t('orders.order.shippedOn', {
                              date: new Date(order.shippedAt).toLocaleDateString('fr-FR'),
                            })}
                          </span>
                        ) : order.trackingNumber ? (
                          <span>
                            {t('orders.order.trackingNumber', { number: order.trackingNumber })}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

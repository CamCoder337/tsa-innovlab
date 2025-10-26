import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Package,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useAllAdminStats } from '@/hooks/useAdminStats';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { getOrderStatusColor, getOrderStatusLabel } from '@/lib/order-utils';
import { OrderStatus, PaymentStatus } from '@/types/order.types';
import { useAdminTranslation } from '@/hooks/useTranslation';

export default function OrdersManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const { t } = useAdminTranslation();

  // Hooks
  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    fetchOrder,
    updateOrderStatus,
    cancelOrder,
    clearError,
  } = useOrders();

  const allStats = useAllAdminStats();

  // Filter orders based on search and filters
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Handle order status update
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    // Implementation for bulk actions
    console.log('Bulk action:', action, 'on orders:', selectedOrders);
  };

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total), 0),
    averageOrderValue:
      orders.length > 0
        ? orders.reduce((sum, order) => sum + parseFloat(order.total), 0) / orders.length
        : 0,
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('orders.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('orders.title')}</h1>
        <p className="text-gray-600">{t('orders.subtitle')}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview">{t('orders.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="orders">{t('orders.tabs.allOrders')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('orders.tabs.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-tsa-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('orders.stats.totalOrders')}</p>
                    <p className="text-2xl font-bold">{orderStats.total.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('orders.stats.totalRevenue')}</p>
                    <p className="text-2xl font-bold">{formatCurrency(orderStats.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('orders.stats.averageBasket')}</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(orderStats.averageOrderValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {getOrderStatusLabel(OrderStatus.PENDING)}
                    </p>
                    <p className="text-2xl font-bold">{orderStats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('orders.stats.orderStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
                      <p className="text-sm text-gray-600">{t('orders.stats.pending')}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-tsa-blue">{orderStats.processing}</p>
                      <p className="text-sm text-gray-600">{t('orders.stats.processing')}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{orderStats.shipped}</p>
                      <p className="text-sm text-gray-600">{t('orders.stats.shipped')}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
                      <p className="text-sm text-gray-600">{t('orders.stats.delivered')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('orders.stats.recentOrders')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {order.user?.firstName} {order.user?.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(parseFloat(order.total))}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`${getOrderStatusColor(order.status)} text-white`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('orders.filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('orders.filters.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('orders.filters.allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('orders.status.pending')}</SelectItem>
                  <SelectItem value="paid">{t('orders.status.paid')}</SelectItem>
                  <SelectItem value="processing">{t('orders.status.processing')}</SelectItem>
                  <SelectItem value="shipped">{t('orders.status.shipped')}</SelectItem>
                  <SelectItem value="delivered">{t('orders.status.delivered')}</SelectItem>
                  <SelectItem value="cancelled">{t('orders.status.cancelled')}</SelectItem>
                  <SelectItem value="refunded">{t('orders.status.refunded')}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={paymentFilter}
                onValueChange={(value) => setPaymentFilter(value as PaymentStatus | 'all')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('orders.filters.filterByPayment')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('orders.filters.allPayments')}</SelectItem>
                  <SelectItem value="pending">{t('orders.payment.pending')}</SelectItem>
                  <SelectItem value="completed">{t('orders.payment.completed')}</SelectItem>
                  <SelectItem value="failed">{t('orders.payment.failed')}</SelectItem>
                  <SelectItem value="refunded">{t('orders.payment.refunded')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchOrders()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('orders.actions.refresh')}
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('orders.actions.export')}
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                {t('orders.actions.bulkSelected', { count: selectedOrders.length })}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                  {t('orders.actions.export')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('update_status')}
                >
                  {t('orders.actions.updateStatus')}
                </Button>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedOrders.length === filteredOrders.length &&
                          filteredOrders.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(filteredOrders.map((o) => o.id));
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>{t('orders.table.number')}</TableHead>
                    <TableHead>{t('orders.table.client')}</TableHead>
                    <TableHead>{t('orders.table.date')}</TableHead>
                    <TableHead>{t('orders.table.amount')}</TableHead>
                    <TableHead>{t('orders.table.status')}</TableHead>
                    <TableHead>{t('orders.table.payment')}</TableHead>
                    <TableHead className="text-right">{t('orders.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <Link to={`/app/shop/orders/${order.id}`}>
                      <TableRow key={order.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders([...selectedOrders, order.id]);
                              } else {
                                setSelectedOrders(selectedOrders.filter((id) => id !== order.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.user?.firstName} {order.user?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{order.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt!)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(parseFloat(order.total))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${getOrderStatusColor(order.status)} text-white`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}
                          >
                            {order.paymentStatus === 'pending' && t('orders.payment.pending')}
                            {order.paymentStatus === 'completed' && t('orders.payment.completed')}
                            {order.paymentStatus === 'failed' && t('orders.payment.failed')}
                            {order.paymentStatus === 'refunded' && t('orders.payment.refunded')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('orders.actions.actions')}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => fetchOrder(order.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('orders.actions.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.PROCESSING)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('orders.actions.markProcessing')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.SHIPPED)}
                              >
                                <Truck className="mr-2 h-4 w-4" />
                                {t('orders.actions.markShipped')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.DELIVERED)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('orders.actions.markDelivered')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('orders.actions.cancelOrder')}
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t('orders.dialog.cancelTitle')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('orders.dialog.cancelDescription')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t('orders.dialog.cancel')}
                                    </AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancelOrder(order.id)}>
                                      {t('orders.dialog.confirmCancel')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </Link>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('orders.empty')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('orders.analytics.performanceMetrics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t('orders.analytics.conversionRate')}
                    </span>
                    <span className="font-medium">
                      {allStats.overview.stats?.conversion.total.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t('orders.analytics.averageBasket')}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(allStats.overview.stats?.averageBasket.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t('orders.analytics.ordersToday')}
                    </span>
                    <span className="font-medium">
                      {allStats.overview.stats?.orders.byPeriod.today || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t('orders.analytics.revenueThisMonth')}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(allStats.overview.stats?.revenue.last30Days || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('orders.analytics.topProducts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allStats.overview.stats?.topProducts?.slice(0, 5).map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-tsa-blue">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.productName}</p>
                          <p className="text-xs text-gray-500">
                            {product.quantitySold} {t('orders.analytics.sold')}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">{formatCurrency(product.revenue)}</p>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">
                      {t('orders.analytics.noDataAvailable')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

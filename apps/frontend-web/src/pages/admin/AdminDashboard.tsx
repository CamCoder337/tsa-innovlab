import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  Star,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import { useAllAdminStats } from '@/hooks/useAdminStats';
import { getStatusLabel } from '@/lib/utils';
import { useAdminTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/lib/utils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useProducts } from '@/hooks/useProducts';
import { useUsers } from '@/hooks/useUsers';

export default function AdminDashboard() {
  const allStats = useAllAdminStats();
  const { setCurrentProduct, getProductById } = useProducts();
  const { setSelectedUser, getUserById } = useUsers();
  const { t: tAdmin } = useAdminTranslation();
  const { t: tCommon } = useCommonTranslation();

  // Show loading state
  if (allStats.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tsa-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tAdmin('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {tAdmin('dashboard.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          {tAdmin('dashboard.overview.subtitle')}
        </p>
      </div>

      {/* Quick Stats - Top 5 Most Important Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <Link to="/app/users">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tAdmin('dashboard.overview.totalUsers')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {allStats.overview.stats?.quickStats.totalUsers.toLocaleString() ||
                      allStats.users.stats?.total.toLocaleString() ||
                      0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card>
          <Link to="/app/missions">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tAdmin('dashboard.overview.totalMissions')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {allStats.overview.stats?.quickStats.totalMissions.toLocaleString() ||
                      allStats.missions.stats?.total.toLocaleString() ||
                      0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card>
          <Link to="/app/products">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tAdmin('dashboard.overview.totalProducts')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {allStats.overview.stats?.quickStats.totalProducts.toLocaleString() ||
                      allStats.products.stats?.total.toLocaleString() ||
                      0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card>
          <Link to="/app/orders">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tAdmin('dashboard.overview.totalOrders') || 'Total Commandes'}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {allStats.overview.stats?.orders.total || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card>
          <Link to="">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tAdmin('dashboard.overview.totalRevenue')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {formatCurrency(allStats.overview.stats?.revenue.total || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Top Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              {tAdmin('dashboard.labels.topShipper')}s
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {allStats.missions.stats?.topAffreteurs?.slice(0, 5).map((item) => (
                <Link to={`/app/user/${item.userId}`} key={item.userId}>
                  <div
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-950 rounded-lg"
                    onClick={() => {
                      const selectedUser = getUserById(item.userId);
                      setSelectedUser(selectedUser!);
                    }}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium text-xs sm:text-sm truncate">{item.userName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.missionCount} {tAdmin('dashboard.labels.missions')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {tAdmin('dashboard.labels.topShipper')}
                    </Badge>
                  </div>
                </Link>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  {tAdmin('dashboard.labels.recent')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              {tAdmin('dashboard.labels.topCarrier')}s
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {allStats.missions.stats?.topTransporteurs?.slice(0, 5).map((item) => (
                <Link to={`/app/user/${item.userId}`} key={item.userId}>
                  <div
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-950 rounded-lg"
                    onClick={() => {
                      const selectedUser = getUserById(item.userId);
                      setSelectedUser(selectedUser!);
                    }}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium text-xs sm:text-sm truncate">{item.userName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.missionCount} {tAdmin('dashboard.labels.missions')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {tAdmin('dashboard.labels.topCarrier')}
                    </Badge>
                  </div>
                </Link>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  {tAdmin('dashboard.labels.recent')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              {tAdmin('dashboard.labels.topProduct')}s
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {allStats.overview.stats?.topProducts?.slice(0, 5).map((item) => (
                <Link to={`/app/products/${item.productId}`} key={item.productId}>
                  <div
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-950 rounded-lg"
                    onClick={() => {
                      const selectedProduct = getProductById(item.productId);
                      setCurrentProduct(selectedProduct!);
                    }}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium text-xs sm:text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.quantitySold} {tAdmin('dashboard.overview.sold') || 'vendus'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {item.revenue} FCFA
                    </Badge>
                  </div>
                </Link>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  {tAdmin('dashboard.labels.recent')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Row 1: Revenue & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              {tAdmin('dashboard.overview.revenueEvolution') || 'Évolution des Revenus'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={
                  allStats.overview.stats?.revenue.evolution.last30Days.map((value, index) => ({
                    day: allStats.overview.stats?.revenue.evolution.labels[index] || index + 1,
                    revenue: value,
                  })) || []
                }
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    tAdmin('dashboard.overview.totalRevenue') || 'Revenus',
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              {tAdmin('dashboard.overview.ordersByStatus') || 'Commandes par Statut'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: tCommon('status.pending') || 'En attente',
                      value: allStats.overview.stats?.orders.byStatus.pending || 0,
                      color: '#f59e0b',
                    },
                    {
                      name: tCommon('status.paid') || 'Payé',
                      value: allStats.overview.stats?.orders.byStatus.paid || 0,
                      color: '#10b981',
                    },
                    {
                      name: tCommon('status.processing') || 'En traitement',
                      value: allStats.overview.stats?.orders.byStatus.processing || 0,
                      color: '#3b82f6',
                    },
                    {
                      name: tCommon('status.shipped') || 'Expédié',
                      value: allStats.overview.stats?.orders.byStatus.shipped || 0,
                      color: '#8b5cf6',
                    },
                    {
                      name: tCommon('status.delivered') || 'Livré',
                      value: allStats.overview.stats?.orders.byStatus.delivered || 0,
                      color: '#059669',
                    },
                    {
                      name: tCommon('status.cancelled') || 'Annulé',
                      value: allStats.overview.stats?.orders.byStatus.cancelled || 0,
                      color: '#ef4444',
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { color: '#f59e0b' },
                    { color: '#10b981' },
                    { color: '#3b82f6' },
                    { color: '#8b5cf6' },
                    { color: '#059669' },
                    { color: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    value,
                    tAdmin('dashboard.overview.totalOrders') || 'Commandes',
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Row 2: Mission Status & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              {tAdmin('dashboard.missions.statusDistribution') || 'Distribution des Statuts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: getStatusLabel('draft', tCommon),
                      value: allStats.missions.stats?.byStatus.draft || 0,
                      color: '#9ca3af',
                    },
                    {
                      name: getStatusLabel('published', tCommon),
                      value: allStats.missions.stats?.byStatus.published || 0,
                      color: '#f59e0b',
                    },
                    {
                      name: getStatusLabel('assigned', tCommon),
                      value: allStats.missions.stats?.byStatus.assigned || 0,
                      color: '#3b82f6',
                    },
                    {
                      name: getStatusLabel('in_progress', tCommon),
                      value: allStats.missions.stats?.byStatus.in_progress || 0,
                      color: '#8b5cf6',
                    },
                    {
                      name: getStatusLabel('completed', tCommon),
                      value: allStats.missions.stats?.byStatus.completed || 0,
                      color: '#10b981',
                    },
                    {
                      name: getStatusLabel('cancelled', tCommon),
                      value: allStats.missions.stats?.byStatus.cancelled || 0,
                      color: '#ef4444',
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                >
                  {[
                    { color: '#9ca3af' },
                    { color: '#f59e0b' },
                    { color: '#3b82f6' },
                    { color: '#8b5cf6' },
                    { color: '#10b981' },
                    { color: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    value,
                    tAdmin('dashboard.missions.title') || 'Missions',
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              {tAdmin('dashboard.users.userGrowth') || 'Croissance des Utilisateurs'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={
                  allStats.users.stats?.evolution.labels.map((label, index) => ({
                    date: label,
                    users: allStats.users.stats?.evolution.data[index] || 0,
                  })) || []
                }
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number) => [
                    value,
                    tAdmin('dashboard.users.newUsers') || 'Nouveaux utilisateurs',
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Row 3: Products by Category */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            {tAdmin('dashboard.shop.productsByCategory') || 'Produits par Catégorie'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={
                allStats.products.stats?.byCategory.map((cat) => ({
                  name: cat.categoryName,
                  products: cat.productCount,
                  stock: cat.totalStock,
                })) || []
              }
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="products"
                fill="#8b5cf6"
                name={tAdmin('dashboard.shop.products') || 'Produits'}
              />
              <Bar
                dataKey="stock"
                fill="#3b82f6"
                name={tAdmin('dashboard.shop.stock') || 'Stock'}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {tAdmin('dashboard.shop.analytics.conversionRate') || 'Taux de Conversion'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((allStats.overview.stats?.conversion?.total || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {tAdmin('dashboard.shop.analytics.ordersVsVisits') || 'Commandes vs Visites'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {tAdmin('dashboard.shop.analytics.averageBasket') || 'Panier Moyen'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(allStats.overview.stats?.averageBasket?.total || 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {tAdmin('dashboard.shop.analytics.perOrder') || 'Par commande'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {tAdmin('dashboard.missions.completionRate') || 'Taux de Complétion'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((allStats.missions.stats?.completionRate || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {tAdmin('dashboard.missions.title') || 'Missions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {tAdmin('feedbacks.averageRating') || 'Note Moyenne'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {allStats.feedbacks.stats?.averageRating?.toFixed(1) || '0.0'}
              </p>
              <Star className="h-5 w-5 fill-current text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {allStats.feedbacks.stats?.total || 0} {tAdmin('feedbacks.total') || 'avis'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

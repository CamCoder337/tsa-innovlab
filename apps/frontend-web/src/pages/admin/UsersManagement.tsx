'use client';

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Shield,
  Building,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Plus,
  Clock,
  Loader2,
  Eye,
  Edit,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAllAdminStats } from '@/hooks/useAdminStats';
import { useAdminTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import type { UserRole } from '@/types/auth.types';
import type { UserStatus } from '@/types/user.types';
import {
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
  ResponsiveContainer,
} from 'recharts';

export default function AdminUsersPage() {
  const { users, userStats, isLoading, error, fetchUsers, suspendUser, activateUser, deleteUser } =
    useUsers();
  const allStats = useAllAdminStats();
  const { t: tAdmin } = useAdminTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Filter users based on search and filters
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      [user.firstName, user.lastName, user.email, user.phone].some((field) =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats = {
    total: userStats?.total || users?.length,
    active: userStats?.byStatus?.active || users?.filter((u) => u.status === 'active').length,
    pending: userStats?.byStatus?.pending || users?.filter((u) => u.status === 'pending').length,
    suspended:
      userStats?.byStatus?.suspended || users?.filter((u) => u.status === 'suspended').length,
    affreteurs: userStats?.byRole?.affreteur || users?.filter((u) => u.role === 'affreteur').length,
    transporteurs:
      userStats?.byRole?.transporteur || users?.filter((u) => u.role === 'transporteur').length,
  };

  const handleSuspendUser = async (userId: string) => {
    if (window.confirm(tAdmin('users.confirmSuspend'))) {
      await suspendUser(userId, { status: 'suspended', reason: 'Suspended by admin' });
    }
  };

  const handleActivateUser = async (userId: string) => {
    await activateUser(userId, { status: 'active', reason: 'Activated by admin' });
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(tAdmin('users.confirmDelete'))) {
      await deleteUser(userId);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="flex-1 p-6">
          <div className="text-center py-8">
            <p className="text-red-500">
              {tCommon('Error')}: {error}
            </p>
            <Button onClick={() => fetchUsers()} className="mt-4">
              {tCommon('actions.retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'affreteur':
        return <Building className="h-4 w-4" />;
      case 'transporteur':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const formatUserName = (user: { firstName?: string; lastName?: string }) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="flex flex-1 flex-col bg-gray-50 dark:bg-gray-950 p-6">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {tAdmin('users.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{tAdmin('users.subtitle')}</p>
          </div>
          <Link to="/admin/users/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {tAdmin('users.addUser')}
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">
              {tAdmin('users.tabs.overview') || "Vue d'ensemble"}
            </TabsTrigger>
            <TabsTrigger value="users">
              {tAdmin('users.tabs.allUsers') || 'Tous les utilisateurs'}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              {tAdmin('users.tabs.analytics') || 'Analytiques'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats - Top 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-tsa-blue dark:text-tsa-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('users.totalUsers')}
                      </p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('users.activeUsers')}
                      </p>
                      <p className="text-2xl font-bold">{stats.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('users.pendingUsers')}
                      </p>
                      <p className="text-2xl font-bold">{stats.pending}</p>
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
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.users.monthlyGrowth')}
                      </p>
                      <p className="text-2xl font-bold">
                        +{allStats.users.stats?.byPeriod.last30Days || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('dashboard.users.emailVerified') || 'Email Vérifiés'}
                      </p>
                      <p className="text-2xl font-bold">
                        {allStats.users.stats?.emailVerified || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Distribution by Role & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{tAdmin('users.userManagement')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/app/users?role=admin">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                          {allStats.users.stats?.byRole.admin || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tCommon('roles.admin')}s
                        </p>
                      </div>
                    </Link>
                    <Link to="/app/users?role=affreteur">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {allStats.users.stats?.byRole.affreteur || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tCommon('roles.affreteur')}s
                        </p>
                      </div>
                    </Link>
                    <Link to="/app/users?role=transporteur">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {allStats.users.stats?.byRole.transporteur || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tCommon('roles.transporteur')}s
                        </p>
                      </div>
                    </Link>
                    <Link to="/app/users?role=client">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {allStats.users.stats?.byRole.client || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tCommon('roles.client')}s
                        </p>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {tAdmin('users.stats.userActivity') || 'Activité des Utilisateurs'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {allStats.users.stats?.active || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tAdmin('dashboard.users.activeUsers') || 'Utilisateurs Actifs'}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-600">
                          {allStats.users.stats?.inactive || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tAdmin('dashboard.users.inactiveUsers') || 'Utilisateurs Inactifs'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {tAdmin('dashboard.users.newUsersThisMonth')}
                        </span>
                        <span className="font-medium text-green-600">
                          +{allStats.users.stats?.byPeriod.last30Days || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
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
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={tAdmin('users.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as UserStatus | 'all')}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={tAdmin('users.filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tAdmin('users.allStatuses')}</SelectItem>
                      <SelectItem value="active">{tCommon('status.active')}</SelectItem>
                      <SelectItem value="pending">{tCommon('status.pending')}</SelectItem>
                      <SelectItem value="suspended">{tCommon('status.suspended')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={roleFilter}
                    onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={tAdmin('users.filterByRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tAdmin('users.allRoles')}</SelectItem>
                      <SelectItem value="admin">{tCommon('roles.admin')}</SelectItem>
                      <SelectItem value="affreteur">{tCommon('roles.affreteur')}</SelectItem>
                      <SelectItem value="transporteur">{tCommon('roles.transporteur')}</SelectItem>
                      <SelectItem value="client">{tCommon('roles.client')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {tAdmin('users.newUser')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>{tAdmin('users.usersList')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">{tAdmin('users.loadingUsers')}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers?.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:bg-gray-950"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {formatUserName(user)}
                              </h4>
                              <Badge className={getStatusColor(user.status)}>
                                {user.status.toUpperCase()}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                {user.role.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {user.phone}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {tAdmin('users.registeredOn')} {formatDate(user.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link to={`/app/users/${user.id}`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Eye className="h-3 w-3" />
                              {tCommon('actions.view')}
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-3 w-3" />
                            {tCommon('actions.edit')}
                          </Button>
                          {user.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-orange-600 hover:text-orange-700"
                              onClick={() => handleSuspendUser(user.id)}
                              disabled={isLoading}
                            >
                              <UserX className="h-3 w-3" />
                              {tCommon('actions.suspend')}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-green-600 hover:text-green-700"
                              onClick={() => handleActivateUser(user.id)}
                              disabled={isLoading}
                            >
                              <UserCheck className="h-3 w-3" />
                              {tCommon('actions.activate')}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                            {tCommon('actions.delete')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && filteredUsers?.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {tAdmin('users.noUsersFound')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tAdmin('users.stats.verification') || 'Vérification Email & MFA'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        {
                          name: 'Email Vérifiés',
                          value: allStats.users.stats?.emailVerified || 0,
                        },
                        {
                          name: 'Email Non Vérifiés',
                          value: allStats.users.stats?.emailUnverified || 0,
                        },
                        {
                          name: 'MFA Activé',
                          value: allStats.users.stats?.mfaEnabled || 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('users.stats.verificationRate') || 'Taux de Vérification'}
                      </span>
                      <span className="font-medium text-green-600">
                        {allStats.users.stats?.total
                          ? `${Math.round(((allStats.users.stats?.emailVerified || 0) / allStats.users.stats.total) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {tAdmin('users.stats.roleDistribution') || 'Distribution par Rôle'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: tCommon('roles.admin'),
                            value: allStats.users.stats?.byRole.admin || 0,
                            color: '#3b82f6',
                          },
                          {
                            name: tCommon('roles.affreteur'),
                            value: allStats.users.stats?.byRole.affreteur || 0,
                            color: '#10b981',
                          },
                          {
                            name: tCommon('roles.transporteur'),
                            value: allStats.users.stats?.byRole.transporteur || 0,
                            color: '#8b5cf6',
                          },
                          {
                            name: tCommon('roles.client'),
                            value: allStats.users.stats?.byRole.client || 0,
                            color: '#f59e0b',
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                      >
                        {[
                          { color: '#3b82f6' },
                          { color: '#10b981' },
                          { color: '#8b5cf6' },
                          { color: '#f59e0b' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, 'Utilisateurs']}
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
                  <CardTitle>{tAdmin('users.stats.growth') || 'Croissance'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('users.stats.last7Days') || 'Derniers 7 jours'}
                      </span>
                      <span className="font-medium text-green-600">
                        +{allStats.users.stats?.byPeriod.last7Days || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('users.stats.last30Days') || 'Derniers 30 jours'}
                      </span>
                      <span className="font-medium text-green-600">
                        +{allStats.users.stats?.byPeriod.last30Days || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tAdmin('users.stats.total') || 'Total'}
                      </span>
                      <span className="font-medium">{allStats.users.stats?.total || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

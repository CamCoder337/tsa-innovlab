'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAdminTranslation } from '@/hooks/useTranslation';
import type { UserRole } from '@/types/auth.types';
import type { UserStatus } from '@/types/user.types';

export default function AdminUsersPage() {
  const { users, userStats, isLoading, error, fetchUsers, suspendUser, activateUser, deleteUser } =
    useUsers();
  const { t } = useAdminTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Filter users based on search and filters
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      [user.firstName, user.lastName, user.email, user.phone].some((field) =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'affreteurs' && user.role === 'affreteur') ||
      (activeTab === 'transporteurs' && user.role === 'transporteur') ||
      (activeTab === 'admins' && user.role === 'admin');

    return matchesSearch && matchesStatus && matchesRole && matchesTab;
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
    if (window.confirm(t('users.confirmSuspend'))) {
      await suspendUser(userId, { status: 'suspended', reason: 'Suspended by admin' });
    }
  };

  const handleActivateUser = async (userId: string) => {
    await activateUser(userId, { status: 'active', reason: 'Activated by admin' });
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(t('users.confirmDelete'))) {
      await deleteUser(userId);
    }
  };

  // Mock data removed - now using real API data
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50 p-6">
        <div className="flex-1 p-6">
          <div className="text-center py-8">
            <p className="text-red-500">
              {t('users.error')}: {error}
            </p>
            <Button onClick={() => fetchUsers()} className="mt-4">
              {t('users.retry')}
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('users.title')}</h1>
            <p className="text-gray-600 mt-1">{t('users.subtitle')}</p>
          </div>
          <Link to="/admin/users/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('users.addUser')}
            </Button>
          </Link>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-tsa-blue" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('users.totalUsers')}</p>
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
                  <p className="text-sm text-gray-600">{t('users.activeUsers')}</p>
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
                  <p className="text-sm text-gray-600">{t('users.pendingUsers')}</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('users.suspendedUsers')}</p>
                  <p className="text-2xl font-bold">{stats.suspended}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('users.searchPlaceholder')}
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
                  <SelectValue placeholder={t('users.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('users.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('users.active')}</SelectItem>
                  <SelectItem value="pending">{t('users.pending')}</SelectItem>
                  <SelectItem value="suspended">{t('users.suspended')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('users.filterByRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('users.allRoles')}</SelectItem>
                  <SelectItem value="admin">{t('users.administrator')}</SelectItem>
                  <SelectItem value="affreteur">{t('users.shipper')}</SelectItem>
                  <SelectItem value="transporteur">{t('users.carrier')}</SelectItem>
                  <SelectItem value="client">{t('users.client')}</SelectItem>
                </SelectContent>
              </Select>

              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('users.newUser')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              {t('users.all')} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="affreteurs">
              {t('users.shippers')} ({stats.affreteurs})
            </TabsTrigger>
            <TabsTrigger value="transporteurs">
              {t('users.carriers')} ({stats.transporteurs})
            </TabsTrigger>
            <TabsTrigger value="admins">
              {t('users.admins')} ({userStats?.byRole?.admin || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('users.usersList')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">{t('users.loadingUsers')}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers?.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{formatUserName(user)}</h4>
                              <Badge className={getStatusColor(user.status)}>
                                {user.status.toUpperCase()}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                {user.role.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
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

                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {t('users.registeredOn')} {formatDate(user.createdAt)}
                              </div>
                              {user.lastLoginAt && (
                                <span>
                                  {t('users.lastLogin')}: {formatDate(user.lastLoginAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link to={`/app/users/${user.id}`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Eye className="h-3 w-3" />
                              {t('users.view')}
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-3 w-3" />
                            {t('users.edit')}
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
                              {t('users.suspend')}
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
                              {t('users.activate')}
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
                            {t('users.delete')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && filteredUsers?.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('users.noUsersFound')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

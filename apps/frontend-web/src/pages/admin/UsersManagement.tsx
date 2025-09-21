'use client';

import { useState } from 'react';
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
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Building,
  Calendar,
  Eye,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AFFRETEUR' | 'TRANSPORTEUR';
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  company?: string;
  phone?: string;
  createdAt: Date;
  lastLogin?: Date;
  kycStatus: 'pending' | 'approved' | 'rejected';
  totalMissions: number;
  revenue: number;
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Données de démonstration
  const users: User[] = [
    {
      id: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@tsa-logistics.com',
      role: 'ADMIN',
      status: 'active',
      company: 'TSA Logistics',
      phone: '+237 677 123 456',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2025-01-18'),
      kycStatus: 'approved',
      totalMissions: 0,
      revenue: 0,
    },
    {
      id: '2',
      name: 'Marie Fotso',
      email: 'marie.fotso@example.com',
      role: 'AFFRETEUR',
      status: 'active',
      company: 'Fotso Transport SARL',
      phone: '+237 677 234 567',
      createdAt: new Date('2024-02-20'),
      lastLogin: new Date('2025-01-17'),
      kycStatus: 'approved',
      totalMissions: 45,
      revenue: 12500000,
    },
    {
      id: '3',
      name: 'Paul Mbarga',
      email: 'paul.mbarga@example.com',
      role: 'TRANSPORTEUR',
      status: 'active',
      phone: '+237 677 345 678',
      createdAt: new Date('2024-03-10'),
      lastLogin: new Date('2025-01-18'),
      kycStatus: 'approved',
      totalMissions: 38,
      revenue: 8750000,
    },
    {
      id: '4',
      name: 'Fatou Sall',
      email: 'fatou.sall@example.com',
      role: 'AFFRETEUR',
      status: 'pending',
      company: 'Sall Logistics',
      phone: '+237 677 456 789',
      createdAt: new Date('2025-01-10'),
      kycStatus: 'pending',
      totalMissions: 0,
      revenue: 0,
    },
    {
      id: '5',
      name: 'Ibrahim Diallo',
      email: 'ibrahim.diallo@example.com',
      role: 'TRANSPORTEUR',
      status: 'suspended',
      phone: '+237 677 567 890',
      createdAt: new Date('2024-06-15'),
      lastLogin: new Date('2025-01-05'),
      kycStatus: 'rejected',
      totalMissions: 12,
      revenue: 2100000,
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'affreteurs' && user.role === 'AFFRETEUR') ||
      (activeTab === 'transporteurs' && user.role === 'TRANSPORTEUR') ||
      (activeTab === 'admins' && user.role === 'ADMIN');

    return matchesSearch && matchesStatus && matchesRole && matchesTab;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    pending: users.filter((u) => u.status === 'pending').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    affreteurs: users.filter((u) => u.role === 'AFFRETEUR').length,
    transporteurs: users.filter((u) => u.role === 'TRANSPORTEUR').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'AFFRETEUR':
        return <Building className="h-4 w-4" />;
      case 'TRANSPORTEUR':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">
            Gérez les utilisateurs, rôles et permissions de la plateforme
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Utilisateurs</p>
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
                  <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
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
                  <p className="text-sm text-gray-600">En Attente</p>
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
                  <p className="text-sm text-gray-600">Suspendus</p>
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
                  placeholder="Rechercher par nom, email ou entreprise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="AFFRETEUR">Affréteur</SelectItem>
                  <SelectItem value="TRANSPORTEUR">Transporteur</SelectItem>
                </SelectContent>
              </Select>

              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvel Utilisateur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
            <TabsTrigger value="affreteurs">Affréteurs ({stats.affreteurs})</TabsTrigger>
            <TabsTrigger value="transporteurs">Transporteurs ({stats.transporteurs})</TabsTrigger>
            <TabsTrigger value="admins">Admins (1)</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Liste des Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
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
                            <h4 className="font-medium text-gray-900">{user.name}</h4>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status.toUpperCase()}
                            </Badge>
                            <Badge className={getKycStatusColor(user.kycStatus)}>
                              KYC: {user.kycStatus.toUpperCase()}
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
                            {user.company && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {user.company}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Inscrit le {user.createdAt.toLocaleDateString('fr-FR')}
                            </div>
                            {user.lastLogin && (
                              <span>
                                Dernière connexion: {user.lastLogin.toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="font-medium">{user.totalMissions} missions</p>
                          <p className="text-gray-600">{user.revenue.toLocaleString()} FCFA</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                            <Eye className="h-3 w-3" />
                            Voir
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                            <Edit className="h-3 w-3" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-red-600 hover:text-red-700 bg-transparent"
                          >
                            <Trash2 className="h-3 w-3" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun utilisateur trouvé avec ces critères.</p>
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

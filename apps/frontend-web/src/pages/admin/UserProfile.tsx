import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  UserX,
  UserCheck,
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import type { UserStatus } from '@/types/user.types';
import type { UserRole } from '@/types/auth.types';
import toast from 'react-hot-toast';
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

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, isLoading, error, fetchUser, suspendUser, activateUser, deleteUser } =
    useUsers();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
  }, [id, fetchUser]);

  const handleSuspend = async (reason?: string) => {
    if (!currentUser || !id) return;

    try {
      setActionLoading('suspend');
      await suspendUser(id, { status: 'suspended', reason });
      toast.success('Utilisateur suspendu avec succès');
    } catch {
      toast.error("Erreur lors de la suspension de l'utilisateur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (reason?: string) => {
    if (!currentUser || !id) return;

    try {
      setActionLoading('activate');
      await activateUser(id, { status: 'active', reason });
      toast.success('Utilisateur activé avec succès');
    } catch {
      toast.error("Erreur lors de l'activation de l'utilisateur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !id) return;

    try {
      setActionLoading('delete');
      await deleteUser(id);
      toast.success('Utilisateur supprimé avec succès');
      navigate('/admin/users');
    } catch {
      toast.error("Erreur lors de la suppression de l'utilisateur");
      setActionLoading(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'affreteur':
        return <Building className="h-4 w-4" />;
      case 'transporteur':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Suspendu
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Utilisateur introuvable</h2>
        <p className="text-gray-600">L'utilisateur demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const userStats = [
    { label: 'Missions créées', value: currentUser.stats?.totalMissions || 0, icon: BarChart3 },
    { label: 'Propositions', value: currentUser.stats?.totalPropositions || 0, icon: Building },
    { label: 'Commandes', value: currentUser.stats?.totalOrders || 0, icon: Users },
    {
      label: 'Dernière connexion',
      value: currentUser.lastLoginAt ? formatDate(currentUser.lastLoginAt) : 'Jamais',
      icon: Calendar,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil Utilisateur</h1>
            <p className="text-muted-foreground">Détails et statistiques de l'utilisateur</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={`/admin/users/${id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </Link>

          {currentUser.status === 'active' ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-orange-600 hover:text-orange-700">
                  <UserX className="h-4 w-4" />
                  Suspendre
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspendre l'utilisateur</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir suspendre cet utilisateur ? Il ne pourra plus se
                    connecter à la plateforme.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleSuspend}
                    disabled={actionLoading === 'suspend'}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {actionLoading === 'suspend' ? 'Suspension...' : 'Suspendre'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              className="gap-2 text-green-600 hover:text-green-700"
              onClick={() => handleActivate}
              disabled={actionLoading === 'activate'}
            >
              <UserCheck className="h-4 w-4" />
              {actionLoading === 'activate' ? 'Activation...' : 'Activer'}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. L'utilisateur sera définitivement supprimé de la
                  plateforme. Toutes ses données seront anonymisées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={actionLoading === 'delete'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {actionLoading === 'delete' ? 'Suppression...' : 'Supprimer définitivement'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom complet</label>
                  <p className="text-lg font-semibold">
                    {`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div className="mt-1">{getStatusBadge(currentUser.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{currentUser.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{currentUser.phone || 'Non renseigné'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Rôle</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleIcon(currentUser.role)}
                    <Badge variant="outline" className="capitalize">
                      {currentUser.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date d'inscription</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(currentUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* {currentUser.companyName && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Entreprise</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{currentUser.companyName}</p>
                    </div>
                  </div>
                </>
              )} */}
            </CardContent>
          </Card>

          {/* Activity & Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistiques d'Activité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email vérifié</span>
                <Badge variant={currentUser.emailVerifiedAt ? 'default' : 'secondary'}>
                  {currentUser.emailVerifiedAt ? 'Oui' : 'Non'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">2FA activé</span>
                <Badge variant={currentUser.mfaEnabled ? 'default' : 'secondary'}>
                  {currentUser.mfaEnabled ? 'Oui' : 'Non'}
                </Badge>
              </div>
              {currentUser.lastLoginAt && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-gray-600">Dernière connexion</span>
                  <p className="text-sm font-medium">{formatDate(currentUser.lastLoginAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/admin/users/${id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier le profil
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="h-4 w-4" />
                Envoyer un email
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <BarChart3 className="h-4 w-4" />
                Voir l'historique
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

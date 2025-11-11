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
  FileText,
  Download,
  Eye,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import type { UserStatus } from '@/types/user.types';
import type { UserRole } from '@/types/auth.types';
import { toast } from 'sonner';
import {
  useAdminTranslation,
  useCommonTranslation,
  useErrorsTranslation,
} from '@/hooks/useTranslation';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'missing';

interface KYCDocument {
  id: string;
  type: string;
  label: string;
  status: DocumentStatus;
  fileName: string | null;
  fileUrl: string | null;
  uploadDate: string | null;
  validatedAt: string | null;
  validatedBy: string | null;
  rejectionReason: string | null;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedUser, isLoading, error, fetchUser, suspendUser, activateUser, deleteUser } =
    useUsers();
  const { t: tAdmin } = useAdminTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [kycActionLoading, setKycActionLoading] = useState<string | null>(null);
  const [, setSelectedDocument] = useState<KYCDocument | null>(null);

  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSuspend = async (reason?: string) => {
    if (!selectedUser || !id) return;

    try {
      setActionLoading('suspend');
      await suspendUser(id, { status: 'suspended', reason });
      toast.success(tAdmin('userProfile.userSuspendedSuccess'));
    } catch {
      toast.error(tErrors('admin.userSuspendError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (reason?: string) => {
    if (!selectedUser || !id) return;

    try {
      setActionLoading('activate');
      await activateUser(id, { status: 'active', reason });
      toast.success(tAdmin('userProfile.userActivatedSuccess'));
    } catch {
      toast.error(tErrors('admin.userActivateError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || !id) return;

    try {
      setActionLoading('delete');
      await deleteUser(id);
      toast.success(tAdmin('userProfile.userDeletedSuccess'));
      navigate('/admin/users');
    } catch {
      toast.error(tErrors('admin.userDeleteError'));
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
            {tCommon('status.active')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {tCommon('status.pending')}
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            {tCommon('status.suspended')}
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

  // Mock KYC documents - in real app, this would come from the API
  const getKYCDocuments = (): KYCDocument[] => {
    if (
      !selectedUser ||
      (selectedUser.role !== 'affreteur' && selectedUser.role !== 'transporteur')
    ) {
      return [];
    }

    const baseDocuments = [
      {
        id: '1',
        type: 'identityCard',
        label: "Carte d'identité",
        status: 'verified' as DocumentStatus,
        fileName: 'carte_identite.pdf',
        fileUrl: '/documents/carte_identite.pdf',
        uploadDate: '2024-01-15T10:30:00Z',
        validatedAt: '2024-01-16T09:15:00Z',
        validatedBy: 'Admin System',
        rejectionReason: null,
      },
    ];

    if (selectedUser.role === 'affreteur') {
      return [
        ...baseDocuments,
        {
          id: '2',
          type: 'businessLicense',
          label: 'Licence Commerciale',
          status: 'pending' as DocumentStatus,
          fileName: 'licence_commerciale.pdf',
          fileUrl: '/documents/licence_commerciale.pdf',
          uploadDate: '2024-01-20T14:20:00Z',
          validatedAt: null,
          validatedBy: null,
          rejectionReason: null,
        },
        {
          id: '3',
          type: 'taxCertificate',
          label: 'Certificat de taxe',
          status: 'missing' as DocumentStatus,
          fileName: null,
          fileUrl: null,
          uploadDate: null,
          validatedAt: null,
          validatedBy: null,
          rejectionReason: null,
        },
        {
          id: '4',
          type: 'bankStatement',
          label: 'Relevé bancaire',
          status: 'rejected' as DocumentStatus,
          fileName: 'releve_bancaire.pdf',
          fileUrl: '/documents/releve_bancaire.pdf',
          uploadDate: '2024-01-10T16:45:00Z',
          validatedAt: '2024-01-12T11:30:00Z',
          validatedBy: 'Admin System',
          rejectionReason: 'Document illisible, veuillez télécharger une version plus claire',
        },
      ];
    }

    if (selectedUser.role === 'transporteur') {
      return [
        ...baseDocuments,
        {
          id: '5',
          type: 'drivingLicense',
          label: 'Permis de conduire',
          status: 'verified' as DocumentStatus,
          fileName: 'permis_conduire.pdf',
          fileUrl: '/documents/permis_conduire.pdf',
          uploadDate: '2024-01-12T08:15:00Z',
          validatedAt: '2024-01-13T10:20:00Z',
          validatedBy: 'Admin System',
          rejectionReason: null,
        },
        {
          id: '6',
          type: 'vehicleRegistration',
          label: 'Carte grise',
          status: 'pending' as DocumentStatus,
          fileName: 'carte_grise.pdf',
          fileUrl: '/documents/carte_grise.pdf',
          uploadDate: '2024-01-20T12:30:00Z',
          validatedAt: null,
          validatedBy: null,
          rejectionReason: null,
        },
        {
          id: '7',
          type: 'insurance',
          label: 'Assurance véhicule',
          status: 'verified' as DocumentStatus,
          fileName: 'assurance_vehicule.pdf',
          fileUrl: '/documents/assurance_vehicule.pdf',
          uploadDate: '2024-01-10T15:45:00Z',
          validatedAt: '2024-01-11T09:30:00Z',
          validatedBy: 'Admin System',
          rejectionReason: null,
        },
        {
          id: '8',
          type: 'technicalControl',
          label: 'Contrôle technique',
          status: 'missing' as DocumentStatus,
          fileName: null,
          fileUrl: null,
          uploadDate: null,
          validatedAt: null,
          validatedBy: null,
          rejectionReason: null,
        },
        {
          id: '9',
          type: 'professionalLicense',
          label: 'Licence transport',
          status: 'verified' as DocumentStatus,
          fileName: 'licence_transport.pdf',
          fileUrl: '/documents/licence_transport.pdf',
          uploadDate: '2024-01-08T11:20:00Z',
          validatedAt: '2024-01-09T14:15:00Z',
          validatedBy: 'Admin System',
          rejectionReason: null,
        },
      ];
    }

    return [];
  };

  const kycDocuments = getKYCDocuments();

  const handleValidateDocument = async (documentId: string) => {
    try {
      setKycActionLoading(`validate-${documentId}`);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(tAdmin('userProfile.kyc.documentValidated'));
      // In real app, refetch documents
    } catch {
      toast.error(tErrors('admin.documentValidateError'));
    } finally {
      setKycActionLoading(null);
    }
  };

  const handleRejectDocument = async (documentId: string, reason: string) => {
    try {
      console.log(reason);
      setKycActionLoading(`reject-${documentId}`);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(tAdmin('userProfile.kyc.documentRejected'));
      // In real app, refetch documents
    } catch {
      toast.error(tErrors('admin.documentRejectError'));
    } finally {
      setKycActionLoading(null);
    }
  };

  const handleDownloadDocument = async (document: KYCDocument) => {
    if (!document.fileUrl) return;

    try {
      setKycActionLoading(`download-${document.id}`);
      // Simulate download
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create formatted filename
      const formattedName =
        `${selectedUser?.firstName}_${selectedUser?.lastName}_${document.type}_${document.fileName}`
          .replace(/\s+/g, '_')
          .toLowerCase();

      // In real app, this would download the actual file
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = formattedName;
      link.click();

      toast.success(tAdmin('userProfile.kyc.downloadStarted'));
    } catch {
      toast.error(tErrors('admin.downloadError'));
    } finally {
      setKycActionLoading(null);
    }
  };

  const getStatusBadgeForKYC = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {tCommon('status.verified')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            {tCommon('status.pending')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <X className="h-3 w-3 mr-1" />
            {tCommon('status.rejected')}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {tCommon('status.missing')}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tsa-blue"></div>
      </div>
    );
  }

  if (error || !selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {tAdmin('userProfile.userNotFound')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {tAdmin('userProfile.userNotFoundDescription')}
        </p>
        <Button onClick={() => navigate('/app/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tAdmin('userProfile.backToList')}
        </Button>
      </div>
    );
  }

  const userStats = [
    {
      label: tAdmin('userProfile.missionsCreated'),
      value: selectedUser.stats?.totalMissions || 0,
      icon: BarChart3,
    },
    {
      label: tAdmin('userProfile.proposals'),
      value: selectedUser.stats?.totalPropositions || 0,
      icon: Building,
    },
    {
      label: tAdmin('userProfile.orders'),
      value: selectedUser.stats?.totalOrders || 0,
      icon: Users,
    },
    // {
    //   label: tAdmin('userProfile.lastLogin'),
    //   value: selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : tCommon('never'),
    //   icon: Calendar,
    // },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/app/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('actions.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {tAdmin('userProfile.title')}
            </h1>
            <p className="text-muted-foreground">{tAdmin('userProfile.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={`/app/users/${id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              {tCommon('actions.edit')}
            </Button>
          </Link>

          {selectedUser.status === 'active' ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-orange-600 hover:text-orange-700">
                  <UserX className="h-4 w-4" />
                  {tCommon('actions.suspend')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tAdmin('userProfile.suspendUser')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tAdmin('userProfile.suspendConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleSuspend}
                    disabled={actionLoading === 'suspend'}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {actionLoading === 'suspend'
                      ? tCommon('messages.suspending')
                      : tCommon('actions.suspend')}
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
              {actionLoading === 'activate'
                ? tCommon('messages.activating')
                : tCommon('actions.activate')}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 text-white">
                <Trash2 className="h-4 w-4" />
                {tCommon('actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tAdmin('userProfile.deleteUser')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tAdmin('userProfile.deleteConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={actionLoading === 'delete'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {actionLoading === 'delete'
                    ? tCommon('messages.deleting')
                    : tAdmin('userProfile.deleteDefinitively')}
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
                {tAdmin('userProfile.personalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tAdmin('userProfile.fullName')}
                  </label>
                  <p className="text-lg font-semibold">
                    {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
                      'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tCommon('status.title')}
                  </label>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tAdmin('userProfile.email')}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tAdmin('userProfile.phone')}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">
                      {selectedUser.phone || tAdmin('userProfile.phoneNotProvided')}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tCommon('roles.title')}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleIcon(selectedUser.role)}
                    <Badge variant="outline" className="capitalize">
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tAdmin('userProfile.registrationDate')}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* {selectedUser.companyName && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Entreprise</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{selectedUser.companyName}</p>
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
                {tAdmin('userProfile.activityStats')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userStats.map((stat, index) => (
                  <div
                    key={index}
                    className="text-center p-4 bg-gray-50 dark:bg-gray-950 rounded-lg"
                  >
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-tsa-blue dark:text-tsa-white" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
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
                {tAdmin('userProfile.security')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {tAdmin('userProfile.emailVerified')}
                </span>
                <Badge variant={selectedUser.emailVerifiedAt ? 'default' : 'secondary'}>
                  {selectedUser.emailVerifiedAt ? tCommon('yes') : tCommon('no')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {tAdmin('userProfile.twoFactorEnabled')}
                </span>
                <Badge variant={selectedUser.mfaEnabled ? 'default' : 'secondary'}>
                  {selectedUser.mfaEnabled ? tCommon('yes') : tCommon('no')}
                </Badge>
              </div>
              {/* {selectedUser.lastLoginAt && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{tAdmin('userProfile.lastLogin')}</span>
                  <p className="text-sm font-medium">{formatDate(selectedUser.lastLoginAt)}</p>
                </div>
              )} */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tAdmin('userProfile.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/admin/users/${id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Edit className="h-4 w-4" />
                  {tAdmin('userProfile.editProfile')}
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="h-4 w-4" />
                {tAdmin('userProfile.sendEmail')}
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <BarChart3 className="h-4 w-4" />
                {tAdmin('userProfile.viewHistory')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* KYC Documents Section - Only for affreteurs and transporteurs */}
        {(selectedUser.role === 'affreteur' || selectedUser.role === 'transporteur') && (
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {tAdmin('userProfile.kyc.title')} -{' '}
                  {selectedUser.role === 'affreteur'
                    ? tCommon('roles.affreteur')
                    : tCommon('roles.transporteur')}
                  <Badge
                    variant="outline"
                    className={`ml-auto ${
                      kycDocuments.filter((doc) => doc.status === 'verified').length ===
                      kycDocuments.length
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : kycDocuments.some((doc) => doc.status === 'pending')
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {kycDocuments.filter((doc) => doc.status === 'verified').length}/
                    {kycDocuments.length} {tCommon('status.verified')}s
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {kycDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{tAdmin('userProfile.kyc.noDocuments')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {kycDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="border dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:bg-gray-950 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-tsa-blue dark:text-tsa-white" />
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {document.label}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadgeForKYC(document.status)}
                                {document.fileName && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {document.fileName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {document.fileName && document.fileUrl && (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2"
                                      onClick={() => setSelectedDocument(document)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      {tCommon('actions.view')}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                      <DialogTitle>{document.label}</DialogTitle>
                                      <DialogDescription>
                                        {tAdmin('userProfile.kyc.documentPreview', {
                                          date: document.uploadDate
                                            ? formatDate(document.uploadDate)
                                            : 'N/A',
                                        })}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="mt-4">
                                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                                          {tAdmin('userProfile.kyc.previewPlaceholder', {
                                            fileName: document.fileName,
                                          })}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          {tAdmin('userProfile.kyc.previewNote')}
                                        </p>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => handleDownloadDocument(document)}
                                  disabled={kycActionLoading === `download-${document.id}`}
                                >
                                  {kycActionLoading === `download-${document.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                  {tCommon('actions.download')}
                                </Button>
                              </>
                            )}

                            {document.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="gap-2 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleValidateDocument(document.id)}
                                  disabled={kycActionLoading === `validate-${document.id}`}
                                >
                                  {kycActionLoading === `validate-${document.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  {tCommon('actions.validate')}
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="gap-2 text-white"
                                      disabled={kycActionLoading === `reject-${document.id}`}
                                    >
                                      {kycActionLoading === `reject-${document.id}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                      {tCommon('actions.reject')}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {tAdmin('userProfile.kyc.rejectDocument')}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {tAdmin('userProfile.kyc.rejectConfirm')}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {tCommon('actions.cancel')}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleRejectDocument(document.id, 'Document non conforme')
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {tCommon('actions.reject')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Document details */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                {tAdmin('userProfile.kyc.details.status')}
                              </span>
                              <p className="font-medium">{document.status}</p>
                            </div>
                            {document.uploadDate && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {tAdmin('userProfile.kyc.details.uploaded')}
                                </span>
                                <p className="font-medium">{formatDate(document.uploadDate)}</p>
                              </div>
                            )}
                            {document.validatedAt && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {document.status === 'verified'
                                    ? tAdmin('userProfile.kyc.details.validated')
                                    : tAdmin('userProfile.kyc.details.rejected')}
                                </span>
                                <p className="font-medium">{formatDate(document.validatedAt)}</p>
                              </div>
                            )}
                            {document.validatedBy && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {document.status === 'verified'
                                    ? tAdmin('userProfile.kyc.details.validatedBy')
                                    : tAdmin('userProfile.kyc.details.rejectedBy')}
                                </span>
                                <p className="font-medium">{document.validatedBy}</p>
                              </div>
                            )}
                          </div>

                          {document.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 border dark:border-gray-800 border-red-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">
                                    {tAdmin('userProfile.kyc.details.rejectionReason')}
                                  </p>
                                  <p className="text-sm text-red-700">{document.rejectionReason}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-tsa-blue dark:text-tsa-white mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-blue-900">
                        {tAdmin('userProfile.kyc.management.title')}
                      </h4>
                      <p className="text-sm text-blue-700">
                        {tAdmin('userProfile.kyc.management.description')}
                      </p>
                      <ul className="text-xs text-tsa-blue dark:text-tsa-white mt-2 space-y-1">
                        <li>• {tAdmin('userProfile.kyc.management.instructions.view')}</li>
                        <li>• {tAdmin('userProfile.kyc.management.instructions.download')}</li>
                        <li>• {tAdmin('userProfile.kyc.management.instructions.validate')}</li>
                        <li>• {tAdmin('userProfile.kyc.management.instructions.reject')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

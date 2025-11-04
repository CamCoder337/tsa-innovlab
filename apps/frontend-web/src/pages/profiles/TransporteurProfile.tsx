import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useProfileTranslation,
  useErrorsTranslation,
  useCommonTranslation,
} from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Calendar,
  Star,
  Truck,
  TrendingUp,
  Edit,
  Save,
  X,
  Shield,
  Award,
  Settings,
} from 'lucide-react';
import ProfileForm, { type ProfileFormValues } from '@/components/forms/ProfileForm';
import KYCForm from '@/components/forms/KYCForm';
import { format } from 'date-fns';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import type { FormikProps } from 'formik';
import type { UpdateUserRequest } from '@/types/auth.types';
import { useMissions } from '@/hooks/useMissions';
import { Link } from 'react-router-dom';
import { useVehicles } from '@/hooks/useVehicles';

type DocumentStatus = 'verified' | 'pending' | 'missing';

interface Document {
  status: DocumentStatus;
  fileName: string | null;
  uploadDate: string | null;
  label: string;
  placeholder: string;
}

function TransporteurProfile() {
  const { user, updateUser } = useAuth();
  const { myMissions } = useMissions();
  const { vehicles } = useVehicles();
  const { t: tProfile } = useProfileTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formikRef = useRef<FormikProps<ProfileFormValues>>(null);
  const [kycUploading, setKycUploading] = useState<string | null>(null);
  const [kycDocuments, setKycDocuments] = useState<Record<string, Document>>({
    identityCard: {
      status: 'verified',
      fileName: 'carte_identite.pdf',
      uploadDate: '2024-01-15',
      label: tProfile('kyc.documentTypes.identity'),
      placeholder: tProfile('kyc.placeholders.identity'),
    },
    drivingLicense: {
      status: 'verified',
      fileName: 'permis_conduire.pdf',
      uploadDate: '2024-01-12',
      label: tProfile('kyc.documentTypes.drivingLicense'),
      placeholder: tProfile('kyc.placeholders.drivingLicense'),
    },
    vehicleRegistration: {
      status: 'pending',
      fileName: 'carte_grise.pdf',
      uploadDate: '2024-01-20',
      label: tProfile('kyc.documentTypes.vehicleRegistration'),
      placeholder: tProfile('kyc.placeholders.vehicleRegistration'),
    },
    insurance: {
      status: 'verified',
      fileName: 'assurance_vehicule.pdf',
      uploadDate: '2024-01-10',
      label: tProfile('kyc.documentTypes.insurance'),
      placeholder: tProfile('kyc.placeholders.insurance'),
    },
    technicalControl: {
      status: 'missing',
      fileName: null,
      uploadDate: null,
      label: tProfile('kyc.documentTypes.technicalControl'),
      placeholder: tProfile('kyc.placeholders.technicalControl'),
    },
    professionalLicense: {
      status: 'verified',
      fileName: 'licence_transport.pdf',
      uploadDate: '2024-01-08',
      label: tProfile('kyc.documentTypes.transportLicense'),
      placeholder: tProfile('kyc.placeholders.transportLicense'),
    },
  });

  const handleKycUpload = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setKycDocuments((prev) => ({
        ...prev,
        ['']: {
          status: 'pending',
          fileName: 'Name',
          uploadDate: new Date().toISOString().split('T')[0],
          label: 'Name',
          placeholder: 'Add Name',
        },
      }));
    } catch (error) {
      console.error(error);
      toast.error(tErrors('profile.documentUploadError'));
    } finally {
      setKycUploading(null);
    }
  };

  const handleSave = async (values: UpdateUserRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(values);
      console.log(response);

      if (response.error) {
        console.error(response.error);
        toast.error(response.error.message || tErrors('profile.updateError'));
      }

      if (response.data) {
        handleKycUpload();
        updateUser(response.data);
        toast.success(tProfile('updateSuccess'));
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(tErrors('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (formikRef.current) {
      const currentValues = formikRef.current.values;
      const initialValues = formikRef.current.initialValues;

      // Compare values and find differences
      const differences: Partial<ProfileFormValues> = {};
      let hasChanges = false;

      (Object.keys(currentValues) as (keyof ProfileFormValues)[]).forEach((key) => {
        if (currentValues[key] !== initialValues[key]) {
          differences[key] = currentValues[key];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        handleSave(differences as UpdateUserRequest);
      } else {
        toast(tCommon('messages.noChangesDetected'));
      }
    }
  };

  const handleCancel = () => {
    if (formikRef.current) formikRef.current.resetForm();
    setIsEditing(false);
  };

  const stats = [
    {
      label: tProfile('stats.missionsCompleted'),
      value: myMissions?.filter((mission) => mission.status === 'completed').length || 0,
      icon: Truck,
    },
    { label: tProfile('stats.averageRating'), value: '4.9/5', icon: Star },
    {
      label: tProfile('stats.successRate'),
      value:
        myMissions?.filter((mission) => mission.status === 'completed').length /
          myMissions?.length || 0,
      icon: Award,
    },
    {
      label: tProfile('stats.memberSince'),
      value: user ? format(new Date(user.createdAt), 'MMM yyyy') : '',
      icon: Calendar,
    },
  ];

  const kycProgress = Object.values(kycDocuments).filter((doc) => doc.status === 'verified').length;
  const totalKycDocs = Object.keys(kycDocuments).length;
  const kycPercentage = (kycProgress / totalKycDocs) * 100;

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {tProfile('title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {tProfile('transporteur.subtitle')}
          </p>
        </div>
        {!isEditing ? (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsEditing(true)}
              className="gap-2 cursor-pointer h-9 sm:h-10 text-sm sm:text-base"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              {tCommon('actions.edit')}
            </Button>
            <Link to="/app/settings">
              <Button
                variant="outline"
                className="gap-2 cursor-pointer w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                {tCommon('actions.settings')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              disabled={isLoading}
              onClick={handleSaveClick}
              className="gap-2 cursor-pointer h-9 sm:h-10 text-sm sm:text-base"
              type="submit"
              form="profile-form"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              {isLoading ? tCommon('messages.saving') : tCommon('actions.save')}
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              className="gap-2 cursor-pointer h-9 sm:h-10 text-sm sm:text-base"
              onClick={handleCancel}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
              {tCommon('actions.cancel')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:justify-between gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {tProfile('sections.personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1  gap-6 justify-between">
            <ProfileForm
              ref={formikRef}
              user={user}
              isEditing={isEditing}
              onSubmit={handleSave}
              isLoading={isLoading}
              // additionalFields={() => (
              //     <div className="space-y-4">
              //         <FormField
              //             name="companyName"
              //             label="Nom de l'entreprise"
              //             disabled={!isEditing}
              //         />
              //     </div>
              // )}
            />

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {tProfile('sections.statistics')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                      <span className="font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Permis Poids Lourd</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 ml-auto">
                      Valide
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Assurance Véhicule</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 ml-auto">
                      Valide
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Contrôle Technique</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 ml-auto">
                      Valide
                    </Badge>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {vehicles.length === 1
                ? tProfile('transporteur.myVehicle')
                : tProfile('transporteur.myVehicles')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicles.length === 1 ? (
              // Single vehicle display
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tProfile('transporteur.vehicleType')}
                  </span>
                  <span className="font-semibold">{vehicles[0].typeLabel || vehicles[0].type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tProfile('transporteur.registration')}
                  </span>
                  <span className="font-semibold">{vehicles[0].registration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tProfile('transporteur.status')}
                  </span>
                  <Badge
                    variant="outline"
                    className={`${
                      vehicles[0].status === 'available'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : vehicles[0].status === 'in_mission'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : vehicles[0].status === 'maintenance'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {vehicles[0].statusLabel || vehicles[0].status}
                  </Badge>
                </div>
                {vehicles[0].description && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {tProfile('transporteur.description')}
                    </span>
                    <span className="font-semibold text-right max-w-[150px] truncate">
                      {vehicles[0].description}
                    </span>
                  </div>
                )}
                <Separator />
                <Link to="/app/vehicles">
                  <Button variant="outline" className="w-full gap-2">
                    <Settings className="h-4 w-4" />
                    {tProfile('transporteur.manageVehicle')}
                  </Button>
                </Link>
              </>
            ) : (
              // Multiple vehicles stats display
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tProfile('transporteur.totalVehicles')}
                  </span>
                  <span className="font-semibold">{vehicles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tProfile('transporteur.available')}
                  </span>
                  <span className="font-semibold text-green-600">
                    {vehicles.filter((v) => v.status === 'available').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tProfile('transporteur.inMission')}
                  </span>
                  <span className="font-semibold text-tsa-blue">
                    {vehicles.filter((v) => v.status === 'in_mission').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tProfile('transporteur.inMaintenance')}
                  </span>
                  <span className="font-semibold text-orange-600">
                    {vehicles.filter((v) => v.status === 'maintenance').length}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{tProfile('transporteur.availabilityRate')}</span>
                    <span className="text-green-600">
                      {vehicles.length > 0
                        ? Math.round(
                            (vehicles.filter((v) => v.status === 'available').length /
                              vehicles.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      vehicles.length > 0
                        ? (vehicles.filter((v) => v.status === 'available').length /
                            vehicles.length) *
                          100
                        : 0
                    }
                    className="w-full"
                  />
                </div>
                <Link to="/app/vehicles">
                  <Button className="w-full gap-2">
                    <Truck className="h-4 w-4" />
                    {tProfile('transporteur.manageVehicles')}
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {tProfile('transporteur.kycTitle')}
              <Badge
                variant="outline"
                className={`ml-auto ${kycPercentage === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
              >
                {kycProgress}/{totalKycDocs} {tProfile('kyc.verified')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <KYCForm
                kycDocuments={kycDocuments}
                kycUploading={kycUploading}
                onDocumentUpload={handleKycUpload}
              />
            </div>

            <Separator />

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-green-900">
                    {tProfile('transporteur.certificationTitle')}
                  </h4>
                  <p className="text-sm text-green-700">
                    {tProfile('transporteur.certificationDescription')}
                  </p>
                  <ul className="text-xs text-green-600 mt-2 space-y-1">
                    <li>• {tProfile('kyc.acceptedFormats')}</li>
                    <li>• {tProfile('kyc.verificationTime')}</li>
                    <li>• {tProfile('transporteur.documentsRequired')}</li>
                    <li>• {tProfile('transporteur.renewalAlerts')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TransporteurProfile;

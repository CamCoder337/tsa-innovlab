import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Calendar,
  Star,
  Package,
  TrendingUp,
  Edit,
  Save,
  X,
  Shield,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ProfileForm, { type ProfileFormValues } from '@/components/forms/ProfileForm';
import type { FormikProps } from 'formik';
import KYCForm from '@/components/forms/KYCForm';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import type { UpdateUserRequest } from '@/types/auth.types';
import { Link } from 'react-router-dom';
import { useMissions } from '@/hooks/useMissions';
import { useProfileTranslation, useCommonTranslation } from '@/hooks/useTranslation';

type DocumentStatus = 'verified' | 'pending' | 'missing';

export interface Document {
  status: DocumentStatus;
  fileName: string | null;
  uploadDate: string | null;
  label: string;
  placeholder: string;
}

function AffreteurProfile() {
  const { user, updateUser } = useAuth();
  const { myMissions } = useMissions();
  const { t } = useProfileTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [kycUploading, setKycUploading] = useState<string | null>(null);
  const formikRef = useRef<FormikProps<ProfileFormValues>>(null);
  const [kycDocuments, setKycDocuments] = useState<Record<string, Document>>({
    identityCard: {
      status: 'verified',
      fileName: 'carte_identite.pdf',
      uploadDate: '2024-01-15',
      label: t('kyc.documentTypes.identity'),
      placeholder: t('kyc.placeholders.identity'),
    },
    businessLicense: {
      status: 'pending',
      fileName: 'licence_commerciale.pdf',
      uploadDate: '2024-01-20',
      label: t('kyc.documentTypes.businessLicense'),
      placeholder: t('kyc.placeholders.businessLicense'),
    },
    taxCertificate: {
      status: 'missing',
      fileName: null,
      uploadDate: null,
      label: t('kyc.documentTypes.taxCertificate'),
      placeholder: t('kyc.placeholders.taxCertificate'),
    },
    bankStatement: {
      status: 'verified',
      fileName: 'releve_bancaire.pdf',
      uploadDate: '2024-01-10',
      label: t('kyc.documentTypes.bankStatement'),
      placeholder: t('kyc.placeholders.bankStatement'),
    },
  });

  const handleKycUpload = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setKycDocuments((prev) => ({
        ...prev,
        Doc: {
          status: 'pending',
          fileName: 'Name',
          uploadDate: new Date().toISOString().split('T')[0],
          label: 'Name',
          placeholder: 'Add Name',
        },
      }));
    } catch (error) {
      console.error(error);
      console.error(t('errors.documentUploadError'));
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
        toast.error(response.error.message || t('errors.updateError'));
      }

      if (response.data) {
        handleKycUpload();
        updateUser(response.data);
        toast.success(t('updateSuccess'));
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
      console.error(t('errors.updateError'));
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

  if (!user) return null;

  const stats = [
    { label: t('stats.missionsCreated'), value: myMissions?.length || 0, icon: Package },
    {
      label: t('stats.missionsCompleted'),
      value: myMissions?.filter((mission) => mission.status === 'completed').length || 0,
      icon: TrendingUp,
    },
    { label: t('stats.averageRating'), value: '4.8/5', icon: Star },
    {
      label: t('stats.memberSince'),
      value: format(new Date(user.createdAt), 'MMM yyyy'),
      icon: Calendar,
    },
  ];

  const kycProgress = Object.values(kycDocuments).filter((doc) => doc.status === 'verified').length;
  const totalKycDocs = Object.keys(kycDocuments).length;
  const kycPercentage = (kycProgress / totalKycDocs) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(true)} className="gap-2 cursor-pointer">
              <Edit className="h-4 w-4" />
              {tCommon('actions.edit')}
            </Button>
            <Link to="/app/settings">
              <Button variant="outline" className="gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                {tCommon('actions.settings')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              disabled={isLoading}
              onClick={handleSaveClick}
              className="gap-2 cursor-pointer"
              type="submit"
              form="profile-form"
            >
              <Save className="h-4 w-4" />
              {isLoading ? t('profile.actions.saving') : t('profile.actions.save')}
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              className="gap-2 cursor-pointer"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
              {tCommon('actions.cancel')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('sections.personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2  gap-6 justify-between">
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

            <div className="space-y-6 max-w-md">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('sections.statistics')}
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
                  <CardTitle>Préférences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications Email</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Activées
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications SMS</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Activées
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Suivi GPS</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Activé
                    </Badge>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full bg-transparent">
                    Gérer les Préférences
                  </Button>
                </CardContent>
              </Card> */}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('sections.kycDocuments')}
              <Badge
                variant="outline"
                className={`ml-auto ${kycPercentage === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
              >
                {kycProgress}/{totalKycDocs} {t('kyc.verified')}
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

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-tsa-blue mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-blue-900">{t('kyc.whyDocuments')}</h4>
                  <p className="text-sm text-blue-700">{t('kyc.description')}</p>
                  <ul className="text-xs text-tsa-blue mt-2 space-y-1">
                    <li>• {t('kyc.acceptedFormats')}</li>
                    <li>• {t('kyc.verificationTime')}</li>
                    <li>• {t('kyc.secureStorage')}</li>
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

export default AffreteurProfile;

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Star, Package, TrendingUp, Edit, Save, X, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ProfileForm, { type ProfileFormValues } from '@/components/forms/ProfileForm';
import type { FormikProps } from 'formik';
import KYCForm from '@/components/forms/KYCForm';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import type { updateUserRequest } from '@/types/auth.types';

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
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [kycUploading, setKycUploading] = useState<string | null>(null);
  const formikRef = useRef<FormikProps<ProfileFormValues>>(null);
  const [kycDocuments, setKycDocuments] = useState<Record<string, Document>>({
    identityCard: {
      status: 'verified',
      fileName: 'carte_identite.pdf',
      uploadDate: '2024-01-15',
      label: "Carte d'identité",
      placeholder: "Glissez votre carte d'identité ici",
    },
    businessLicense: {
      status: 'pending',
      fileName: 'licence_commerciale.pdf',
      uploadDate: '2024-01-20',
      label: 'Licence Commerciale',
      placeholder: 'Glissez votre licence commerciale ici',
    },
    taxCertificate: {
      status: 'missing',
      fileName: null,
      uploadDate: null,
      label: 'Certificat de taxe',
      placeholder: 'Glissez votre certificat de taxe ici',
    },
    bankStatement: {
      status: 'verified',
      fileName: 'releve_bancaire.pdf',
      uploadDate: '2024-01-10',
      label: 'Relevé bancaire',
      placeholder: 'Glissez votre dernier relevé bancaire trimestriel ici',
    },
  });

  if (!user) return null;

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
      console.error('Erreur lors du téléchargement du document');
    } finally {
      setKycUploading(null);
    }
  };

  const handleSave = async (values: updateUserRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(values);
      console.log(response);

      if (response.error) {
        console.error(response.error);
        toast.error(response.error.message || 'Erreur lors de la mise à jour du profil');
      }

      if (response.data) {
        handleKycUpload();
        updateUser(response.data);
        toast.success('Profil mis à jour avec succès');
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
      console.error('Erreur lors de la mise à jour du profil');
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
        handleSave(differences as updateUserRequest);
      } else {
        toast('Aucune modification détectée');
      }
    }
  };

  const handleCancel = () => {
    if (formikRef.current) formikRef.current.resetForm();
    setIsEditing(false);
  };

  const stats = [
    { label: 'Missions Créées', value: '47', icon: Package },
    { label: 'Missions Terminées', value: '44', icon: TrendingUp },
    { label: 'Note Moyenne', value: '4.8/5', icon: Star },
    { label: 'Membre Depuis', value: format(new Date(user.createdAt), 'MMM yyyy'), icon: Calendar },
  ];

  const kycProgress = Object.values(kycDocuments).filter((doc) => doc.status === 'verified').length;
  const totalKycDocs = Object.keys(kycDocuments).length;
  const kycPercentage = (kycProgress / totalKycDocs) * 100;

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2 cursor-pointer">
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
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
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              className="gap-2 cursor-pointer"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations Personnelles
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
                    Statistiques
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

              <Card>
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
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Documents KYC (Know Your Customer)
              <Badge
                variant="outline"
                className={`ml-auto ${kycPercentage === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
              >
                {kycProgress}/{totalKycDocs} Vérifiés
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
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-blue-900">Pourquoi ces documents ?</h4>
                  <p className="text-sm text-blue-700">
                    La vérification KYC nous permet de sécuriser la plateforme et de respecter les
                    réglementations. Vos documents sont traités de manière confidentielle et
                    sécurisée.
                  </p>
                  <ul className="text-xs text-blue-600 mt-2 space-y-1">
                    <li>• Formats acceptés: PDF, JPG, PNG (max 5MB)</li>
                    <li>• Vérification sous 24-48h ouvrées</li>
                    <li>• Documents stockés de manière sécurisée</li>
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

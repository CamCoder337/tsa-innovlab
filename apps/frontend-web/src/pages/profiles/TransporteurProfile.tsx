import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import toast from 'react-hot-toast';
import type { FormikProps } from 'formik';
import type { UpdateUserRequest } from '@/types/auth.types';
import { useMissions } from '@/hooks/useMissions';
import { Link } from 'react-router-dom';

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
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formikRef = useRef<FormikProps<ProfileFormValues>>(null);
  const [kycUploading, setKycUploading] = useState<string | null>(null);
  const [kycDocuments, setKycDocuments] = useState<Record<string, Document>>({
    identityCard: {
      status: 'verified',
      fileName: 'carte_identite.pdf',
      uploadDate: '2024-01-15',
      label: "Carte d'identité",
      placeholder: "Glissez votre carte d'identité ici",
    },
    drivingLicense: {
      status: 'verified',
      fileName: 'permis_conduire.pdf',
      uploadDate: '2024-01-12',
      label: 'Permis de conduire',
      placeholder: 'Glissez votre permis de conduire ici',
    },
    vehicleRegistration: {
      status: 'pending',
      fileName: 'carte_grise.pdf',
      uploadDate: '2024-01-20',
      label: 'Carte grise',
      placeholder: 'Glissez votre carte grise ici',
    },
    insurance: {
      status: 'verified',
      fileName: 'assurance_vehicule.pdf',
      uploadDate: '2024-01-10',
      label: 'Assurance véhicule',
      placeholder: 'Glissez votre assurance véhicule ici',
    },
    technicalControl: {
      status: 'missing',
      fileName: null,
      uploadDate: null,
      label: 'Contrôle technique',
      placeholder: 'Glissez votre contrôle technique ici',
    },
    professionalLicense: {
      status: 'verified',
      fileName: 'licence_transport.pdf',
      uploadDate: '2024-01-08',
      label: 'Licence transport',
      placeholder: 'Glissez votre licence transport ici',
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
      toast.error('Erreur lors du téléchargement du document');
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
      toast.error('Erreur lors de la mise à jour du profil');
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
        toast('Aucune modification détectée');
      }
    }
  };

  const handleCancel = () => {
    if (formikRef.current) formikRef.current.resetForm();
    setIsEditing(false);
  };

  const stats = [
    {
      label: 'Missions Terminées',
      value: myMissions?.filter((mission) => mission.status === 'completed').length || 0,
      icon: Truck,
    },
    { label: 'Note Moyenne', value: '4.9/5', icon: Star },
    {
      label: 'Taux de Réussite',
      value:
        myMissions?.filter((mission) => mission.status === 'completed').length /
          myMissions?.length || 0,
      icon: Award,
    },
    {
      label: 'Membre Depuis',
      value: user ? format(new Date(user.createdAt), 'MMM yyyy') : '',
      icon: Calendar,
    },
  ];

  const vehicleInfo = {
    model: 'Mercedes Actros',
    plate: 'CM-123-AB',
    capacity: '25 tonnes',
    mileage: '45,230 km',
  };

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
            Gérez vos informations personnelles et votre véhicule
          </p>
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(true)} className="gap-2 cursor-pointer">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Link to="/app/settings">
              <Button variant="outline" className="gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Paramètres
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

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:justify-between gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations Personnelles
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
              Mon Véhicule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Modèle</span>
              <span className="font-semibold">{vehicleInfo.model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plaque</span>
              <span className="font-semibold">{vehicleInfo.plate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Capacité</span>
              <span className="font-semibold">{vehicleInfo.capacity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Kilométrage</span>
              <span className="font-semibold">{vehicleInfo.mileage}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>État Général</span>
                <span className="text-green-600">Excellent</span>
              </div>
              <Progress value={92} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Documents KYC & Certifications Transport
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

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-green-900">Certification Transporteur</h4>
                  <p className="text-sm text-green-700">
                    Ces documents sont essentiels pour valider votre statut de transporteur
                    professionnel et garantir la sécurité des missions sur la plateforme TSA
                    Logistics.
                  </p>
                  <ul className="text-xs text-green-600 mt-2 space-y-1">
                    <li>• Formats acceptés: PDF, JPG, PNG (max 5MB)</li>
                    <li>• Vérification sous 24-48h ouvrées</li>
                    <li>• Documents requis pour accepter des missions</li>
                    <li>• Renouvellement automatique des alertes d'expiration</li>
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

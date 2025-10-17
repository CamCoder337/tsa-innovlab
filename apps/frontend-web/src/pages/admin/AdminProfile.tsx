import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings, Shield, Save, Edit, X, BarChart3, ServerCog } from 'lucide-react';
import ProfileForm, { type ProfileFormValues } from '@/components/forms/ProfileForm';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import type { FormikProps } from 'formik';
import type { updateUserRequest } from '@/types/auth.types';
import { Link } from 'react-router-dom';
import { useMissions } from '@/hooks/useMissions';

function AdminProfile() {
  const { user, updateUser } = useAuth();
  const { missions } = useMissions();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formikRef = useRef<FormikProps<ProfileFormValues>>(null);

  if (!user) return null;

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

  const adminStats = [
    { label: 'Utilisateurs inscrits', value: '1 245', icon: Users },
    { label: 'Missions actives', value: missions?.length || 0, icon: BarChart3 },
    { label: 'Incidents ouverts', value: '2', icon: Shield },
    { label: 'Services', value: 'OK', icon: ServerCog },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations et surveillez la plateforme
          </p>
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Link to="/admin/settings">
              <Button variant="outline" className="gap-2">
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
              className="gap-2"
              type="submit"
              form="profile-form"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button variant="outline" disabled={isLoading} className="gap-2" onClick={handleCancel}>
              <X className="h-4 w-4" />
              Annuler
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informations Administrateur
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2  gap-6 justify-between">
            <ProfileForm
              ref={formikRef}
              user={user}
              isEditing={isEditing}
              onSubmit={handleSave}
              isLoading={isLoading}
            />

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Statistiques Plateforme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adminStats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
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
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Rôles & Accès
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    L'administration peut gérer les rôles des utilisateurs et les autorisations.
                  </p>
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Gérer les utilisateurs
                    </Button>
                    <Button variant="outline" size="sm">
                      Politiques d'accès
                    </Button>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminProfile;

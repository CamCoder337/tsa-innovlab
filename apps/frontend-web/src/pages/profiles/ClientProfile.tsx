import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, CreditCard, Save, X, Edit, Settings } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import type { FormikProps } from 'formik';
import type { ProfileFormValues } from '@/components/forms/ProfileForm';
import type { UpdateUserRequest } from '@/types/auth.types';
import { Link } from 'react-router-dom';
import ProfileForm from '@/components/forms/ProfileForm';

export default function ClientProfile() {
  const { user, updateUser } = useAuth();
  const { t: tProfile } = useProfileTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formikRef = useRef<FormikProps<ProfileFormValues>>(null);

  const handleSave = async (values: UpdateUserRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(values);
      console.log(response);

      if (response.error) {
        console.error(response.error);
        toast.error(response.error.message || tProfile('profile.errors.updateError'));
      }

      if (response.data) {
        updateUser(response.data);
        toast.success(tProfile('profile.updateSuccess'));
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(tProfile('profile.errors.updateError'));
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tProfile('profile.title')}</h1>
          <p className="text-muted-foreground">{tProfile('profile.client.subtitle')}</p>
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
              {isLoading ? tProfile('profile.actions.saving') : tProfile('profile.actions.save')}
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

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {tProfile('profile.sections.personalInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {tProfile('profile.client.paymentMethods')}
          </CardTitle>
          <CardDescription>{tProfile('profile.client.paymentMethodsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium">MTN Mobile Money</div>
                  <div className="text-sm text-gray-600">
                    {user.phone
                      ? `****${user.phone.slice(-4)}`
                      : tProfile('profile.client.notConfigured')}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">{tProfile('profile.client.primary')}</Badge>
            </div>

            <Button variant="outline" className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              {tProfile('profile.client.addPaymentMethod')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {tProfile('profile.client.addresses')}
          </CardTitle>
          <CardDescription>{tProfile('profile.client.addressesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm mb-4">{tProfile('profile.client.noAddresses')}</p>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                {tProfile('profile.client.addAddress')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

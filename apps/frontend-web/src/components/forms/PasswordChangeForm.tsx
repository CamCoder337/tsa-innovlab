import { useState, type Dispatch, type SetStateAction } from 'react';
import { Formik, Form, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Save, Key } from 'lucide-react';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

export interface PasswordChangeFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const validationSchema = Yup.object({
  currentPassword: Yup.string().required('Le mot de passe actuel est requis'),
  newPassword: Yup.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
    )
    .required('Le nouveau mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation du mot de passe est requise'),
});

export interface PasswordChangeFormProps {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export default function PasswordChangeForm({ isLoading, setIsLoading }: PasswordChangeFormProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues: PasswordChangeFormValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const handleSubmit = async (
    values: PasswordChangeFormValues,
    { resetForm, setSubmitting }: FormikHelpers<PasswordChangeFormValues>
  ) => {
    try {
      setIsLoading(true);

      const response = await authService.changePassword(
        values.currentPassword,
        values.newPassword,
        values.confirmPassword
      );

      if (response.error) {
        toast.error(response.error.message || 'Erreur lors de la modification du mot de passe');
        throw new Error(response.error.message);
      }

      if (response.data) {
        toast.success('Mot de passe modifié avec succès');
      }
      resetForm();
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Key className="h-4 w-4" />
        Changer le mot de passe
      </h4>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnBlur={true}
        validateOnChange={true}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting, isValid, dirty }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={values.currentPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Mot de passe actuel"
                    disabled={isLoading || isSubmitting}
                    className={
                      errors.currentPassword && touched.currentPassword ? 'border-red-500' : ''
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isLoading || isSubmitting}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.currentPassword && touched.currentPassword && (
                  <p className="text-sm text-red-500">{errors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={values.newPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Nouveau mot de passe"
                    disabled={isLoading || isSubmitting}
                    className={errors.newPassword && touched.newPassword ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading || isSubmitting}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.newPassword && touched.newPassword && (
                  <p className="text-sm text-red-500">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Confirmer le mot de passe"
                    disabled={isLoading || isSubmitting}
                    className={
                      errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading || isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || isSubmitting || !isValid || !dirty}
              className="w-full md:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading || isSubmitting ? 'Modification...' : 'Changer le mot de passe'}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

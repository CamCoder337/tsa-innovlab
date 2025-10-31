import { useState, type Dispatch, type SetStateAction } from 'react';
import { Formik, Form, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Save, Key } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { useFormsTranslation } from '@/hooks/useTranslation';

export interface PasswordChangeFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const createValidationSchema = (tForms: (key: string) => string) =>
  Yup.object({
    currentPassword: Yup.string().required(tForms('validation.required')),
    newPassword: Yup.string()
      .min(8, tForms('password.validation.passwordMinLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
        tForms('password.validation.passwordComplexity')
      )
      .required(tForms('validation.required')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], tForms('password.validation.passwordMismatch'))
      .required(tForms('validation.required')),
  });

export interface PasswordChangeFormProps {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export default function PasswordChangeForm({ isLoading, setIsLoading }: PasswordChangeFormProps) {
  const { t: tForms } = useFormsTranslation();
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
        toast.error(response.error.message || tForms('password.messages.passwordChangeError'));
        throw new Error(response.error.message);
      }

      if (response.data) {
        toast.success(tForms('password.messages.passwordChangeSuccess'));
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
        {tForms('password.labels.changePassword')}
      </h4>

      <Formik
        initialValues={initialValues}
        validationSchema={createValidationSchema(tForms)}
        validateOnBlur={true}
        validateOnChange={true}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting, isValid, dirty }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{tForms('password.labels.currentPassword')}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={values.currentPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={tForms('password.placeholders.currentPassword')}
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
                <Label htmlFor="newPassword">{tForms('password.labels.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={values.newPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={tForms('password.placeholders.newPassword')}
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
                <Label htmlFor="confirmPassword">{tForms('password.labels.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={tForms('password.placeholders.confirmPassword')}
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
              {isLoading || isSubmitting
                ? tForms('password.buttons.updating')
                : tForms('password.buttons.changePassword')}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

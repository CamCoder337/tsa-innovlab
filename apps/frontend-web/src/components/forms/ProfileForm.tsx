import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone } from 'lucide-react';
import { useState, type ChangeEvent, forwardRef } from 'react';
import { Formik, Form, type FormikHelpers, type FormikProps } from 'formik';
import * as Yup from 'yup';
import type { User as UserType } from '@/types/auth.types';
import libphonenumber from 'google-libphonenumber';
import { FormField } from '../FormField';
import { useFormsTranslation } from '@/hooks/useTranslation';

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Validation schema using Yup
const createValidationSchema = (t: (key: string, options?: Record<string, unknown>) => string) =>
  Yup.object({
    firstName: Yup.string().trim().required(t('validation.required')),
    lastName: Yup.string().trim().required(t('validation.required')),
    email: Yup.string().trim().email(t('validation.email')).required(t('validation.required')),
    phone: Yup.string()
      .required(t('validation.required'))
      .test('isValidPhone', t('validation.phone'), function (value) {
        if (!value) return false;
        try {
          const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
          const countryCode = this.parent.country || 'CM'; // Default to Cameroon if not provided
          const number = phoneUtil.parseAndKeepRawInput(value, countryCode.toUpperCase());
          return phoneUtil.isValidNumber(number);
        } catch (error) {
          console.error('Phone validation error:', error);
          return false;
        }
      }),
  });

export interface ProfileFormProps {
  user: UserType;
  isEditing: boolean;
  isLoading?: boolean;
  onSubmit: (
    values: ProfileFormValues,
    formikHelpers: FormikHelpers<ProfileFormValues>
  ) => Promise<void>;
  additionalFields?: (formikProps: FormikProps<ProfileFormValues>) => React.ReactNode;
}

const ProfileForm = forwardRef<FormikProps<ProfileFormValues>, ProfileFormProps>(
  ({ user, isEditing, isLoading = false, onSubmit, additionalFields }, ref) => {
    const { t } = useFormsTranslation();
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

    const initialValues: ProfileFormValues = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    };

    const handleAvatarChange = (
      e: ChangeEvent<HTMLInputElement>,
      setFieldValue: (field: string, value: File | null) => void
    ) => {
      const file = e.target.files?.[0];
      if (file) {
        setFieldValue('avatar', file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    };

    const handleFormSubmit = async (
      values: ProfileFormValues,
      formikHelpers: FormikHelpers<ProfileFormValues>
    ) => {
      try {
        await onSubmit(values, formikHelpers);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        formikHelpers.setSubmitting(false);
      }
    };

    return (
      <Formik
        initialValues={initialValues}
        validationSchema={createValidationSchema(t)}
        onSubmit={handleFormSubmit}
        enableReinitialize
        innerRef={ref}
      >
        {(formikProps) => {
          const { values, isSubmitting, setFieldValue } = formikProps;
          return (
            <Form id="profile-form" className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar
                    className={`h-24 w-24 ${isEditing ? 'cursor-pointer transition-opacity hover:opacity-60' : ''}`}
                    onClick={() => isEditing && document.getElementById('avatar-upload')?.click()}
                  >
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="text-xl bg-tsa-blue text-white">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute hidden inset-0 hover:flex items-center justify-center z-10">
                      <input
                        type="file"
                        id="avatar-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={(e) => handleAvatarChange(e, setFieldValue)}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-3">
                    {user.fullName}
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('messages.memberSince')}{' '}
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <FormField
                      name="firstName"
                      label={t('labels.firstName')}
                      icon={User}
                      disabled={isLoading || isSubmitting}
                    />
                    <FormField
                      name="lastName"
                      label={t('labels.lastName')}
                      icon={User}
                      disabled={isLoading || isSubmitting}
                    />
                    <FormField
                      name="email"
                      label={t('labels.email')}
                      type="email"
                      icon={Mail}
                      disabled={isLoading || isSubmitting}
                    />
                    <FormField
                      name="phone"
                      label={t('labels.phone')}
                      type="tel"
                      icon={Phone}
                      disabled={isLoading || isSubmitting}
                      placeholder={t('placeholders.phoneNumber')}
                    />
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>{t('labels.firstName')}</Label>
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{values.firstName}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('labels.lastName')}</Label>
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{values.lastName}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('labels.email')}</Label>
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{values.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('labels.phone')}</Label>
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{values.phone || t('messages.notProvided')}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {additionalFields && <div className="mt-6">{additionalFields(formikProps)}</div>}
            </Form>
          );
        }}
      </Formik>
    );
  }
);

ProfileForm.displayName = 'ProfileForm';

export default ProfileForm;

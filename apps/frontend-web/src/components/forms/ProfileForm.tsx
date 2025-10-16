import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone } from 'lucide-react';
import { useState, type ChangeEvent, forwardRef } from 'react';
import { Formik, Form, type FormikHelpers, type FormikProps, useFormikContext } from 'formik';
import * as Yup from 'yup';
import type { User as UserType } from '@/types/auth.types';
import { VALIDATION_MESSAGES } from '@/lib/validation';
import libphonenumber from 'google-libphonenumber';
import { FormField } from '../FormField';

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Validation schema using Yup
const validationSchema = Yup.object({
  firstName: Yup.string().trim().required(VALIDATION_MESSAGES.REQUIRED_NAME),
  lastName: Yup.string().trim().required(VALIDATION_MESSAGES.REQUIRED_FIRSTNAME),
  email: Yup.string()
    .trim()
    .email(VALIDATION_MESSAGES.INVALID_EMAIL)
    .required(VALIDATION_MESSAGES.REQUIRED_EMAIL),
  phone: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED_PHONE)
    .test('isValidPhone', VALIDATION_MESSAGES.INVALID_PHONE, function (value) {
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
    const formik = useFormikContext<ProfileFormValues>();
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
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize
        innerRef={ref}
      >
        {({ values, isSubmitting, setFieldValue }) => (
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
                  Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <FormField
                    name="firstName"
                    label="Prénom"
                    icon={User}
                    disabled={isLoading || isSubmitting}
                  />
                  <FormField
                    name="lastName"
                    label="Nom"
                    icon={User}
                    disabled={isLoading || isSubmitting}
                  />
                  <FormField
                    name="email"
                    label="Email"
                    type="email"
                    icon={Mail}
                    disabled={isLoading || isSubmitting}
                  />
                  <FormField
                    name="phone"
                    label="Téléphone"
                    type="tel"
                    icon={Phone}
                    disabled={isLoading || isSubmitting}
                    placeholder="+237 6XX XXX XXX"
                  />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{values.firstName}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{values.lastName}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{values.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{values.phone || 'Non renseigné'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {additionalFields && <div className="mt-6">{additionalFields(formik)}</div>}
          </Form>
        )}
      </Formik>
    );
  }
);

ProfileForm.displayName = 'ProfileForm';

export default ProfileForm;

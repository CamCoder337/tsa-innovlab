import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import libphonenumber from 'google-libphonenumber';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { CreateUserRequest, UserRole } from '@/types/auth.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Shield, Building } from 'lucide-react';
import { useAdminTranslation, useFormsTranslation } from '@/hooks/useTranslation';

interface AddUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  country: string;
  role: UserRole;
  companyName?: string;
}

const INITIAL_VALUES: AddUserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  country: 'cm',
  role: 'client',
  companyName: '',
};

// Admin can create users with all roles including admin
const ALL_USER_ROLES: UserRole[] = ['admin', 'affreteur', 'transporteur', 'client'];

const createValidationSchema = (t: (key: string) => string, tForms: (key: string) => string) =>
  Yup.object({
    firstName: Yup.string().trim().required(tForms('validation.required')),
    lastName: Yup.string().trim().required(tForms('validation.required')),
    email: Yup.string()
      .trim()
      .required(tForms('validation.required'))
      .email(tForms('validation.email')),
    password: Yup.string()
      .required(tForms('validation.required'))
      .min(8, t('addUser.form.validation.passwordMinLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
        t('addUser.form.validation.passwordComplexity')
      ),
    confirmPassword: Yup.string()
      .required(tForms('validation.required'))
      .oneOf([Yup.ref('password')], tForms('validation.passwordsNotMatch')),
    phone: Yup.string()
      .required(tForms('validation.required'))
      .test('isValidPhone', tForms('validation.phone'), (value, context) => {
        try {
          const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
          const countryCode = context.parent.country || 'CM';
          const number = phoneUtil.parseAndKeepRawInput(value, countryCode.toUpperCase());
          return phoneUtil.isValidNumber(number);
        } catch (error) {
          console.error(error);
          return false;
        }
      }),
    role: Yup.string()
      .required(tForms('validation.required'))
      .oneOf(ALL_USER_ROLES, tForms('validation.role')),
    companyName: Yup.string().when('role', {
      is: (role: UserRole) => role === 'affreteur' || role === 'transporteur',
      then: (schema) => schema.required(t('addUser.form.validation.companyRequired')),
      otherwise: (schema) => schema.optional(),
    }),
  });

interface AddUserFormProps {
  onSubmit: (data: CreateUserRequest) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function AddUserForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AddUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t } = useAdminTranslation();
  const { t: tForms } = useFormsTranslation();

  const validationSchema = createValidationSchema(t, tForms);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'affreteur':
        return <Building className="h-4 w-4" />;
      case 'transporteur':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return t('addUser.form.roles.admin');
      case 'affreteur':
        return t('addUser.form.roles.affreteur');
      case 'transporteur':
        return t('addUser.form.roles.transporteur');
      case 'client':
        return t('addUser.form.roles.client');
      default:
        return role;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('addUser.form.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Formik<AddUserFormData>
          initialValues={INITIAL_VALUES}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmPassword, country, ...userData } = values;
            await onSubmit(userData as CreateUserRequest);
          }}
          validateOnBlur={true}
          validateOnChange={true}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setValues }) => {
            const handleChangePhoneNumber = (value: string, country: { countryCode: string }) => {
              const countryCode = country.countryCode.toLowerCase();
              setValues({
                ...values,
                phone: value,
                country: countryCode,
              });
            };

            const needsCompanyName = values.role === 'affreteur' || values.role === 'transporteur';

            return (
              <Form className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4" />
                    {t('addUser.form.personalInfo')}
                  </div>
                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        {t('addUser.form.firstName')} {t('addUser.form.required')}
                      </Label>
                      <Input
                        name="firstName"
                        id="firstName"
                        type="text"
                        placeholder={t('addUser.form.firstNamePlaceholder')}
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={touched.firstName && errors.firstName ? 'border-red-500' : ''}
                      />
                      {touched.firstName && errors.firstName && (
                        <div className="text-sm text-red-600">{errors.firstName}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {t('addUser.form.lastName')} {t('addUser.form.required')}
                      </Label>
                      <Input
                        name="lastName"
                        id="lastName"
                        type="text"
                        placeholder={t('addUser.form.lastNamePlaceholder')}
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={touched.lastName && errors.lastName ? 'border-red-500' : ''}
                      />
                      {touched.lastName && errors.lastName && (
                        <div className="text-sm text-red-600">{errors.lastName}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4" />
                    {t('addUser.form.contactInfo')}
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t('addUser.form.email')} {t('addUser.form.required')}
                    </Label>
                    <Input
                      name="email"
                      id="email"
                      type="email"
                      placeholder={t('addUser.form.emailPlaceholder')}
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.email && errors.email ? 'border-red-500' : ''}
                    />
                    {touched.email && errors.email && (
                      <div className="text-sm text-red-600">{errors.email}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {t('addUser.form.phone')} {t('addUser.form.required')}
                    </Label>
                    <PhoneInput
                      specialLabel=""
                      placeholder={t('addUser.form.phonePlaceholder')}
                      country={'cm'}
                      enableSearch={true}
                      disableDropdown={false}
                      onChange={handleChangePhoneNumber}
                      onBlur={handleBlur}
                      value={values.phone}
                      masks={{
                        ci: '.. .. .. .. ..',
                        cm: '... ... ...',
                        fr: '. .. .. .. ..',
                        sn: '.. ... .. ..',
                        ma: '.... ......',
                        dz: '.. .. .. .. ..',
                        tn: '.. ... ...',
                      }}
                      inputStyle={{
                        height: '40px',
                        width: '100%',
                        fontSize: '14px',
                        border:
                          touched.phone && errors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        paddingLeft: '48px',
                      }}
                      containerStyle={{
                        width: '100%',
                      }}
                      buttonStyle={{
                        border:
                          touched.phone && errors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        backgroundColor: '#f9fafb',
                      }}
                    />
                    {touched.phone && errors.phone && (
                      <div className="text-sm text-red-600">{errors.phone}</div>
                    )}
                  </div>
                </div>

                {/* Role and Company */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Shield className="h-4 w-4" />
                    {t('addUser.form.roleAndCompany')}
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="role">
                      {t('addUser.form.role')} {t('addUser.form.required')}
                    </Label>
                    <Select
                      value={values.role}
                      onValueChange={(value) => setFieldValue('role', value)}
                    >
                      <SelectTrigger
                        className={touched.role && errors.role ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder={t('addUser.form.rolePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(role)}
                              {getRoleLabel(role)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched.role && errors.role && (
                      <div className="text-sm text-red-600">{errors.role}</div>
                    )}
                  </div>

                  {needsCompanyName && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        {t('addUser.form.companyName')} {t('addUser.form.required')}
                      </Label>
                      <Input
                        name="companyName"
                        id="companyName"
                        type="text"
                        placeholder={t('addUser.form.companyNamePlaceholder')}
                        value={values.companyName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={
                          touched.companyName && errors.companyName ? 'border-red-500' : ''
                        }
                      />
                      {touched.companyName && errors.companyName && (
                        <div className="text-sm text-red-600">{errors.companyName}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Shield className="h-4 w-4" />
                    {t('addUser.form.password')}
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {t('addUser.form.passwordField')} {t('addUser.form.required')}
                    </Label>
                    <div className="relative">
                      <Input
                        name="password"
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('addUser.form.passwordPlaceholder')}
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={touched.password && errors.password ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {touched.password && errors.password && (
                      <div className="text-sm text-red-600">{errors.password}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t('addUser.form.confirmPassword')} {t('addUser.form.required')}
                    </Label>
                    <div className="relative">
                      <Input
                        name="confirmPassword"
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('addUser.form.confirmPasswordPlaceholder')}
                        value={values.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={
                          touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : ''
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <div className="text-sm text-red-600">{errors.confirmPassword}</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                  >
                    {isSubmitting ? t('addUser.form.creating') : t('addUser.form.createButton')}
                  </Button>
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {t('addUser.form.cancelButton')}
                    </Button>
                  )}
                </div>
              </Form>
            );
          }}
        </Formik>
      </CardContent>
    </Card>
  );
}

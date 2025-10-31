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
import {
  useAdminTranslation,
  useCommonTranslation,
  useFormsTranslation,
} from '@/hooks/useTranslation';

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

const createValidationSchema = (tAdmin: (key: string) => string, tForms: (key: string) => string) =>
  Yup.object({
    firstName: Yup.string().trim().required(tForms('validation.required')),
    lastName: Yup.string().trim().required(tForms('validation.required')),
    email: Yup.string()
      .trim()
      .required(tForms('validation.required'))
      .email(tForms('validation.email')),
    password: Yup.string()
      .required(tForms('validation.required'))
      .min(8, tAdmin('addUser.form.validation.passwordMinLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
        tAdmin('addUser.form.validation.passwordComplexity')
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
      then: (schema) => schema.required(tAdmin('addUser.form.validation.companyRequired')),
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
  const { t: tAdmin } = useAdminTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tForms } = useFormsTranslation();

  const validationSchema = createValidationSchema(tAdmin, tForms);

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
        return tCommon('roles.admin');
      case 'affreteur':
        return tCommon('roles.affreteur');
      case 'transporteur':
        return tCommon('roles.transporteur');
      case 'client':
        return tCommon('roles.client');
      default:
        return role;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {tAdmin('addUser.form.title')}
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
                    {tAdmin('addUser.form.personalInfo')}
                  </div>
                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{tForms('labels.firstName')}*</Label>
                      <Input
                        name="firstName"
                        id="firstName"
                        type="text"
                        placeholder={tForms('placeholders.firstName')}
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
                      <Label htmlFor="lastName">{tForms('labels.lastName')}*</Label>
                      <Input
                        name="lastName"
                        id="lastName"
                        type="text"
                        placeholder={tForms('placeholders.lastName')}
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
                    {tAdmin('addUser.form.contactInfo')}
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="email">{tForms('labels.email')}*</Label>
                    <Input
                      name="email"
                      id="email"
                      type="email"
                      placeholder={tForms('placeholders.enterEmail')}
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
                    <Label htmlFor="phone">{tForms('labels.phone')}*</Label>
                    <PhoneInput
                      specialLabel=""
                      placeholder={tForms('placeholders.enterPhone')}
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
                    {tAdmin('addUser.form.roleAndCompany')}
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="role">{tForms('labels.role')}*</Label>
                    <Select
                      value={values.role}
                      onValueChange={(value) => setFieldValue('role', value)}
                    >
                      <SelectTrigger
                        className={touched.role && errors.role ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder={tForms('placeholders.rolePlaceholder')} />
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
                      <Label htmlFor="companyName">{tForms('labels.companyName')}*</Label>
                      <Input
                        name="companyName"
                        id="companyName"
                        type="text"
                        placeholder={tForms('labels.companyName')}
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
                    {tForms('labels.password')}
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="password">{tForms('labels.password')}*</Label>
                    <div className="relative">
                      <Input
                        name="password"
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={tForms('placeholderss.enterPassword')}
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
                    <Label htmlFor="confirmPassword">{tForms('labels.confirmPassword')}*</Label>
                    <div className="relative">
                      <Input
                        name="confirmPassword"
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={tForms('labels.confirmPasswordPlaceholder')}
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
                    {isSubmitting
                      ? tForms('messages.creating')
                      : tAdmin('addUser.form.createButton')}
                  </Button>
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {tCommon('actions.cancel')}
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

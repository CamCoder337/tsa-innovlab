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
import { VALIDATION_MESSAGES } from '@/lib/validation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Shield, Building } from 'lucide-react';

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

const validationSchema = Yup.object({
  firstName: Yup.string().trim().required(VALIDATION_MESSAGES.REQUIRED_NAME),
  lastName: Yup.string().trim().required(VALIDATION_MESSAGES.REQUIRED_FIRSTNAME),
  email: Yup.string()
    .trim()
    .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
    .email(VALIDATION_MESSAGES.INVALID_EMAIL),
  password: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED_PASSWORD)
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
    ),
  confirmPassword: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED_PASSWORD)
    .oneOf([Yup.ref('password')], VALIDATION_MESSAGES.PASSWORDS_NOT_MATCH),
  phone: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED_PHONE)
    .test('isValidPhone', VALIDATION_MESSAGES.INVALID_PHONE, (value, context) => {
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
    .required(VALIDATION_MESSAGES.REQUIRED_ROLE)
    .oneOf(ALL_USER_ROLES, VALIDATION_MESSAGES.INVALID_ROLE),
  companyName: Yup.string().when('role', {
    is: (role: UserRole) => role === 'affreteur' || role === 'transporteur',
    then: (schema) => schema.required("Le nom de l'entreprise est requis pour ce rôle"),
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
        return 'Administrateur';
      case 'affreteur':
        return 'Affréteur';
      case 'transporteur':
        return 'Transporteur';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Ajouter un Utilisateur
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
                    Informations Personnelles
                  </div>
                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nom *</Label>
                      <Input
                        name="firstName"
                        id="firstName"
                        type="text"
                        placeholder="Nom de famille"
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
                      <Label htmlFor="lastName">Prénom *</Label>
                      <Input
                        name="lastName"
                        id="lastName"
                        type="text"
                        placeholder="Prénom"
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
                    Informations de Contact
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      name="email"
                      id="email"
                      type="email"
                      placeholder="adresse@email.com"
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
                    <Label htmlFor="phone">Téléphone *</Label>
                    <PhoneInput
                      specialLabel=""
                      placeholder="237 6 55 55 55 55"
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
                    Rôle et Entreprise
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle *</Label>
                    <Select
                      value={values.role}
                      onValueChange={(value) => setFieldValue('role', value)}
                    >
                      <SelectTrigger
                        className={touched.role && errors.role ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Sélectionner un rôle" />
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
                      <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                      <Input
                        name="companyName"
                        id="companyName"
                        type="text"
                        placeholder="Nom de l'entreprise"
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
                    Mot de Passe
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <div className="relative">
                      <Input
                        name="password"
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mot de passe"
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
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                    <div className="relative">
                      <Input
                        name="confirmPassword"
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirmer le mot de passe"
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
                    {isSubmitting ? 'Création...' : "Créer l'utilisateur"}
                  </Button>
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Annuler
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

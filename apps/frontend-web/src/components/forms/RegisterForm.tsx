import { Link } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import libphonenumber from 'google-libphonenumber';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { RegisterFormData } from '@/types/forms.types';
import type { UserRole, CreateUserRequest } from '@/types/auth.types';
import { VALIDATION_MESSAGES } from '@/lib/validation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  useAuthTranslation,
  useCommonTranslation,
  useFormsTranslation,
} from '@/hooks/useTranslation';

const INITIAL_VALUES: RegisterFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  country: 'cm',
  role: 'affreteur',
};

const USER_ROLES: UserRole[] = ['affreteur', 'transporteur', 'client'];

const validationSchema = (t: (key: string) => string) =>
  Yup.object({
    firstName: Yup.string().trim().required(t('validation.required')),
    lastName: Yup.string().trim().required(t('validation.required')),
    email: Yup.string().trim().required(t('validation.required')).email(t('validation.email')),
    password: Yup.string()
      .required(t('validation.required'))
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/, t('validation.password')),
    confirmPassword: Yup.string()
      .required(t('validation.required'))
      .oneOf([Yup.ref('password')], t('validation.passwordMatch')),
    phone: Yup.string()
      .required(t('validation.required'))
      .test('isValidPhone', t('validation.phone'), (value, context) => {
        try {
          const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
          const countryCode = context.parent.country || 'CM'; // Default to Cameroon if not provided
          const number = phoneUtil.parseAndKeepRawInput(value, countryCode.toUpperCase());
          return phoneUtil.isValidNumber(number);
        } catch (error) {
          console.error(error);
          return false;
        }
      }),

    role: Yup.string().required(t('validation.required')).oneOf(USER_ROLES, t('validation.role')),
  });

interface RegisterFormProps {
  onSubmit: (data: CreateUserRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export default function RegisterForm({ onSubmit, isSubmitting = false }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t: tAuth } = useAuthTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tForms } = useFormsTranslation();

  return (
    <Formik<RegisterFormData>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema(tForms)}
      onSubmit={onSubmit}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
        setValues,
      }) => {
        const handleChangePhoneNumber = (value: string, country: { countryCode: string }) => {
          const countryCode = country.countryCode.toLowerCase();
          setValues({
            ...values,
            phone: value,
            country: countryCode,
          });
        };

        return (
          <Form className="space-y-8">
            <div className="grid md:grid-cols-2 md:gap-4 gap-8">
              <div className="flex flex-col gap-4">
                <Input
                  name="firstName"
                  id="firstName"
                  aria-label="firstName"
                  type="text"
                  placeholder={tForms('labels.firstName')}
                  value={values.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                  required
                />
                {touched.firstName && errors.firstName ? (
                  <div className="text-sm text-red-600">{errors.firstName}</div>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  name="lastName"
                  id="lastName"
                  aria-label="lastName"
                  type="text"
                  placeholder={tForms('labels.lastName')}
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                  required
                />
                {touched.lastName && errors.lastName ? (
                  <div className="text-sm text-red-600">{errors.lastName}</div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Input
                name="email"
                id="email"
                aria-label="email"
                type="email"
                placeholder={tForms('labels.email')}
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                required
              />
              {touched.email && errors.email ? (
                <div className="text-sm text-red-600">{errors.email}</div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <Input
                  name="password"
                  id="password"
                  aria-label="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={tForms('labels.password')}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {touched.password && errors.password ? (
                <div className="text-sm text-red-600">{errors.password}</div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <Input
                  name="confirmPassword"
                  id="confirmPassword"
                  aria-label="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={tForms('labels.confirmPassword')}
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                  required
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
              {touched.confirmPassword && errors.confirmPassword ? (
                <div className="text-sm text-red-600">{errors.confirmPassword}</div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <PhoneInput
                aria-label="phone"
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
                  color: 'var(--tsa-blue)',
                  fontWeight: '500',
                  fontSize: '15px',
                  height: '100%',
                  width: '100%',
                  padding: '0.25rem 3rem',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                }}
                containerStyle={{
                  backgroundColor: 'transparent',
                  border: 'solid 1px var(--tsa-blue)',
                  borderRadius: '8px',
                  height: '3rem',
                }}
                buttonStyle={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRight: '1px solid var(--tsa-blue)',
                }}
                dropdownStyle={{
                  border: '1px solid var(--tsa-blue)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                }}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-tsa-blue/90 flex">
                {tAuth('register.role')}
              </Label>
              <div className="w-full flex flex-1 justify-between max-sm:grid max-sm:grid-cols max-sm:justify-center max-sm:gap-4">
                {USER_ROLES.map((role) => (
                  <Checkbox
                    key={role}
                    checked={values.role === role}
                    onCheckedChange={() => setFieldValue('role', values.role === role ? '' : role)}
                    onError={() => setFieldError('role', VALIDATION_MESSAGES.REQUIRED_ROLE)}
                    label={tCommon(`roles.${role}`)}
                    className="rounded-none"
                    labelClassName="text-tsa-blue/90 text-sm font-medium"
                  />
                ))}
              </div>
              {touched.role && errors.role && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.role}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-tsa-blue/90 hover:bg-tsa-blue/95 text-white font-semibold text-base"
              loading={isSubmitting}
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              {isSubmitting ? tAuth('register.loading') : tAuth('register.button')}
            </Button>

            <div className="text-center">
              <span className="text-gray-600">{tAuth('register.hasAccount')} </span>
              <Link to="/" className="text-tsa-blue hover:text-tsa-blue/95 font-medium">
                {tAuth('login.label')}
              </Link>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

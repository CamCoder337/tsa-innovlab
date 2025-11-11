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

const USER_ROLES: UserRole[] = ['affreteur', 'transporteur'];

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
                  className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                          dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                        text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                          "
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
                  className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                          dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                        text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                          "
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
                className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                          dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                        text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                          "
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
                  className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                          dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                        text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                          "
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
                  className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                          dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                        text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                          "
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
                country="cm"
                enableSearch={true}
                searchPlaceholder={tForms('placeholders.searchCountry')}
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
                // Tailwind-driven styles via className + dynamic dark mode
                inputClass="!text-tsa-blue dark:!text-tsa-white !font-medium !text-base 
                            !h-full !w-full !px-12 !py-1 !border-0 
                            !outline-none placeholder:!text-tsa-blue/60 
                            dark:placeholder:!text-tsa-white/60 focus:!ring-2 
                            focus:!ring-tsa-blue/50 dark:focus:!ring-tsa-blue/40
                            "
                containerClass="!h-12 !bg-transparent dark:!bg-gray-700 !border 
                                !border-tsa-blue dark:!border-tsa-gray !rounded-lg
                                focus-within:!ring-2 focus-within:!ring-tsa-blue/30 
                                dark:focus-within:!ring-tsa-blue/40 transition-all 
                                duration-200"
                buttonClass="!bg-transparent dark:!bg-gray-700 !border-0 !border-r 
                              !border-r-tsa-blue dark:!border-r-tsa-gray 
                              "
                dropdownClass="!border !border-tsa-blue dark:!border-tsa-blue/60 
                              !rounded-lg !shadow-lg !bg-white dark:!bg-gray-700 
                              !text-gray-900 dark:!text-tsa-white !mt-1
                              "
                searchClass="dark:bg-gray-700 !placeholder-tsa-blue/50 dark:!placeholder-tsa-white/50
                            !text-sm !px-3 !py-2
                            "
              />
              {errors.phone && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-1" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            {values.role !== 'client' && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-tsa-blue dark:text-tsa-white/90 flex">
                  {tAuth('register.role')}
                </Label>
                <div className="w-full flex flex-1 justify-between max-sm:grid max-sm:grid-cols max-sm:justify-center max-sm:gap-4">
                  {USER_ROLES.map((role) => (
                    <Checkbox
                      key={role}
                      checked={values.role === role}
                      onCheckedChange={() =>
                        setFieldValue('role', values.role === role ? '' : role)
                      }
                      onError={() => setFieldError('role', tForms('validation.required'))}
                      label={tCommon(`roles.${role}`)}
                      className="rounded-none"
                      labelClassName="text-tsa-blue dark:text-tsa-white/90 text-sm font-medium"
                    />
                  ))}
                </div>
                {touched.role && errors.role && (
                  <p className="text-red-500 text-sm mt-1" role="alert">
                    {errors.role}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 
              hover:bg-tsa-blue active:bg-tsa-blue/80 text-white font-semibold 
              text-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
              loading={isSubmitting}
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              {isSubmitting ? tAuth('register.loading') : tAuth('register.button')}
            </Button>

            <div className="text-center">
              <span className="text-gray-600 dark:text-gray-400">
                {tAuth('register.hasAccount')}{' '}
              </span>
              <Link
                to="/app/login"
                className="text-tsa-blue dark:text-tsa-white hover:underline hover:text-tsa-blue/80 
                dark:hover:text-tsa-blue font-medium text-sm transition-colors "
              >
                {tAuth('login.label')}
              </Link>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

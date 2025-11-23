import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OTPInput from '@/components/ui/otp-input';
import type { LoginCredentials } from '@/types/auth.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Eye, EyeOff, Mail, Phone } from 'lucide-react';
import {
  useAuthTranslation,
  useCommonTranslation,
  useFormsTranslation,
} from '@/hooks/useTranslation';

const INITIAL_VALUES: LoginCredentials = {
  email: '',
  phone: '',
  password: '',
  mfaCode: '',
};

const validationSchema = (
  showMFA: boolean,
  loginMethod: 'email' | 'phone',
  t: (key: string) => string
) =>
  Yup.object({
    email:
      loginMethod === 'email'
        ? Yup.string().trim().required(t('validation.required')).email(t('validation.email'))
        : Yup.string(),
    phone:
      loginMethod === 'phone'
        ? Yup.string().trim().required(t('validation.required'))
        : Yup.string(),
    password: Yup.string().required(t('validation.required')),
    mfaCode: showMFA
      ? Yup.string()
          .required(t('validation.required'))
          .matches(/^\d{6}$/, t('validation.mfa'))
      : Yup.string(),
  });

interface LoginFormProps {
  onSubmit: (data: LoginCredentials) => Promise<void>;
  showMFA: boolean;
  setShowMFA: Dispatch<SetStateAction<boolean>>;
}

export default function LoginForm({ onSubmit, showMFA = false, setShowMFA }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const { t: tAuth } = useAuthTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tForms } = useFormsTranslation();

  return (
    <Formik<LoginCredentials>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema(showMFA, loginMethod, tForms)}
      onSubmit={(values) => {
        // Clean up values based on login method
        const submitValues = { ...values };
        if (loginMethod === 'email') {
          delete submitValues.phone;
        } else {
          delete submitValues.email;
        }
        return onSubmit(submitValues);
      }}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          <div className="flex flex-col gap-2">
            {!showMFA && (
              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    loginMethod === 'email'
                      ? 'bg-white dark:bg-gray-700 text-tsa-blue dark:text-tsa-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  {tForms('labels.email')}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    loginMethod === 'phone'
                      ? 'bg-white dark:bg-gray-700 text-tsa-blue dark:text-tsa-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  {tForms('labels.phone')}
                </button>
              </div>
            )}

            {loginMethod === 'email' ? (
              <Input
                name="email"
                type="email"
                placeholder={tForms('labels.email')}
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-label="email"
                aria-invalid={touched.email && !!errors.email}
                className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                            dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                          text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                            focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                            "
                required
                disabled={showMFA}
              />
            ) : (
              <Input
                name="phone"
                type="tel"
                placeholder={tForms('labels.phone')}
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-label="phone"
                aria-invalid={touched.phone && !!errors.phone}
                className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                            dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                          text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                            focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                            "
                required
                disabled={showMFA}
              />
            )}
            <div className="flex justify-between">
              <div className="w-1/2 text-sm text-red-600">
                {loginMethod === 'email'
                  ? touched.email && errors.email
                    ? errors.email
                    : null
                  : touched.phone && errors.phone
                    ? errors.phone
                    : null}
              </div>
              {!showMFA && (
                <Link
                  to="/verify-email"
                  className="text-tsa-blue dark:text-tsa-white font-medium text-sm"
                >
                  {tAuth('login.verifyEmail')}
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={tForms('labels.password')}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-label="password"
                aria-invalid={touched.password && !!errors.password}
                className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                          dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                        text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                          "
                required
                disabled={showMFA}
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
            <div className="flex justify-between">
              <div className="w-1/2 text-sm text-red-600">
                {touched.password && errors.password ? errors.password : null}
                {}
              </div>
              {!showMFA && (
                <Link
                  to="/forgot-password"
                  className="text-tsa-blue dark:text-tsa-white text-sm font-medium"
                >
                  {tAuth('login.forgotPassword')}
                </Link>
              )}
            </div>
          </div>

          {showMFA && (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <p className="text-sm text-tsa-gray dark:text-tsa-white mb-2">
                  {tAuth('mfa.subtitle')}
                </p>
              </div>
              <OTPInput
                length={6}
                aria-label="mfaCode"
                value={values.mfaCode || ''}
                onChange={(value) => {
                  handleChange({
                    target: {
                      name: 'mfaCode',
                      value: value,
                    },
                  });
                }}
                disabled={isSubmitting}
                className="mb-2"
                autoFocus={showMFA}
              />
              {touched.mfaCode && errors.mfaCode ? (
                <div className="text-sm text-red-600 text-center">{errors.mfaCode}</div>
              ) : null}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowMFA(false);
                    setFieldValue('mfaCode', '');
                  }}
                  className="text-tsa-blue dark:text-tsa-white text-sm font-medium"
                >
                  {tAuth('mfa.backToLogin')}
                </button>
              </div>
            </div>
          )}

          <Button
            name="login"
            type="submit"
            className="px-2 w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 
              hover:bg-tsa-blue active:bg-tsa-blue/80 text-white font-semibold 
              text-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-4"></div>
                {showMFA ? tAuth('mfa.verifying') : tAuth('login.loading')}
              </>
            ) : showMFA ? (
              tAuth('mfa.verify')
            ) : (
              tAuth('login.button')
            )}
          </Button>

          {!showMFA && (
            <div className="text-center flex flex-col gap-3">
              <div className="text-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {tAuth('login.noAccount')}{' '}
                </span>
                <Link
                  to="/register"
                  className="text-tsa-blue dark:text-tsa-white hover:underline hover:text-tsa-blue/80 
                dark:hover:text-tsa-blue font-medium text-sm transition-colors"
                >
                  {tAuth('register.label')}
                </Link>
              </div>
              <span className="text-gray-500 dark:text-white text-sm font-bold transition-colors">
                {tCommon('or')}
              </span>
              <Link
                to="/app/register"
                className="text-tsa-blue dark:text-tsa-white hover:underline hover:text-tsa-blue/80 
                dark:hover:text-tsa-blue text-base font-medium transition-colors"
              >
                {tAuth('login.client.redirect')}
              </Link>
              <Link to="/" className="text-gray-500 dark:text-white text-sm transition-colors">
                {tAuth('common.backToHome')}
              </Link>
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
}

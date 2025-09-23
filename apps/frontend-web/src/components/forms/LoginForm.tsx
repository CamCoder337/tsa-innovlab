import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OTPInput from '@/components/ui/otp-input';
import type { LoginCredentials } from '@/types/auth.types';
import { VALIDATION_MESSAGES } from '@/lib/validation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import type { Dispatch, SetStateAction } from 'react';

const INITIAL_VALUES: LoginCredentials = {
  email: '',
  password: '',
  mfaCode: '',
};

const validationSchema = (showMFA: boolean) =>
  Yup.object({
    email: Yup.string()
      .trim()
      .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
      .email(VALIDATION_MESSAGES.INVALID_EMAIL),
    password: Yup.string().required(VALIDATION_MESSAGES.REQUIRED_PASSWORD),
    mfaCode: showMFA
      ? Yup.string()
          .required('Code MFA requis')
          .matches(/^\d{6}$/, 'Le code MFA doit contenir exactement 6 chiffres')
      : Yup.string(),
  });

interface LoginFormProps {
  onSubmit: (data: LoginCredentials) => Promise<void>;
  showMFA: boolean;
  setShowMFA: Dispatch<SetStateAction<boolean>>;
}

export default function LoginForm({ onSubmit, showMFA = false, setShowMFA }: LoginFormProps) {
  return (
    <Formik<LoginCredentials>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema(showMFA)}
      onSubmit={onSubmit}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          <div className="flex flex-col gap-2">
            <Input
              name="email"
              type="email"
              placeholder="Entrez votre Email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-label="email"
              aria-invalid={touched.email && !!errors.email}
              className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
              required
              disabled={showMFA}
            />
            {touched.email && errors.email ? (
              <div className="text-sm text-red-600">{errors.email}</div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Input
              name="password"
              type="password"
              placeholder="Entrez votre Mot de passe"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-label="password"
              aria-invalid={touched.password && !!errors.password}
              className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
              required
              disabled={showMFA}
            />
            <div className="flex justify-between">
              <div className="w-1/2 text-sm text-red-600">
                {touched.password && errors.password ? errors.password : null}
                {}
              </div>
              {!showMFA && (
                <Link to="/forgot-password" className="text-tsa-blue text-sm font-medium">
                  Mot de passe oublié ?
                </Link>
              )}
            </div>
          </div>

          {showMFA && (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <p className="text-sm text-tsa-gray mb-2">
                  Entrez le code à 6 chiffres de votre application d'authentification
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
                  className="text-tsa-blue text-sm font-medium"
                >
                  Retour à la connexion
                </button>
              </div>
            </div>
          )}

          <Button
            name="login"
            type="submit"
            className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 text-white font-semibold text-2xl p-10"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-4"></div>
                {showMFA ? 'VÉRIFICATION...' : 'CONNEXION...'}
              </>
            ) : showMFA ? (
              'VÉRIFIER LE CODE'
            ) : (
              'JE ME CONNECTE'
            )}
          </Button>

          {!showMFA && (
            <>
              <div className="text-center">
                <span className="text-gray-600">Pas encore de compte ? </span>
                <Link to="/register" className="text-tsa-blue font-medium">
                  Je m'inscris
                </Link>
              </div>
              <div className="text-center">
                <Link to="/verify-email" className="text-tsa-blue font-medium">
                  Vérifier mon email
                </Link>
              </div>
            </>
          )}
        </Form>
      )}
    </Formik>
  );
}

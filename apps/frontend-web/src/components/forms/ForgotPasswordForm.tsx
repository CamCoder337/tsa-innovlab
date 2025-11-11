import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthTranslation, useFormsTranslation } from '@/hooks/useTranslation';
import type { ForgotPasswordRequest } from '@/types/auth.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

const INITIAL_VALUES: ForgotPasswordRequest = {
  email: '',
};

const validationSchema = (tForms: (key: string) => string) =>
  Yup.object({
    email: Yup.string().email(tForms('validation.email')).required(tForms('validation.required')),
  });

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordRequest) => Promise<void>;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
}

export default function ForgotPasswordForm({
  onSubmit,
  isSubmitting = false,
  isSubmitted = false,
}: ForgotPasswordFormProps) {
  const { t: tForms } = useFormsTranslation();
  const { t: tAuth } = useAuthTranslation();
  const navigate = useNavigate();

  return (
    <Formik<ForgotPasswordRequest>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema(tForms)}
      onSubmit={onSubmit}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ values, errors, touched, handleChange, handleBlur }) =>
        isSubmitted ? (
          <>
            <p className="text-gray-600 dark:text-tsa-white mb-6">
              {tAuth('forgotPassword.successMessage')} <strong>{values.email}</strong>
            </p>
            <Button
              className="w-full h-12 bg-tsa-blue/90 text-white font-semibold"
              onClick={() => navigate(-1)}
            >
              {tAuth('forgotPassword.returnToLogin')}
            </Button>
          </>
        ) : (
          <Form className="space-y-6">
            <div className="flex flex-col gap-2">
              <Input
                name="email"
                type="email"
                placeholder={tForms('placeholders.enterEmail')}
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={touched.email && !!errors.email}
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

            <Button
              type="submit"
              className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 
              hover:bg-tsa-blue active:bg-tsa-blue/80 text-white font-semibold 
              text-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {tAuth('forgotPassword.sendLink')}
            </Button>

            <div
              className="text-center text-tsa-blue dark:text-tsa-white hover:underline 
                          font-medium text-sm transition-colors cursor-pointer"
              onClick={() => navigate(-1)}
            >
              {tAuth('forgotPassword.backToLogin')}
            </div>
          </Form>
        )
      }
    </Formik>
  );
}

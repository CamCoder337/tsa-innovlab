import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VerifyEmailFormData } from '@/types/forms.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useFormsTranslation } from '@/hooks/useTranslation';

const createValidationSchema = (tForms: (key: string) => string) =>
  Yup.object({
    email: Yup.string()
      .trim()
      .required(tForms('validation.required'))
      .email(tForms('validation.email')),
    token: Yup.string().trim().required(tForms('validation.required')),
  });

interface VerifyEmailFormProps {
  initialValues: VerifyEmailFormData;
  onSubmit: (data: VerifyEmailFormData) => Promise<void>;
  isAutoVerifying?: boolean;
}

export default function VerifyEmailForm({
  initialValues,
  onSubmit,
  isAutoVerifying = false,
}: VerifyEmailFormProps) {
  const { t: tForms } = useFormsTranslation();
  const navigate = useNavigate();

  return (
    <Formik<VerifyEmailFormData>
      initialValues={initialValues}
      validationSchema={createValidationSchema(tForms)}
      enableReinitialize={true}
      onSubmit={onSubmit}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => {
        // Show loading state during submission or auto-verification
        if (isSubmitting || isAutoVerifying) {
          return (
            <div className="space-y-6 text-center">
              <div className="text-tsa-blue dark:text-tsa-white font-medium">
                {tForms('messages.autoVerifying')}
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tsa-blue mx-auto"></div>
            </div>
          );
        }

        return (
          <Form className="space-y-6">
            {/* Email Field */}
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
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {errors.email}
                </div>
              ) : null}
            </div>

            {/* Token Field */}
            <div className="flex flex-col gap-2">
              <Input
                name="token"
                type="text"
                placeholder={tForms('placeholders.enterVerificationCode')}
                value={values.token}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={touched.token && !!errors.token}
                className="h-12 border-tsa-blue dark:border-tsa-gray placeholder:text-tsa-blue/70 
                          dark:placeholder:text-tsa-white/50 bg-white dark:bg-gray-700 
                        text-gray-900 dark:text-tsa-white placeholder:text-sm placeholder:font-medium
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50
                          "
                required
              />
              {touched.token && errors.token ? (
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {errors.token}
                </div>
              ) : null}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 
              hover:bg-tsa-blue active:bg-tsa-blue/80 text-white font-semibold 
              text-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
              disabled={isSubmitting}
            >
              {tForms('buttons.verify')}
            </Button>

            {/* Back to Login Link */}
            <div
              className="text-center text-tsa-blue dark:text-tsa-white hover:underline 
                          font-medium text-sm transition-colors"
              onClick={() => navigate(-1)}
            >
              {tForms('buttons.backToLogin')}
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

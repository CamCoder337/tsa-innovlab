import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VerifyEmailFormData } from '@/types/forms.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { VALIDATION_MESSAGES } from '@/lib/validation';

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
    .email(VALIDATION_MESSAGES.INVALID_EMAIL),
  token: Yup.string().trim().required('Code requis'),
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
  return (
    <Formik<VerifyEmailFormData>
      initialValues={initialValues}
      validationSchema={validationSchema}
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
              <div className="text-tsa-blue font-medium">Vérification automatique en cours...</div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tsa-blue mx-auto"></div>
            </div>
          );
        }

        return (
          <Form className="space-y-6">
            <div className="flex flex-col gap-2">
              <Input
                name="email"
                type="email"
                placeholder="Entrez votre Email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={touched.email && !!errors.email}
                className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                required
              />
              {touched.email && errors.email ? (
                <div className="text-sm text-red-600">{errors.email}</div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Input
                name="token"
                type="text"
                placeholder="Entrez votre Code"
                value={values.token}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={touched.token && !!errors.token}
                className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                required
              />
              {touched.token && errors.token ? (
                <div className="text-sm text-red-600">{errors.token}</div>
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 text-white font-semibold text-2xl p-10"
              disabled={isSubmitting}
            >
              VÉRIFIER
            </Button>

            <div className="text-center">
              <Link to="/" className="text-tsa-blue font-medium">
                Retour à la connexion
              </Link>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VerifyEmailFormData } from '@/types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { VALIDATION_MESSAGES } from '@/utils/validation';

const INITIAL_VALUES: VerifyEmailFormData = {
  email: '',
  code: '',
};

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
    .email(VALIDATION_MESSAGES.INVALID_EMAIL),
  code: Yup.string().trim().required('Code requis'),
});

interface VerifyEmailFormProps {
  onSubmit: (data: VerifyEmailFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export default function VerifyEmailForm({ onSubmit, isSubmitting = false }: VerifyEmailFormProps) {
  return (
    <Formik<VerifyEmailFormData>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ values, errors, touched, handleChange, handleBlur }) => (
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
              name="code"
              type="text"
              placeholder="Entrez votre Code"
              value={values.code}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={touched.code && !!errors.code}
              className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
              required
            />
            {touched.code && errors.code ? (
              <div className="text-sm text-red-600">{errors.code}</div>
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
      )}
    </Formik>
  );
}

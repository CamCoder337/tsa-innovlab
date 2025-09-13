import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LoginFormData } from '@/types';
import { VALIDATION_MESSAGES } from '@/utils/validation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

const INITIAL_VALUES: LoginFormData = {
  email: '',
  password: '',
};

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
    .email(VALIDATION_MESSAGES.INVALID_EMAIL),
  password: Yup.string().required(VALIDATION_MESSAGES.REQUIRED_PASSWORD),
});

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export default function LoginForm({ onSubmit, isSubmitting = false }: LoginFormProps) {
  return (
    <Formik<LoginFormData>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ values, errors, touched, handleChange, handleBlur }) => (
        <Form className="space-y-4">
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
              name="password"
              type="password"
              placeholder="Entrez votre Mot de passe"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={touched.password && !!errors.password}
              className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
              required
            />
            <div className="flex justify-between">
              <div className="w-1/2 text-sm text-red-600">
                {touched.password && errors.password ? errors.password : null}
              </div>
              <Link to="/forgot-password" className="text-tsa-blue text-sm font-medium">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 text-white font-semibold text-2xl p-10"
            disabled={isSubmitting}
          >
            JE ME CONNECTE
          </Button>

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
        </Form>
      )}
    </Formik>
  );
}

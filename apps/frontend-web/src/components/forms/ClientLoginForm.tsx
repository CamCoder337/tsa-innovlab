import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthTranslation, useFormsTranslation } from '@/hooks/useTranslation';

interface ClientLoginFormData {
  email: string;
  password: string;
}

const INITIAL_VALUES: ClientLoginFormData = {
  email: '',
  password: '',
};

const validationSchema = (t: (key: string) => string) =>
  Yup.object({
    email: Yup.string().trim().required(t('validation.required')).email(t('validation.email')),
    password: Yup.string().required(t('validation.required')),
  });

interface ClientLoginFormProps {
  onSubmit: (data: ClientLoginFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export default function ClientLoginForm({ onSubmit, isSubmitting = false }: ClientLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t: tAuth } = useAuthTranslation();
  const { t: tForms } = useFormsTranslation();

  return (
    <Formik<ClientLoginFormData>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema(tForms)}
      onSubmit={onSubmit}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ values, errors, touched, handleChange, handleBlur }) => {
        return (
          <Form className="space-y-6">
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
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50"
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
                          focus:ring-2 focus:ring-tsa-blue focus:border-tsa-blue dark:focus:ring-tsa-blue/50"
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

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-tsa-blue hover:underline dark:text-tsa-white"
              >
                {tAuth('login.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-4/5 justify-self-center flex h-12 bg-green-600 
              hover:bg-green-700 active:bg-green-600/80 text-white font-semibold 
              text-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
              loading={isSubmitting}
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              {isSubmitting ? tAuth('login.loading') : tAuth('login.client.link')}
            </Button>

            <div className="text-center">
              <span className="text-gray-600 dark:text-gray-400">{tAuth('login.noAccount')} </span>
              <Link
                to="/register"
                className="text-tsa-blue dark:text-tsa-white hover:underline hover:text-tsa-blue/80 
                dark:hover:text-tsa-blue font-medium text-sm transition-colors"
              >
                {tAuth('register.client.button')}
              </Link>
            </div>

            <div className="text-center flex flex-col gap-2">
              <Link
                to="/app/login"
                className="text-gray-500 dark:text-white text-sm transition-colors"
              >
                {tAuth('login.client.redirect')}
              </Link>
              <Link to="/" className="text-gray-500 dark:text-white text-sm transition-colors">
                {tAuth('common.backToHome')}
              </Link>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

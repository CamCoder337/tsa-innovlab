import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { VALIDATION_MESSAGES } from '@/lib/validation';
import bg from '@/assets/login-background.png';
import logo from '@/assets/logo_white_bg.png';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { useAuthTranslation } from '@/hooks/useTranslation';
import LanguageDropdown from '@/components/ui/LanguageDropdown';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

const INITIAL_VALUES = {
  email: '',
};

const ForgotPassword: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { t } = useAuthTranslation();

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* Language Dropdown - Bottom Right */}
          <div className="absolute top-10 right-4">
            <LanguageDropdown position="bottom-right" />
          </div>

          <div className="w-full xl:max-w-3/4 md:max-w-xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-medium mb-2 text-tsa-blue">
                {t('forgotPassword.title')}
              </h1>
              <p className="text-sm font-semibold text-tsa-gray">{t('forgotPassword.subtitle')}</p>
            </div>

            <Card className="shadow-xl bg-[#D9D9D980]">
              <CardContent className="px-8">
                <Formik
                  initialValues={INITIAL_VALUES}
                  validationSchema={Yup.object({
                    email: Yup.string()
                      .email(VALIDATION_MESSAGES.INVALID_EMAIL)
                      .required(VALIDATION_MESSAGES.REQUIRED_EMAIL),
                  })}
                  onSubmit={async (data, { setSubmitting }) => {
                    try {
                      setIsSubmitted(true);

                      const response = await authService.forgotPassword(data.email);

                      if (response.error) {
                        toast.error(response.error.message);
                        return;
                      }

                      toast.success(t('forgotPassword.successMessage'));
                    } catch (error) {
                      console.error('Forgot password failed:', error);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  validateOnBlur={true}
                  validateOnChange={true}
                >
                  {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) =>
                    isSubmitted || isSubmitting ? (
                      <>
                        <p className="text-gray-600 mb-6">
                          {t('forgotPassword.successMessage')} <strong>{values.email}</strong>
                        </p>
                        <Link to="/">
                          <Button className="w-full h-12 bg-tsa-blue/90 text-white font-semibold">
                            {t('forgotPassword.returnToLogin')}
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Form className="space-y-6">
                        <div className="flex flex-col gap-2">
                          <Input
                            name="email"
                            type="email"
                            placeholder={t('forgotPassword.emailPlaceholder')}
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

                        <Button
                          type="submit"
                          className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 text-white font-semibold text-2xl p-10"
                          loading={isSubmitting}
                          disabled={isSubmitting}
                        >
                          {t('forgotPassword.sendLink')}
                        </Button>

                        <div className="text-center">
                          <Link to="/" className="text-tsa-blue font-medium">
                            {t('forgotPassword.backToLogin')}
                          </Link>
                        </div>
                      </Form>
                    )
                  }
                </Formik>
              </CardContent>
            </Card>
          </div>
        </div>
        <div
          className="hidden lg:flex flex-1 p-8 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg})` }}
        >
          <div className="fixed top-3 right-3">
            <img src={logo} alt="TSA Logistics" width={150} height={150} />
          </div>
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
};

export default ForgotPassword;

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import bg from '@/assets/login-background.png';
import logo from '@/assets/logo_white_bg.png';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import type { VerifyEmailFormData } from '@/types/forms.types';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import VerifyEmailForm from '@/components/forms/VerifyEmailForm';
import { useAuthTranslation } from '@/hooks/useTranslation';
import LanguageDropdown from '@/components/ui/LanguageDropdown';
// import { ThemeToggle } from '@/components/theme/ThemeToggle';

const INITIAL_VALUES: VerifyEmailFormData = { email: '', token: '' };

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initialValues, setInitialValues] = useState<VerifyEmailFormData>(INITIAL_VALUES);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const { t: tAuth } = useAuthTranslation();

  const handleAutoVerification = useCallback(
    async (values: VerifyEmailFormData) => {
      try {
        setIsAutoVerifying(true);
        const response = await authService.verifyEmail(values.token);

        if (response.error) {
          console.error('Auto verification failed:', response.error);
          if (response.error.errors?.[0] === 'Invalid or expired token') {
            toast.error(tAuth('verifyEmail.invalidToken'));
          }
          return;
        }

        toast.success(tAuth('verifyEmail.successMessage'));
        localStorage.removeItem('verificationEmail');
        navigate('/');
      } catch (error) {
        console.error('Verification error:', error);
        toast.error(tAuth('verifyEmail.errorMessage'));
        return;
      } finally {
        setIsAutoVerifying(false);
      }
    },
    [navigate, tAuth]
  );

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem('verificationEmail');
    // Get token from URL parameters
    const tokenFromUrl = searchParams.get('token') || '';

    // If token is in URL and email is available, auto-verify
    if (tokenFromUrl && storedEmail) {
      const values = { token: tokenFromUrl, email: storedEmail };
      setInitialValues(values);
      handleAutoVerification(values);
    } else if (storedEmail) {
      setInitialValues((prev) => ({ ...prev, email: storedEmail }));
    }
  }, [searchParams, handleAutoVerification]);

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* Language Dropdown - Bottom Right */}
          <div className="absolute top-10 right-4 flex gap-4">
            {/* <ThemeToggle /> */}
            <LanguageDropdown position="bottom-right" />
          </div>

          <div className="w-full xl:max-w-3/4 md:max-w-xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-medium mb-2 text-tsa-blue dark:text-tsa-white">
                {tAuth('verifyEmail.title')}
              </h1>
              <p className="text-sm font-semibold dark:text-gray-300 text-tsa-gray">
                {tAuth('verifyEmail.subtitle')}
              </p>
            </div>

            <Card className="shadow-xl bg-[#D9D9D980] dark:bg-gray-800 transition-colors duration-200">
              <CardContent className="px-8 py-6">
                <VerifyEmailForm
                  initialValues={initialValues}
                  onSubmit={handleAutoVerification}
                  isAutoVerifying={isAutoVerifying}
                />
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

export default VerifyEmail;

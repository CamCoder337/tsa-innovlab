import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import bg from '@/assets/login-background.png';
import logo from '@/assets/logo_white_bg.png';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { useAuthTranslation } from '@/hooks/useTranslation';
import LanguageDropdown from '@/components/ui/LanguageDropdown';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';
import type { ForgotPasswordRequest } from '@/types/auth.types';
// import { ThemeToggle } from '@/components/theme/ThemeToggle';

const ForgotPassword: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { t: tAuth } = useAuthTranslation();

  const handleForgotPassword = async (data: ForgotPasswordRequest) => {
    try {
      setIsSubmitting(true);

      const response = await authService.forgotPassword(data.email);

      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      setIsSubmitted(true);
      toast.success(tAuth('forgotPassword.successMessage'));
    } catch (error) {
      console.error('Forgot password failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {tAuth('forgotPassword.title')}
              </h1>
              <p className="text-sm font-semibold text-tsa-gray">
                {tAuth('forgotPassword.subtitle')}
              </p>
            </div>

            <Card className="shadow-xl bg-[#D9D9D980] dark:bg-gray-800 transition-colors duration-200">
              <CardContent className="px-8 py-6">
                <ForgotPasswordForm
                  onSubmit={handleForgotPassword}
                  isSubmitting={isSubmitting}
                  isSubmitted={isSubmitted}
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

export default ForgotPassword;

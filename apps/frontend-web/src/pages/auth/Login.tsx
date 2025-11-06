import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import bg from '@/assets/login-background.png';
import logo from '@/assets/logo_white_bg.png';
import { useAuth } from '@/hooks/useAuth';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { toast } from 'sonner';
import LoginForm from '@/components/forms/LoginForm';
import type { LoginCredentials } from '@/types/auth.types';
import {
  useAuthTranslation,
  useCommonTranslation,
  useErrorsTranslation,
} from '@/hooks/useTranslation';
import LanguageDropdown from '@/components/ui/LanguageDropdown';
import { useAuthStore } from '@/stores/authStore';
// import { ThemeToggle } from '@/components/theme/ThemeToggle';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showMfaField, setShowMfaField] = useState(false);
  const { t: tAuth } = useAuthTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();

  const handleLogin = async (data: LoginCredentials) => {
    const response = await login(data);

    const { error } = useAuthStore.getState();

    // Handle login failure
    if (error) {
      toast.error(tErrors(`auth.${error}`));
      if (localStorage.getItem('verificationEmail')) {
        navigate('/verify-email');
      }
      return;
    }

    // Handle MFA requirement
    if (response === 'mfa_required') {
      setShowMfaField(true);
      toast(tAuth('mfa.title'), {
        icon: '⚠️',
      });
      return;
    }

    // Handle successful login
    toast.success(tAuth('login.success'));
  };

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* Language Dropdown - Bottom Right */}
          <div className="absolute top-10 right-4 flex gap-4">
            {/* <ThemeToggle /> */}
            <LanguageDropdown position="bottom-right" />
          </div>

          <div className="w-full xl:max-w-3/4 md:max-w-xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-medium mb-2 text-tsa-blue dark:text-tsa-white">
                {tAuth('login.title')}
              </h1>
              <p className="text-sm font-semibold text-gray-400">{tCommon('app.tagline')}</p>
            </div>

            <Card className="shadow-xl bg-[#D9D9D980] dark:bg-gray-800 transition-colors duration-200">
              <CardContent className="px-8 py-6">
                <LoginForm
                  onSubmit={handleLogin}
                  showMFA={showMfaField}
                  setShowMFA={setShowMfaField}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Image/Graphics placeholder */}
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

export default Login;

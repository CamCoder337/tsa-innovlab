import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import type { CreateUserRequest } from '@/types/auth.types';
import bg from '@/assets/register-background.png';
import logo from '@/assets/logo_white_bg.png';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { toast } from 'sonner';
import RegisterForm from '@/components/forms/RegisterForm';
import { useAuth } from '@/hooks/useAuth';
import { useAuthTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import LanguageDropdown from '@/components/ui/LanguageDropdown';
import { useAuthStore } from '@/stores/authStore';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t: tAuth } = useAuthTranslation();
  const { t: tCommon } = useCommonTranslation();

  const handleRegister = async (data: CreateUserRequest) => {
    const response = await signup(data);

    const { error } = useAuthStore.getState();

    if (!response) {
      if (error) {
        toast.error(error);
      }
      return;
    }

    if (response) {
      toast.success(tCommon('success'));
      navigate('/verify-email');
    }
  };

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* Language Dropdown - Bottom Right */}
          <div className="absolute top-10 right-4">
            <LanguageDropdown position="bottom-right" />
          </div>

          <div className="w-full xl:max-w-3/4 md:max-w-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tAuth('register.title')}</h1>
              <p className="text-gray-600">{tCommon('app.tagline')}</p>
            </div>

            <Card className="shadow-xl bg-[#D9D9D980]">
              <CardContent className="p-8">
                <RegisterForm onSubmit={handleRegister} />
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

export default Register;

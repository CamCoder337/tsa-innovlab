import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import bg from '@/assets/register-background.png';
import logo from '@/assets/logo_white_bg.png';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAuthTranslation } from '@/hooks/useTranslation';
import LanguageDropdown from '@/components/ui/LanguageDropdown';
import { useAuthStore } from '@/stores/authStore';
import ClientLoginForm from '@/components/forms/ClientLoginForm';

const ClientLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t: tAuth } = useAuthTranslation();

  const handleLogin = async (data: { email: string; password: string }) => {
    const response = await login(data);

    const { error } = useAuthStore.getState();

    if (!response) {
      if (error) {
        toast.error(error);
      }
      return;
    }

    if (response) {
      toast.success(tAuth('login.success'));
      navigate('/app/shop');
    }
  };

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* Language Dropdown - Top Right */}
          <div className="absolute top-10 right-4 flex gap-4">
            <LanguageDropdown position="bottom-right" />
          </div>

          <div className="w-full xl:max-w-3/4 md:max-w-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-tsa-blue dark:text-tsa-white mb-2">
                {tAuth('login.client.title')}
              </h1>
              <p className="text-sm font-semibold text-gray-400">
                {tAuth('login.client.subtitle')}
              </p>
            </div>

            <Card className="shadow-xl bg-[#D9D9D980] dark:bg-gray-800 transition-colors duration-200">
              <CardContent className="px-8 py-6">
                <ClientLoginForm onSubmit={handleLogin} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Image/Graphics */}
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

export default ClientLogin;

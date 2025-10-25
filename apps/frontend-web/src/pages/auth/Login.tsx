import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import bg from '@/assets/login-background.png';
import logo from '@/assets/logo_white_bg.png';
import { useAuth } from '@/hooks/useAuth';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { toast } from 'react-hot-toast';
import LoginForm from '@/components/forms/LoginForm';
import type { LoginCredentials } from '@/types/auth.types';

const Login: React.FC = () => {
  const { token, login, getUser, error } = useAuth();
  const navigate = useNavigate();
  const [showMfaField, setShowMfaField] = useState(false);

  const handleLogin = async (data: LoginCredentials) => {
    const response = await login(data);

    console.log(response);

    // Handle login failure
    if (error) {
      toast.error(error);
      if (localStorage.getItem('verificationEmail')) {
        navigate('/verify-email');
      }
      return;
    }

    // Handle MFA requirement
    if (response === 'mfa_required') {
      setShowMfaField(true);
      toast('Code MFA requis', {
        icon: '⚠️',
      });
      return;
    }

    // Handle successful login
    toast.success('Connexion réussie');
  };

  useEffect(() => {
    if (token) {
      getUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 md:mr-8">
          <div className="w-full xl:max-w-3/4 md:max-w-xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-medium mb-2 text-tsa-blue">Heureux de vous Revoir</h1>
              <p className="text-sm font-semibold text-tsa-gray">
                Vivez votre logistique en toute confiance
              </p>
            </div>

            <Card className="shadow-xl bg-[#D9D9D980]">
              <CardContent className="px-8">
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

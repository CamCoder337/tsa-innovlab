import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import bg from '@/assets/login-background.png';
import logo from '@/assets/logo_white_bg.png';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { toast } from 'react-hot-toast';
import LoginForm from '@/components/forms/LoginForm';
import type { LoginCredentials } from '@/types/auth.types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { token, login, logout, setToken } = useAuth();
  const [showMfaField, setShowMfaField] = useState(false);

  const handleLogin = async (data: LoginCredentials) => {
    const response = await authService.login(data);

    if (response.error) {
      console.log(response.error.errors?.[0]);
      if (response.error.errors?.[0] === 'Invalid credentials') {
        toast.error('Email ou Mot de passe incorrect');
      } else if (response.error.errors?.[0] === 'Account is not active') {
        toast.error(
          `Compte inactif. Veuillez consulter vos mails et récuperer votre code de validation à cet adresse : ${data.email}`
        );
        localStorage.setItem('verificationEmail', data.email);
        navigate('/verify-email');
      } else {
        toast.error(response.error.message || 'Échec de connexion');
      }
      return;
    }

    if (!response.data) {
      toast.error('Réponse invalide du serveur');
      return;
    }

    // Check if MFA is required
    if ('requiresMFA' in response.data && response.data.requiresMFA) {
      setShowMfaField(true);
      toast('Code MFA requis', {
        icon: '⚠️',
      });
      return;
    }

    // Successful login - response.data is of type AuthTokens
    if ('accessToken' in response.data.data && 'refreshToken' in response.data.data) {
      setToken(
        response.data.data.accessToken,
        response.data.data.expiresIn,
        response.data.data.refreshToken
      );
      toast.success('Connexion réussie');
    }
  };

  useEffect(() => {
    const getUserProfile = async () => {
      const response = await authService.getCurrentUser();

      if (response.error) {
        console.log(response.error.errors?.[0]);
        toast.error(response.error.message || 'Échec de connexion');
        logout();
        return false;
      }

      if (!response.data) {
        toast.error('Réponse invalide du serveur');
        return false;
      }
      login(response.data);
    };

    if (token) {
      getUserProfile();
    }
  }, [token, login, logout]);

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

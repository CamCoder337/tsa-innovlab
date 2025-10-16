import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export const useAuth = () => {
  const user = useAuthStore((s) => s.currentUser);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setToken = useAuthStore((s) => s.setToken);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    if (!token) logout();
  }, [token, logout]);

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    login,
    logout,
    setToken,
    updateUser,
  };
};

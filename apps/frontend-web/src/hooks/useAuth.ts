import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const user = useAuthStore((s) => s.currentUser);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signup = useAuthStore((s) => s.signup);
  const login = useAuthStore((s) => s.login);
  const getUser = useAuthStore((s) => s.getUser);
  const logout = useAuthStore((s) => s.logout);
  const setToken = useAuthStore((s) => s.setToken);
  const updateUser = useAuthStore((s) => s.updateUser);

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    error,
    isLoading,
    signup,
    login,
    getUser,
    logout,
    setToken,
    updateUser,
  };
};

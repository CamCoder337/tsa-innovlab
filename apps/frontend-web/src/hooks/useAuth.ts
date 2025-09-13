import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.currentUser);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setToken = useAuthStore((s) => s.setToken);

  // const forgotPassword = useCallback(async (data: ForgotPasswordRequest) => {
  //     try {
  //         await authService.forgotPassword(data)
  //         // addNotification({
  //         //     type: 'success',
  //         //     title: 'Email envoyé',
  //         //     message: 'Un lien de réinitialisation a été envoyé à votre adresse email.'
  //         // })
  //     } catch (error: any) {
  //         const message = error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email'
  //         // addNotification({
  //         //     type: 'error',
  //         //     title: 'Erreur',
  //         //     message
  //         // })
  //         throw error
  //     }
  // }, [])

  // const updateProfile = useCallback(async (data: UpdateUserRequest) => {
  //     try {
  //         const response = await authService.updateProfile(data)
  //         if (response.data?.user) {
  //             updateUser(response.data.user)
  //             // addNotification({
  //             //     type: 'success',
  //             //     title: 'Profil mis à jour',
  //             //     message: 'Vos informations ont été mises à jour avec succès!'
  //             // })
  //             return response.data.user
  //         }
  //         throw new Error('Invalid response format')
  //     } catch (error: any) {
  //         const message = error.response?.data?.message || 'Erreur lors de la mise à jour'
  //         // addNotification({
  //         //     type: 'error',
  //         //     title: 'Erreur de mise à jour',
  //         //     message
  //         // })
  //         throw error
  //     }
  // }, [updateUser])

  // const changePassword = useCallback(async (data: ChangePasswordRequest) => {
  //     try {
  //         await authService.changePassword(data)
  //         // addNotification({
  //         //     type: 'success',
  //         //     title: 'Mot de passe modifié',
  //         //     message: 'Votre mot de passe a été modifié avec succès!'
  //         // })
  //     } catch (error: any) {
  //         const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe'
  //         // addNotification({
  //         //     type: 'error',
  //         //     title: 'Erreur',
  //         //     message
  //         // })
  //         throw error
  //     }
  // }, [])

  // const refreshProfile = useCallback(async () => {
  //     try {
  //         const response = await authService.getProfile()
  //         if (response.data?.user) {
  //             updateUser(response.data.user)
  //             return response.data.user
  //         }
  //         throw new Error('Invalid response format')
  //     } catch (error: any) {
  //         console.error('Failed to refresh profile:', error)
  //         throw error
  //     }
  // }, [updateUser])

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    setToken,
  };
}

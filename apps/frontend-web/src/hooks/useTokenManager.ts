import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { tokenManager } from '@/services/token-manager.service';

/**
 * Hook pour initialiser et gérer automatiquement les tokens
 * À utiliser dans le composant racine de l'application
 */
export const useTokenManager = () => {
  const { isAuthenticated, token, refreshToken, initializeTokenManagement } = useAuthStore();

  useEffect(() => {
    // Initialiser la gestion des tokens si l'utilisateur est connecté
    if (isAuthenticated && token && refreshToken) {
      initializeTokenManagement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, refreshToken]);

  // Retourner des informations utiles sur l'état des tokens
  return {
    isAuthenticated,
    hasValidTokens: !!(token && refreshToken),
  };
};

/**
 * Hook pour obtenir des informations sur l'activité de l'utilisateur
 */
export const useUserActivity = () => {
  return {
    timeSinceLastActivity: tokenManager.timeSinceLastActivity,
    isRefreshing: tokenManager.isCurrentlyRefreshing,
  };
};

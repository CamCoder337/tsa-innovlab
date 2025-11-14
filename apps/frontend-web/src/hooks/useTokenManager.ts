import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

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

    // Cleanup lors du démontage du composant
    return () => {
      // Note: On ne fait pas de cleanup complet ici car le token manager
      // doit persister tant que l'app est montée. Le cleanup se fait au logout.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, refreshToken]);

  // Retourner des informations utiles sur l'état des tokens
  return {
    isAuthenticated,
    hasValidTokens: !!(token && refreshToken),
  };
};

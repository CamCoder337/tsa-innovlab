import { useAdminOrderStore } from '@/stores/adminOrderStore';

/**
 * Hook personnalisé pour accéder au store des commandes admin
 * Wrapper autour du store Zustand pour faciliter l'utilisation
 */
export const useAdminOrders = () => {
  return useAdminOrderStore();
};

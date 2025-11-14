import { useTranslation as useI18nTranslation, type UseTranslationOptions } from 'react-i18next';

// Define the available namespaces for better TypeScript support
export type Namespace =
  | 'common'
  | 'auth'
  | 'navigation'
  | 'dashboard'
  | 'missions'
  | 'cart'
  | 'profile'
  | 'admin'
  | 'shop'
  | 'forms'
  | 'errors'
  | 'notifications'
  | 'tracking'
  | 'payment'
  | 'maps'
  | 'chat'
  | 'vehicles';

// Enhanced useTranslation hook with TypeScript support
export function useTranslation(
  ns?: Namespace | Namespace[],
  options?: UseTranslationOptions<Namespace>
) {
  return useI18nTranslation(ns, options);
}

// Convenience hooks for specific namespaces
export const useCommonTranslation = () => useTranslation('common');
export const useAuthTranslation = () => useTranslation('auth');
export const useNavigationTranslation = () => useTranslation('navigation');
export const useDashboardTranslation = () => useTranslation('dashboard');
export const useMissionsTranslation = () => useTranslation('missions');
export const useCartTranslation = () => useTranslation('cart');
export const usePaymentTranslation = () => useTranslation('payment');
export const useMapsTranslation = () => useTranslation('maps');
export const useChatTranslation = () => useTranslation('chat');
export const useProfileTranslation = () => useTranslation('profile');
export const useAdminTranslation = () => useTranslation('admin');
export const useShopTranslation = () => useTranslation('shop');
export const useFormsTranslation = () => useTranslation('forms');
export const useErrorsTranslation = () => useTranslation('errors');
export const useNotificationsTranslation = () => useTranslation('notifications');
export const useTrackingTranslation = () => useTranslation('tracking');
export const useVehiclesTranslation = () => useTranslation('vehicles');

// Re-export other i18next hooks for convenience
export { useTranslation as useI18nTranslation } from 'react-i18next';
export { Trans } from 'react-i18next';

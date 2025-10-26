import { useTranslation as useI18nTranslation, type UseTranslationOptions } from 'react-i18next';

// Define the available namespaces for better TypeScript support
export type Namespace =
  | 'common'
  | 'auth'
  | 'navigation'
  | 'dashboard'
  | 'products'
  | 'missions'
  | 'orders'
  | 'cart'
  | 'profile'
  | 'admin'
  | 'shop'
  | 'forms'
  | 'errors'
  | 'notifications'
  | 'tracking';

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
export const useProductsTranslation = () => useTranslation('products');
export const useMissionsTranslation = () => useTranslation('missions');
export const useOrdersTranslation = () => useTranslation('orders');
export const useCartTranslation = () => useTranslation('cart');
export const useProfileTranslation = () => useTranslation('profile');
export const useAdminTranslation = () => useTranslation('admin');
export const useShopTranslation = () => useTranslation('shop');
export const useFormsTranslation = () => useTranslation('forms');
export const useErrorsTranslation = () => useTranslation('errors');
export const useNotificationsTranslation = () => useTranslation('notifications');
export const useTrackingTranslation = () => useTranslation('tracking');

// Re-export other i18next hooks for convenience
export { useTranslation as useI18nTranslation } from 'react-i18next';
export { Trans } from 'react-i18next';

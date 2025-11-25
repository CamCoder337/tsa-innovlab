/**
 * Couleurs TSA Logistics
 * Inspiré du design system du frontend web
 */
export const Colors = {
  // Couleurs principales TSA
  primary: '#1E40AF', // tsa-blue
  primaryDark: '#1E3A8A', // tsa-blue-dark

  // Couleurs sémantiques
  success: '#10B981', // green-500
  warning: '#F59E0B', // amber-500
  danger: '#EF4444', // red-500
  info: '#3B82F6', // blue-500

  // Couleurs de statut des missions
  status: {
    pending: '#F59E0B', // amber-500
    inProgress: '#3B82F6', // blue-500
    completed: '#10B981', // green-500
    cancelled: '#EF4444', // red-500
  },

  // Couleurs neutres
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Couleur SOS
  sos: '#DC2626', // red-600 (plus visible que danger)

  // Couleur de fond
  background: '#F9FAFB',
  surface: '#FFFFFF',

  // Couleurs de texte
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Couleur de bordure
  border: '#E5E7EB',
};

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import frTranslations from './locales/fr';
import enTranslations from './locales/en';

const resources = {
  fr: frTranslations,
  en: enTranslations,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'FR',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Namespace configuration
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'navigation',
      'dashboard',
      'products',
      'missions',
      'orders',
      'cart',
      'profile',
      'admin',
      'shop',
      'forms',
      'errors',
      'notifications',
      'tracking',
    ],
  });

export default i18n;

// Utility script to help identify and update pages with i18n
// This file contains common translation patterns for bulk updates

export const commonTranslationPatterns = {
  // Loading states
  loading: {
    fr: 'Chargement...',
    en: 'Loading...',
  },

  // Error states
  error: {
    fr: "Une erreur s'est produite",
    en: 'An error occurred',
  },

  // Success messages
  success: {
    fr: 'Opération réussie',
    en: 'Operation successful',
  },

  // Common actions
  save: {
    fr: 'Enregistrer',
    en: 'Save',
  },

  cancel: {
    fr: 'Annuler',
    en: 'Cancel',
  },

  delete: {
    fr: 'Supprimer',
    en: 'Delete',
  },

  edit: {
    fr: 'Modifier',
    en: 'Edit',
  },

  view: {
    fr: 'Voir',
    en: 'View',
  },

  // Navigation
  dashboard: {
    fr: 'Tableau de bord',
    en: 'Dashboard',
  },

  profile: {
    fr: 'Profil',
    en: 'Profile',
  },

  settings: {
    fr: 'Paramètres',
    en: 'Settings',
  },
};

// Pages that need i18n implementation
export const pagesToUpdate = {
  // Auth pages (completed)
  'Login.tsx': true, // ✅ Completed
  'Register.tsx': true, // ✅ Completed
  'ForgotPassword.tsx': true, // ✅ Completed
  'VerifyEmail.tsx': true, // ✅ Completed

  // Shop pages - i18n completed
  'Shop.tsx': true, // ✅ Completed
  'Product.tsx': true, // ✅ Completed
  'CartSummary.tsx': true, // ✅ Completed
  'Order.tsx': true, // ✅ Completed
  'Orders.tsx': true, // ✅ Completed

  // Admin pages (completed)
  'AdminDashboard.tsx': true, // ✅ Completed
  'AdminProfile.tsx': true, // ✅ Completed
  'AdminSettings.tsx': true, // ✅ Completed
  'UsersManagement.tsx': true, // ✅ Completed
  'AddUser.tsx': true, // ✅ Completed
  'ProductsManagement.tsx': true, // ✅ Completed
  'OrdersManagement.tsx': true, // ✅ Completed
  'MissionsManagement.tsx': true, // ✅ Completed
  'UserProfile.tsx': true, // ✅ Completed

  // Dashboard pages (completed)
  'Dashboard.tsx': true, // ✅ No hardcoded text (router component)
  'AffreteurDashboard.tsx': true, // ✅ Completed
  'TransporteurDashboard.tsx': true, // ✅ Completed

  // Mission pages (completed)
  'CreateMission.tsx': true, // ✅ Completed
  'Mission.tsx': true, // ✅ Completed
  'MyMissions.tsx': true, // ✅ No hardcoded text (router component)
  'MyMissionsAffreteur.tsx': true, // ✅ Completed
  'MyMissionsTransporteur.tsx': true, // ✅ Completed

  // Profile pages (completed)
  'MyProfile.tsx': true, // ✅ No hardcoded text (router component)
  'AffreteurProfile.tsx': true, // ✅ Completed
  'TransporteurProfile.tsx': true, // ✅ Completed
  'ClientProfile.tsx': true, // ✅ Completed

  // Settings pages (completed)
  'MySettings.tsx': true, // ✅ No hardcoded text (router component)
  'AffreteurSettings.tsx': true, // ✅ Completed
  'TransporteurSettings.tsx': true, // ✅ Completed
  'ClientSettings.tsx': true, // ✅ Completed

  // Tracking pages
  'MissionTrackingPage.tsx': true, // ✅ Completed
  'AdminTrackingDashboard.tsx': false,
  'AffreteurTrackingDashboard.tsx': false,
  'TransporteurTrackingDashboard.tsx': false,
  'TrackingDashboardPage.tsx': true, // ✅ No hardcoded text (router component)

  // Other pages
  'BillingPage.tsx': false,
  'ChatPage.tsx': false,
  'MyVehicles.tsx': false,
};

export default { commonTranslationPatterns, pagesToUpdate };

import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour TSA InnovLab E2E Tests avec enregistrement vidéo
 * Optimisée pour la génération de vidéos de démonstration des tests
 */
export default defineConfig({
  testDir: './e2e',

  /* Configuration des tests */
  fullyParallel: false, // Désactivé pour un meilleur enregistrement vidéo
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Un seul worker pour des vidéos cohérentes
  timeout: 60000, // Timeout plus long pour les démonstrations

  /* Configuration des rapports */
  reporter: [['html', { open: 'never' }], ['list']],

  /* Configuration globale pour tous les projets */
  use: {
    /* URL de base pour les tests */
    baseURL: 'http://localhost:5173',

    /* Configuration complète de l'enregistrement */
    trace: 'retain-on-failure', // Traces détaillées en cas d'échec
    video: 'on', // IMPORTANT: Enregistrer toutes les vidéos
    screenshot: 'only-on-failure',

    /* Configuration optimisée pour les vidéos de démonstration */
    actionTimeout: 10000, // Timeout pour les actions individuelles
    navigationTimeout: 30000, // Timeout pour les navigations

    /* Configuration du viewport pour des vidéos HD */
    viewport: { width: 1280, height: 720 },

    /* Headers et configuration réseau */
    extraHTTPHeaders: {
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },

    /* Ignorer les erreurs HTTPS en dev */
    ignoreHTTPSErrors: true,
  },

  /* Configuration des projets par navigateur */
  projects: [
    {
      name: 'chromium-demo',
      use: {
        ...devices['Desktop Chrome'],
        // Configuration spéciale pour les vidéos de démonstration
        video: {
          mode: 'on',
          size: { width: 1280, height: 720 },
        },
      },
    },
    // Autres navigateurs désactivés pour focus sur les démonstrations Chrome
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Configuration du serveur de développement */
  webServer: {
    command: 'npx yarn dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* Répertoires de sortie */
  outputDir: 'test-results/',

  /* Expectation timeout */
  expect: {
    timeout: 15000,
  },
});

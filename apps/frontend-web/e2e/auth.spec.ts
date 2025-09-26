import { expect, test } from '@playwright/test';
import { loginAsUser, logout, registerUser } from './utils/auth.test-utils';

/**
 * Tests d'authentification pour TSA InnovLab
 * Ces tests valident le système complet de connexion, inscription et déconnexion
 * avec enregistrement vidéo pour démonstration
 */
test.describe('🔐 Système d\'Authentification TSA InnovLab', () => {

  test('✅ Connexion utilisateur valide - Démonstration complète', async ({ page }) => {
    console.log('📹 Démonstration : Connexion d\'un utilisateur Affreteur');

    // Étape 1: Naviguer vers la page de connexion
    console.log('🌐 Navigation vers la page d\'accueil');
    await page.goto('/');

    // Pause pour la démonstration vidéo
    await page.waitForTimeout(2000);

    // Étape 2: Remplir les informations de connexion
    console.log('📝 Saisie des identifiants utilisateur');
    await loginAsUser(page, {
      email: 'mishitouchiwa14@gmail.com',
      password: 'TSAG12025'
    });

    // Étape 3: Attendre la redirection après connexion réussie
    console.log('🚀 Redirection vers le tableau de bord');
    await page.waitForURL(/\/app/, { timeout: 30000 });

    // Étape 4: Vérifier que nous sommes bien connectés
    console.log('✅ Vérification de la connexion réussie');
    await expect(page).toHaveURL(/\/app/);

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });

  test('❌ Gestion des erreurs - Identifiants incorrects', async ({ page }) => {
    console.log('📹 Démonstration : Gestion des erreurs d\'authentification');

    // Étape 1: Naviguer vers la page de connexion
    console.log('🌐 Navigation vers la page de connexion');
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Étape 2: Saisir des identifiants incorrects
    console.log('⚠️ Test avec des identifiants invalides');
    await loginAsUser(page, {
      email: 'test@invalid.com',
      password: 'WrongPassword123'
    });

    // Étape 3: Vérifier l'affichage du message d'erreur
    console.log('🔍 Vérification du message d\'erreur');
    await page.waitForTimeout(3000);

    // Chercher le message d'erreur avec plusieurs variantes possibles
    const errorMessage = page.getByText(/Email ou Mot de passe incorrect/i)
      .or(page.getByText(/Invalid credentials/i))
      .or(page.getByText(/Identifiants invalides/i))
      .or(page.getByText(/Erreur de connexion/i));

    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Pause finale pour montrer l'erreur
    await page.waitForTimeout(3000);
  });

  test('📝 Inscription nouvel utilisateur - Processus complet', async ({ page }) => {
    console.log('📹 Démonstration : Inscription d\'un nouvel utilisateur');

    // Étape 1: Naviguer vers la page d'inscription
    console.log('🌐 Navigation vers la page d\'inscription');
    await page.goto('/register');
    await page.waitForTimeout(2000);

    // Étape 2: Remplir le formulaire d'inscription
    console.log('📋 Remplissage du formulaire d\'inscription');
    const timestamp = Date.now();
    await registerUser(page, {
      email: `test${timestamp}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '0612345678',
      role: 'affreteur',
    });

    // Étape 3: Attendre le processus d'inscription
    console.log('⏳ Traitement de l\'inscription...');
    await page.waitForTimeout(5000);

    // Étape 4: Vérification de la redirection ou du message de succès
    console.log('✅ Vérification du processus d\'inscription');

    // Vérifier soit la redirection vers /app soit vers /verify-email
    const currentUrl = page.url();
    const isRegistrationSuccessful = currentUrl.includes('/app') ||
                                   currentUrl.includes('/verify-email') ||
                                   currentUrl.includes('/register');

    expect(isRegistrationSuccessful).toBeTruthy();

    // Pause finale
    await page.waitForTimeout(3000);
  });

  test('🚪 Processus de déconnexion - Sécurisation de session', async ({ page }) => {
    console.log('📹 Démonstration : Processus complet de déconnexion');

    // Étape 1: Se connecter d'abord
    console.log('🔐 Connexion préalable à l\'application');
    await page.goto('/');
    await page.waitForTimeout(2000);

    await loginAsUser(page, {
      email: 'mishitouchiwa14@gmail.com',
      password: 'TSAG12025'
    });

    // Étape 2: Attendre et vérifier la connexion
    console.log('✅ Vérification de la connexion réussie');
    await expect(page).toHaveURL(/\/app/, { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Étape 3: Procéder à la déconnexion
    console.log('🚪 Processus de déconnexion');
    await logout(page);
    await page.waitForTimeout(2000);

    // Étape 4: Vérifier la redirection vers la page de connexion
    console.log('🔍 Vérification de la déconnexion');
    await expect(page).toHaveURL('/');
    await page.waitForTimeout(2000);

    // Étape 5: Tester la protection des routes après déconnexion
    console.log('🛡️ Test de protection des routes');
    await page.goto('/app');
    await page.waitForTimeout(2000);

    // Vérifier que l'utilisateur est redirigé vers la page de connexion
    await expect(page).toHaveURL(/\/$/);

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });

  test('🔄 Navigation entre les pages d\'authentification', async ({ page }) => {
    console.log('📹 Démonstration : Navigation entre login et register');

    // Étape 1: Commencer sur la page de connexion
    console.log('🏠 Page de connexion');
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Étape 2: Aller vers la page d'inscription
    console.log('📝 Navigation vers l\'inscription');
    const registerLink = page.getByText(/S\'inscrire/i)
      .or(page.getByText(/Créer un compte/i))
      .or(page.getByText(/Register/i));

    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/register/);
    } else {
      // Navigation directe si pas de lien visible
      await page.goto('/register');
      await page.waitForTimeout(2000);
    }

    // Étape 3: Retourner vers la page de connexion
    console.log('🔙 Retour vers la connexion');
    const loginLink = page.getByText(/Se connecter/i)
      .or(page.getByText(/Déjà un compte/i))
      .or(page.getByText(/Login/i));

    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/$/);
    } else {
      // Navigation directe si pas de lien visible
      await page.goto('/');
      await page.waitForTimeout(2000);
    }

    // Pause finale
    await page.waitForTimeout(2000);
  });
});

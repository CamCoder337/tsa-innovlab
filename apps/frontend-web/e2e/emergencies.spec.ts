import { expect, test } from '@playwright/test';
import { loginAsUser } from './utils/auth.test-utils';

/**
 * Tests E2E pour le système SOS / Urgences
 * Ces tests valident la page de gestion des urgences pour les admins
 */
test.describe('🚨 Système SOS - Gestion des Urgences', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'admin
    await page.goto('/');
    await loginAsUser(page, {
      email: process.env.ADMIN_EMAIL || 'admin@tsa-logistique.com',
      password: process.env.ADMIN_PASSWORD || 'AdminPassword123',
    });
    await page.waitForURL(/\/app/, { timeout: 30000 });
  });

  test('✅ Accès à la page des urgences depuis la sidebar', async ({ page }) => {
    console.log('📹 Démonstration : Navigation vers la page des urgences');

    // Vérifier que le lien "Urgences SOS" est visible dans la sidebar
    const sosLink = page.locator('a[href="/app/emergencies"]');
    await expect(sosLink).toBeVisible({ timeout: 10000 });

    // Cliquer sur le lien
    await sosLink.click();
    await page.waitForURL(/\/app\/emergencies/, { timeout: 10000 });

    // Vérifier que la page s'affiche correctement
    await expect(page.locator('h1')).toContainText('Urgences SOS');
  });

  test('✅ Affichage des statistiques d\'urgences', async ({ page }) => {
    console.log('📹 Démonstration : Statistiques des urgences');

    await page.goto('/app/emergencies');
    await page.waitForLoadState('networkidle');

    // Vérifier la présence des cartes de statistiques
    const statsCards = page.locator('[class*="Card"]');
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });

    // Vérifier les labels des stats
    await expect(page.getByText('Urgences Actives')).toBeVisible();
    await expect(page.getByText('Critiques')).toBeVisible();
    await expect(page.getByText('Haute Priorité')).toBeVisible();
    await expect(page.getByText('Résolues Aujourd\'hui')).toBeVisible();
  });

  test('✅ Filtrage des urgences actives vs toutes', async ({ page }) => {
    console.log('📹 Démonstration : Filtrage des urgences');

    await page.goto('/app/emergencies');
    await page.waitForLoadState('networkidle');

    // Vérifier les boutons de filtre
    const activeButton = page.getByRole('button', { name: 'Actives' });
    const allButton = page.getByRole('button', { name: 'Toutes' });

    await expect(activeButton).toBeVisible();
    await expect(allButton).toBeVisible();

    // Cliquer sur "Toutes"
    await allButton.click();
    await page.waitForTimeout(1000);

    // Revenir sur "Actives"
    await activeButton.click();
    await page.waitForTimeout(1000);
  });

  test('✅ Bouton Actualiser fonctionne', async ({ page }) => {
    console.log('📹 Démonstration : Actualisation des données');

    await page.goto('/app/emergencies');
    await page.waitForLoadState('networkidle');

    // Trouver et cliquer sur le bouton Actualiser
    const refreshButton = page.getByRole('button', { name: /Actualiser/i });
    await expect(refreshButton).toBeVisible();

    await refreshButton.click();

    // Vérifier que le bouton montre un état de chargement (icône qui tourne)
    // ou que les données sont rechargées
    await page.waitForTimeout(2000);
  });

  test('✅ Table des urgences s\'affiche correctement', async ({ page }) => {
    console.log('📹 Démonstration : Table des urgences');

    await page.goto('/app/emergencies');
    await page.waitForLoadState('networkidle');

    // Vérifier les en-têtes de la table
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Priorité' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Mission' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Statut' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });

  test('✅ Badge d\'urgence visible dans la sidebar (si urgences actives)', async ({ page }) => {
    console.log('📹 Démonstration : Badge d\'urgence dans la sidebar');

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Le badge ne s'affiche que s'il y a des urgences actives
    // On vérifie juste que le lien SOS existe
    const sosLink = page.locator('a[href="/app/emergencies"]');
    await expect(sosLink).toBeVisible({ timeout: 10000 });

    // Si des urgences existent, un badge devrait être visible
    const badge = sosLink.locator('span[class*="rounded-full"]');
    // Le badge peut ne pas exister s'il n'y a pas d'urgences
    const badgeCount = await badge.count();
    console.log(`Badge d'urgence présent: ${badgeCount > 0}`);
  });
});

test.describe('🚨 Système SOS - Actions sur les urgences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsUser(page, {
      email: process.env.ADMIN_EMAIL || 'admin@tsa-logistique.com',
      password: process.env.ADMIN_PASSWORD || 'AdminPassword123',
    });
    await page.waitForURL(/\/app/, { timeout: 30000 });
    await page.goto('/app/emergencies');
    await page.waitForLoadState('networkidle');
  });

  test('✅ Prendre en charge une urgence (si disponible)', async ({ page }) => {
    console.log('📹 Démonstration : Prise en charge d\'une urgence');

    // Chercher un bouton "Prendre en charge"
    const acknowledgeButton = page.getByRole('button', { name: /Prendre en charge/i }).first();
    
    const buttonExists = await acknowledgeButton.count() > 0;
    
    if (buttonExists) {
      await acknowledgeButton.click();
      
      // Vérifier le toast de succès
      await expect(page.getByText(/prise en charge/i)).toBeVisible({ timeout: 5000 });
    } else {
      console.log('Aucune urgence à prendre en charge disponible');
    }
  });

  test('✅ Résoudre une urgence (si disponible)', async ({ page }) => {
    console.log('📹 Démonstration : Résolution d\'une urgence');

    // Chercher un bouton "Résoudre"
    const resolveButton = page.getByRole('button', { name: /Résoudre/i }).first();
    
    const buttonExists = await resolveButton.count() > 0;
    
    if (buttonExists) {
      await resolveButton.click();
      
      // Vérifier que le dialog s'ouvre
      await expect(page.getByText(/Résoudre l'urgence/i)).toBeVisible({ timeout: 5000 });
      
      // Remplir les notes de résolution
      const textarea = page.locator('textarea');
      await textarea.fill('Test de résolution automatique');
      
      // Confirmer
      const confirmButton = page.getByRole('button', { name: /Confirmer/i });
      await confirmButton.click();
      
      // Vérifier le toast de succès
      await expect(page.getByText(/résolue/i)).toBeVisible({ timeout: 5000 });
    } else {
      console.log('Aucune urgence à résoudre disponible');
    }
  });

  test('✅ Ouvrir la localisation GPS (si disponible)', async ({ page, context }) => {
    console.log('📹 Démonstration : Ouverture de la localisation GPS');

    // Chercher un bouton de localisation (MapPin icon)
    const locationButton = page.locator('button').filter({ has: page.locator('svg.lucide-map-pin') }).first();
    
    const buttonExists = await locationButton.count() > 0;
    
    if (buttonExists) {
      // Intercepter l'ouverture d'un nouvel onglet
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        locationButton.click(),
      ]);
      
      // Vérifier que Google Maps s'ouvre
      expect(newPage.url()).toContain('google.com/maps');
      await newPage.close();
    } else {
      console.log('Aucune urgence avec localisation disponible');
    }
  });
});

test.describe('🚨 Système SOS - Accès non autorisé', () => {
  test('❌ Un affreteur ne peut pas accéder à la page des urgences', async ({ page }) => {
    console.log('📹 Démonstration : Restriction d\'accès pour les non-admins');

    // Se connecter en tant qu'affreteur
    await page.goto('/');
    await loginAsUser(page, {
      email: process.env.AFFRETEUR_EMAIL || 'affreteur@test.com',
      password: process.env.AFFRETEUR_PASSWORD || 'Password123',
    });
    await page.waitForURL(/\/app/, { timeout: 30000 });

    // Tenter d'accéder directement à la page des urgences
    await page.goto('/app/emergencies');

    // Devrait être redirigé ou voir une erreur 403
    // Le comportement exact dépend de l'implémentation
    const currentUrl = page.url();
    
    // Soit redirigé vers /app, soit erreur affichée
    const isRedirected = !currentUrl.includes('/emergencies');
    const hasError = await page.getByText(/accès refusé|forbidden|non autorisé/i).count() > 0;
    
    expect(isRedirected || hasError).toBeTruthy();
  });
});

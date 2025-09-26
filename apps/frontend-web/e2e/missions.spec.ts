import { test, expect } from '@playwright/test';
import { loginAsUser, logout } from './utils/auth.test-utils';

/**
 * Tests de gestion des missions pour TSA InnovLab
 * Ces tests couvrent les workflows Affreteur et Transporteur
 * avec enregistrement vidéo pour démonstration
 */
test.describe('🚛 Gestion des Missions TSA InnovLab', () => {

  test.afterEach(async ({ page }) => {
    console.log('🚪 Déconnexion après le test');
    await logout(page);
    await page.waitForTimeout(1000);
  });

  test('📋 Workflow Affreteur - Création de mission complète', async ({ page }) => {
    console.log('📹 Démonstration : Workflow complet d\'un Affreteur');

    // Étape 1: Connexion en tant qu'Affreteur
    console.log('🔐 Connexion utilisateur Affreteur');
    await page.goto('/');
    await loginAsUser(page, {
      email: 'mishitouchiwa14@gmail.com',
      password: 'TSAG12025'
    });
    await page.waitForURL(/\/app/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Étape 2: Navigation vers la création de mission
    console.log('➕ Accès à la création de mission');

    // Chercher les liens de création de mission
    const createMissionLinks = [
      page.getByText(/Créer une mission/i),
      page.getByText(/Nouvelle mission/i),
      page.getByText(/Create Mission/i),
      page.getByText(/New Mission/i),
      page.locator('[data-testid="create-mission"]')
    ];

    let missionCreateFound = false;
    for (const link of createMissionLinks) {
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('🔗 Lien de création de mission trouvé');
        await link.click();
        await page.waitForTimeout(3000);
        missionCreateFound = true;
        break;
      }
    }

    // Navigation directe vers les URLs possibles de création
    if (!missionCreateFound) {
      const createUrls = ['/app/missions/create', '/app/create-mission', '/app/missions/new'];

      for (const url of createUrls) {
        console.log(`🌐 Test de navigation vers ${url}`);
        await page.goto(url);
        await page.waitForTimeout(3000);

        const formElements = [
          page.locator('input[name="title"]'),
          page.locator('input[name="pickup"]'),
          page.locator('form'),
          page.getByText(/Créer la mission/i)
        ];

        for (const element of formElements) {
          if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ Formulaire de création de mission détecté');
            missionCreateFound = true;
            break;
          }
        }
        if (missionCreateFound) break;
      }
    }

    // Étape 3: Remplissage du formulaire de mission
    if (missionCreateFound) {
      console.log('📝 Remplissage du formulaire de mission');

      const titleInput = page.locator('input[name="title"]')
        .or(page.locator('input[placeholder*="titre"]'))
        .or(page.locator('input[placeholder*="nom"]'));

      if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await titleInput.fill(`Mission Transport ${Date.now()}`);
        await page.waitForTimeout(2000);

        // Adresse de départ
        const pickupInput = page.locator('input[name="pickup"]')
          .or(page.locator('input[placeholder*="départ"]'))
          .or(page.locator('input[placeholder*="pickup"]'));

        if (await pickupInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('📍 Saisie de l\'adresse de départ');
          await pickupInput.fill('Paris, France');
          await page.waitForTimeout(2000);
        }

        // Adresse de destination
        const deliveryInput = page.locator('input[name="delivery"]')
          .or(page.locator('input[name="destination"]'))
          .or(page.locator('input[placeholder*="destination"]'));

        if (await deliveryInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('🎯 Saisie de l\'adresse de destination');
          await deliveryInput.fill('Lyon, France');
          await page.waitForTimeout(2000);
        }

        // Date de départ
        const dateInput = page.locator('input[type="date"]')
          .or(page.locator('input[name="date"]'));

        if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('📅 Sélection de la date de départ');
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateString = tomorrow.toISOString().split('T')[0];
          await dateInput.fill(dateString);
          await page.waitForTimeout(2000);
        }

        // Description/détails
        const descriptionInput = page.locator('textarea[name="description"]')
          .or(page.locator('input[name="details"]'));

        if (await descriptionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('📄 Ajout de la description');
          await descriptionInput.fill('Transport de marchandises fragiles - Manipulation délicate requise');
          await page.waitForTimeout(2000);
        }

        // Budget/prix
        const budgetInput = page.locator('input[name="budget"]')
          .or(page.locator('input[name="price"]'))
          .or(page.locator('input[placeholder*="prix"]'));

        if (await budgetInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('💰 Définition du budget');
          await budgetInput.fill('500');
          await page.waitForTimeout(2000);
        }

        // Soumission du formulaire
        const submitButton = page.getByText(/Créer la mission/i)
          .or(page.getByText(/Publier/i))
          .or(page.getByText(/Enregistrer/i))
          .or(page.locator('button[type="submit"]'));

        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🚀 Publication de la mission');
          await submitButton.click();
          await page.waitForTimeout(5000);

          // Vérifier le succès de la création
          const successIndicators = [
            page.getByText(/Mission créée/i),
            page.getByText(/Mission publiée/i),
            page.getByText(/Success/i)
          ];

          for (const indicator of successIndicators) {
            if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
              console.log('✅ Mission créée avec succès');
              break;
            }
          }
        }
      }
    } else {
      console.log('ℹ️ Interface de création de mission en cours de développement');
    }

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });

  test('🚛 Workflow Transporteur - Recherche et proposition', async ({ page }) => {
    console.log('📹 Démonstration : Workflow d\'un Transporteur');

    // Étape 1: Connexion en tant que Transporteur
    console.log('🔐 Connexion utilisateur Transporteur');
    await page.goto('/');
    await loginAsUser(page, {
      email: 'transporteur@test.com',
      password: 'password123'
    });

    // Si la connexion échoue, utiliser le compte par défaut
    await page.waitForTimeout(3000);
    if (!page.url().includes('/app')) {
      console.log('🔄 Utilisation du compte par défaut pour la démonstration');
      await loginAsUser(page, {
        email: 'mishitouchiwa14@gmail.com',
        password: 'TSAG12025'
      });
    }

    await page.waitForURL(/\/app/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Étape 2: Navigation vers les missions disponibles
    console.log('🔍 Recherche de missions disponibles');

    const missionListLinks = [
      page.getByText(/Missions disponibles/i),
      page.getByText(/Available Missions/i),
      page.getByText(/Missions/i),
      page.getByText(/Offres/i)
    ];

    let missionListFound = false;
    for (const link of missionListLinks) {
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('📋 Liste des missions trouvée');
        await link.click();
        await page.waitForTimeout(3000);
        missionListFound = true;
        break;
      }
    }

    // Navigation directe vers les URLs possibles
    if (!missionListFound) {
      const missionUrls = ['/app/missions', '/app/available-missions', '/app/offers'];

      for (const url of missionUrls) {
        console.log(`🌐 Test de navigation vers ${url}`);
        await page.goto(url);
        await page.waitForTimeout(3000);

        const listElements = [
          page.locator('[data-testid="mission-card"]'),
          page.locator('.mission-item'),
          page.getByText(/Paris/i),
          page.getByText(/Lyon/i),
          page.locator('table')
        ];

        for (const element of listElements) {
          if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ Liste des missions détectée');
            missionListFound = true;
            break;
          }
        }
        if (missionListFound) break;
      }
    }

    // Étape 3: Interaction avec les missions disponibles
    if (missionListFound) {
      console.log('🎯 Exploration des missions disponibles');

      // Tester les filtres de recherche
      const searchInput = page.locator('input[placeholder*="recherch"]')
        .or(page.locator('input[placeholder*="search"]'));

      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('🔎 Test de la fonction de recherche');
        await searchInput.fill('Paris');
        await page.waitForTimeout(3000);
        await searchInput.clear();
        await page.waitForTimeout(2000);
      }

      // Tester les filtres par ville/région
      const locationFilter = page.locator('select')
        .or(page.getByText(/Filtrer/i));

      if (await locationFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('📍 Test des filtres géographiques');
        await locationFilter.click();
        await page.waitForTimeout(2000);
      }

      // Interaction avec une mission spécifique
      const missionCards = [
        page.locator('[data-testid="mission-card"]'),
        page.locator('.mission-item'),
        page.getByText(/Mission Transport/i).first(),
        page.locator('table tr').first()
      ];

      for (const card of missionCards) {
        if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('📋 Sélection d\'une mission');
          await card.click();
          await page.waitForTimeout(3000);

          // Tester la soumission d'une proposition
          const proposeButton = page.getByText(/Proposer/i)
            .or(page.getByText(/Faire une offre/i))
            .or(page.getByText(/Submit Offer/i));

          if (await proposeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('💼 Soumission d\'une proposition');
            await proposeButton.click();
            await page.waitForTimeout(3000);

            // Remplir le formulaire de proposition
            const priceInput = page.locator('input[name="price"]')
              .or(page.locator('input[placeholder*="prix"]'));

            if (await priceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
              await priceInput.fill('450');
              await page.waitForTimeout(2000);

              const submitOfferButton = page.getByText(/Envoyer/i)
                .or(page.getByText(/Submit/i))
                .or(page.locator('button[type="submit"]'));

              if (await submitOfferButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log('📤 Envoi de la proposition');
                await submitOfferButton.click();
                await page.waitForTimeout(3000);
              }
            }
          }
          break;
        }
      }
    } else {
      console.log('ℹ️ Interface des missions en cours de développement');
    }

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });

  test('📊 Suivi et gestion des missions actives', async ({ page }) => {
    console.log('📹 Démonstration : Suivi des missions en cours');

    // Étape 1: Connexion
    console.log('🔐 Connexion pour accéder au suivi');
    await page.goto('/');
    await loginAsUser(page, {
      email: 'mishitouchiwa14@gmail.com',
      password: 'TSAG12025'
    });
    await page.waitForURL(/\/app/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Étape 2: Navigation vers le tableau de bord/suivi
    console.log('📈 Accès au tableau de bord des missions');

    const dashboardLinks = [
      page.getByText(/Tableau de bord/i),
      page.getByText(/Dashboard/i),
      page.getByText(/Mes missions/i),
      page.getByText(/My Missions/i),
      page.getByText(/Suivi/i)
    ];

    let dashboardFound = false;
    for (const link of dashboardLinks) {
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('📊 Tableau de bord trouvé');
        await link.click();
        await page.waitForTimeout(3000);
        dashboardFound = true;
        break;
      }
    }

    // Navigation directe vers le dashboard
    if (!dashboardFound) {
      const dashboardUrls = ['/app/dashboard', '/app/my-missions', '/app'];

      for (const url of dashboardUrls) {
        console.log(`🌐 Test de navigation vers ${url}`);
        await page.goto(url);
        await page.waitForTimeout(3000);

        const dashboardElements = [
          page.getByText(/Missions en cours/i),
          page.getByText(/Active Missions/i),
          page.locator('[data-testid="mission-status"]'),
          page.getByText(/Statut/i),
          page.locator('.status-indicator')
        ];

        for (const element of dashboardElements) {
          if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ Tableau de bord des missions détecté');
            dashboardFound = true;
            break;
          }
        }
        if (dashboardFound) break;
      }
    }

    // Étape 3: Test des fonctionnalités de suivi
    if (dashboardFound) {
      console.log('🔍 Exploration des missions actives');

      // Vérifier les indicateurs de statut
      const statusElements = [
        page.locator('.status-indicator'),
        page.getByText(/En cours/i),
        page.getByText(/In Progress/i),
        page.getByText(/Terminé/i),
        page.getByText(/Completed/i)
      ];

      for (const element of statusElements) {
        if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('📊 Indicateurs de statut détectés');
          await page.waitForTimeout(2000);
          break;
        }
      }

      // Tester les détails d'une mission
      const missionDetails = [
        page.locator('[data-testid="mission-details"]'),
        page.getByText(/Voir détails/i),
        page.getByText(/View Details/i)
      ];

      for (const detail of missionDetails) {
        if (await detail.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('📋 Accès aux détails de mission');
          await detail.click();
          await page.waitForTimeout(3000);

          // Tester la mise à jour du statut
          const updateStatusButton = page.getByText(/Mettre à jour/i)
            .or(page.getByText(/Update Status/i));

          if (await updateStatusButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('🔄 Test de mise à jour du statut');
            await updateStatusButton.click();
            await page.waitForTimeout(2000);
          }
          break;
        }
      }

      // Test des notifications/messages
      const notificationElements = [
        page.locator('[data-testid="notification"]'),
        page.getByText(/Notification/i),
        page.getByText(/Message/i)
      ];

      for (const notification of notificationElements) {
        if (await notification.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('🔔 Test des notifications');
          await notification.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    } else {
      console.log('ℹ️ Interface de suivi en cours de développement');

      // Démonstration alternative - navigation générale
      console.log('🖱️ Exploration générale de l\'interface');
      await page.waitForTimeout(3000);
    }

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });

  test('🤝 Gestion des propositions et négociations', async ({ page }) => {
    console.log('📹 Démonstration : Gestion des propositions');

    // Étape 1: Connexion
    console.log('🔐 Connexion pour la gestion des propositions');
    await page.goto('/');
    await loginAsUser(page, {
      email: 'mishitouchiwa14@gmail.com',
      password: 'TSAG12025'
    });
    await page.waitForURL(/\/app/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Étape 2: Navigation vers les propositions
    console.log('📋 Accès aux propositions reçues');

    const proposalLinks = [
      page.getByText(/Propositions/i),
      page.getByText(/Offres reçues/i),
      page.getByText(/Offers/i),
      page.getByText(/Negotiations/i)
    ];

    let proposalsFound = false;
    for (const link of proposalLinks) {
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('📄 Section des propositions trouvée');
        await link.click();
        await page.waitForTimeout(3000);
        proposalsFound = true;
        break;
      }
    }

    // Navigation directe
    if (!proposalsFound) {
      const proposalUrls = ['/app/proposals', '/app/offers', '/app/negotiations'];

      for (const url of proposalUrls) {
        console.log(`🌐 Test de navigation vers ${url}`);
        await page.goto(url);
        await page.waitForTimeout(3000);

        const proposalElements = [
          page.locator('[data-testid="proposal-card"]'),
          page.getByText(/Proposé par/i),
          page.getByText(/Prix proposé/i),
          page.getByText(/Accepter/i),
          page.getByText(/Refuser/i)
        ];

        for (const element of proposalElements) {
          if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ Liste des propositions détectée');
            proposalsFound = true;
            break;
          }
        }
        if (proposalsFound) break;
      }
    }

    // Étape 3: Interaction avec les propositions
    if (proposalsFound) {
      console.log('🤝 Traitement des propositions');

      // Test d'acceptation d'une proposition
      const acceptButton = page.getByText(/Accepter/i)
        .or(page.getByText(/Accept/i))
        .or(page.locator('[data-testid="accept-proposal"]'));

      if (await acceptButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Test d\'acceptation de proposition');
        await acceptButton.first().click();
        await page.waitForTimeout(3000);

        // Confirmation si nécessaire
        const confirmButton = page.getByText(/Confirmer/i)
          .or(page.getByText(/Confirm/i));

        if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✔️ Confirmation de l\'acceptation');
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // Test de négociation
      const negotiateButton = page.getByText(/Négocier/i)
        .or(page.getByText(/Negotiate/i))
        .or(page.getByText(/Contre-offre/i));

      if (await negotiateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('💬 Test de négociation');
        await negotiateButton.first().click();
        await page.waitForTimeout(3000);

        const counterOfferInput = page.locator('input[name="counter_price"]')
          .or(page.locator('input[placeholder*="prix"]'));

        if (await counterOfferInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await counterOfferInput.fill('475');
          await page.waitForTimeout(2000);

          const sendCounterButton = page.getByText(/Envoyer/i)
            .or(page.getByText(/Send/i));

          if (await sendCounterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('📤 Envoi de contre-offre');
            await sendCounterButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }

      // Test de refus
      const rejectButton = page.getByText(/Refuser/i)
        .or(page.getByText(/Reject/i))
        .or(page.locator('[data-testid="reject-proposal"]'));

      if (await rejectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('❌ Test de refus de proposition');
        // Simulation sans cliquer pour ne pas affecter les autres tests
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('ℹ️ Interface de gestion des propositions en cours de développement');
    }

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });
});
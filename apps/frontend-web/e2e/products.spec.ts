import { test, expect } from '@playwright/test';
import { loginAsUser, logout } from './utils/auth.test-utils';

/**
 * Tests de gestion des produits pour TSA InnovLab
 * Ces tests couvrent la boutique et la gestion administrative des produits
 * avec enregistrement vidéo pour démonstration
 */
test.describe('🛒 Gestion des Produits TSA InnovLab', () => {

  test.beforeEach(async ({ page }) => {
    console.log('🔐 Connexion préalable pour accéder aux fonctionnalités');
    await page.goto('/');
    await loginAsUser(page, {
      email: 'mishitouchiwa14@gmail.com',
      password: 'TSAG12025'
    });
    await page.waitForURL(/\/app/, { timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test.afterEach(async ({ page }) => {
    console.log('🚪 Déconnexion après le test');
    await logout(page);
    await page.waitForTimeout(1000);
  });

  test('🏪 Navigation et exploration de la boutique', async ({ page }) => {
    console.log('📹 Démonstration : Navigation dans la boutique');

    // Étape 1: Naviguer vers la boutique
    console.log('🛒 Accès à la section boutique');

    // Chercher le lien boutique dans la navigation
    const shopLink = page.getByText(/Shop/i)
      .or(page.getByText(/Boutique/i))
      .or(page.getByText(/Produits/i));

    if (await shopLink.isVisible()) {
      await shopLink.click();
      await page.waitForTimeout(2000);
    } else {
      // Navigation directe vers /app/shop
      await page.goto('/app/shop');
      await page.waitForTimeout(2000);
    }

    // Étape 2: Explorer l'interface de la boutique
    console.log('🔍 Exploration de l\'interface produits');

    // Chercher les éléments de la boutique
    const productElements = [
      page.getByText(/Catalogue/i),
      page.getByText(/Produits/i),
      page.locator('[data-testid="product-card"]'),
      page.locator('.product-item'),
      page.getByText(/Catégories/i)
    ];

    // Vérifier la présence d'éléments de la boutique
    let shopElementFound = false;
    for (const element of productElements) {
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        shopElementFound = true;
        break;
      }
    }

    // Si des éléments de boutique sont trouvés, les explorer
    if (shopElementFound) {
      console.log('✅ Interface boutique détectée');
      await page.waitForTimeout(3000);

      // Tenter d'interagir avec les filtres si disponibles
      const searchInput = page.locator('input[placeholder*="recherch"]');
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('🔎 Test de la fonction de recherche');
        await searchInput.fill('test');
        await page.waitForTimeout(2000);
      }

      // Tenter d'interagir avec les catégories si disponibles
      const categoryFilter = page.locator('select').first();
      if (await categoryFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('📂 Test des filtres par catégorie');
        await categoryFilter.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('ℹ️ Interface boutique en cours de développement');
      // Continuer le test même si la boutique n'est pas encore implémentée
    }

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });

  test('📋 Gestion administrative des produits', async ({ page }) => {
    console.log('📹 Démonstration : Interface d\'administration des produits');

    // Étape 1: Tentative d'accès à l'interface admin
    console.log('⚙️ Accès à l\'interface d\'administration');

    // Chercher les liens d'administration
    const adminLinks = [
      page.getByText(/Administration/i),
      page.getByText(/Admin/i),
      page.getByText(/Gestion/i),
      page.getByText(/Products/i)
    ];

    let adminFound = false;
    for (const link of adminLinks) {
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('🔗 Lien d\'administration trouvé');
        await link.click();
        await page.waitForTimeout(2000);
        adminFound = true;
        break;
      }
    }

    // Navigation directe vers les sections d'administration possibles
    if (!adminFound) {
      const adminUrls = ['/app/admin/products', '/app/products', '/app/admin'];

      for (const url of adminUrls) {
        console.log(`🌐 Test de navigation vers ${url}`);
        await page.goto(url);
        await page.waitForTimeout(3000);

        // Vérifier si nous sommes sur une page d'administration
        const adminElements = [
          page.getByText(/Gestion des produits/i),
          page.getByText(/Product Management/i),
          page.getByText(/Administration/i),
          page.getByRole('table'),
          page.getByText(/Créer/i).and(page.getByText(/produit/i))
        ];

        for (const element of adminElements) {
          if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ Interface d\'administration détectée');
            adminFound = true;
            await page.waitForTimeout(3000);
            break;
          }
        }

        if (adminFound) break;
      }
    }

    // Étape 2: Test des fonctionnalités d'administration si disponibles
    if (adminFound) {
      console.log('🛠️ Test des fonctionnalités d\'administration');

      // Test de création de produit
      const createButton = page.getByText(/Créer/i)
        .or(page.getByText(/Nouveau/i))
        .or(page.getByText(/Ajouter/i));

      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('➕ Test de création de produit');
        await createButton.click();
        await page.waitForTimeout(3000);

        // Remplir le formulaire si disponible
        const nameInput = page.locator('input[name="name"]')
          .or(page.locator('input[placeholder*="nom"]'));

        if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('📝 Remplissage du formulaire de produit');
          await nameInput.fill(`Produit Test ${Date.now()}`);
          await page.waitForTimeout(2000);

          const descriptionInput = page.locator('textarea[name="description"]')
            .or(page.locator('input[name="description"]'));

          if (await descriptionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await descriptionInput.fill('Description du produit test');
            await page.waitForTimeout(2000);
          }

          const priceInput = page.locator('input[name="price"]')
            .or(page.locator('input[placeholder*="prix"]'));

          if (await priceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await priceInput.fill('99.99');
            await page.waitForTimeout(2000);
          }

          // Tentative de soumission
          const submitButton = page.getByText(/Enregistrer/i)
            .or(page.getByText(/Créer/i))
            .or(page.getByText(/Sauvegarder/i));

          if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('💾 Soumission du formulaire');
            await submitButton.click();
            await page.waitForTimeout(3000);
          }
        }
      }
    } else {
      console.log('ℹ️ Interface d\'administration en cours de développement');
    }

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });

  test('🔍 Recherche et filtrage des produits', async ({ page }) => {
    console.log('📹 Démonstration : Fonctionnalités de recherche et filtrage');

    // Étape 1: Aller vers la section produits/boutique
    console.log('🛒 Navigation vers la section produits');

    const possibleUrls = ['/app/shop', '/app/products', '/app/boutique'];
    let productsPageFound = false;

    for (const url of possibleUrls) {
      await page.goto(url);
      await page.waitForTimeout(2000);

      // Chercher des éléments de recherche/filtrage
      const searchElements = [
        page.locator('input[placeholder*="recherch"]'),
        page.locator('input[placeholder*="search"]'),
        page.locator('select').first(),
        page.getByText(/Filtrer/i),
        page.getByText(/Catégories/i)
      ];

      for (const element of searchElements) {
        if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
          productsPageFound = true;
          break;
        }
      }

      if (productsPageFound) break;
    }

    // Étape 2: Test des fonctionnalités de recherche si disponibles
    if (productsPageFound) {
      console.log('🔎 Test de la fonction de recherche');

      const searchInput = page.locator('input[placeholder*="recherch"]')
        .or(page.locator('input[placeholder*="search"]'));

      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('électronique');
        await page.waitForTimeout(3000);

        // Test d'effacement de recherche
        await searchInput.clear();
        await page.waitForTimeout(2000);
      }

      // Test des filtres par catégorie
      console.log('📂 Test des filtres par catégorie');
      const categorySelect = page.locator('select').first();

      if (await categorySelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await categorySelect.click();
        await page.waitForTimeout(2000);

        const options = await categorySelect.locator('option').count();
        if (options > 1) {
          await categorySelect.selectOption({ index: 1 });
          await page.waitForTimeout(3000);
        }
      }

      // Test des filtres de prix si disponibles
      const priceFilter = page.locator('input[name="price"]')
        .or(page.locator('input[placeholder*="prix"]'));

      if (await priceFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('💰 Test des filtres de prix');
        await priceFilter.fill('50');
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('ℹ️ Fonctionnalités de recherche en cours de développement');
    }

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });

  test('🛍️ Simulation d\'achat et panier', async ({ page }) => {
    console.log('📹 Démonstration : Processus d\'achat et gestion du panier');

    // Étape 1: Navigation vers la boutique
    console.log('🛒 Accès à la boutique pour simuler un achat');
    await page.goto('/app/shop');
    await page.waitForTimeout(3000);

    // Étape 2: Recherche de produits à ajouter au panier
    console.log('🔍 Recherche de produits disponibles');

    const productElements = [
      page.locator('[data-testid="product-card"]'),
      page.locator('.product-item'),
      page.locator('.product'),
      page.getByText(/Ajouter au panier/i),
      page.getByText(/Add to cart/i)
    ];

    let productFound = false;
    for (const element of productElements) {
      const count = await element.count().catch(() => 0);
      if (count > 0) {
        console.log('🎯 Produits détectés dans la boutique');
        productFound = true;

        // Tenter d'interagir avec le premier produit
        await element.first().click();
        await page.waitForTimeout(3000);
        break;
      }
    }

    // Étape 3: Test d'ajout au panier si des produits sont disponibles
    if (productFound) {
      console.log('🛒 Tentative d\'ajout au panier');

      const addToCartButton = page.getByText(/Ajouter/i)
        .or(page.getByText(/Add to cart/i))
        .or(page.locator('[data-testid="add-to-cart"]'));

      if (await addToCartButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addToCartButton.click();
        await page.waitForTimeout(3000);

        // Vérifier l'indication d'ajout réussi
        const successIndicators = [
          page.getByText(/Ajouté/i),
          page.getByText(/Added/i),
          page.locator('[data-testid="cart-count"]')
        ];

        for (const indicator of successIndicators) {
          if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Produit ajouté au panier avec succès');
            break;
          }
        }
      }

      // Test d'accès au panier
      console.log('🛒 Accès au panier');
      const cartButton = page.getByText(/Panier/i)
        .or(page.getByText(/Cart/i))
        .or(page.locator('[data-testid="cart-button"]'));

      if (await cartButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cartButton.click();
        await page.waitForTimeout(3000);

        // Test de modification du panier si accessible
        const quantityInput = page.locator('input[type="number"]');
        if (await quantityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('📊 Test de modification des quantités');
          await quantityInput.fill('2');
          await page.waitForTimeout(2000);
        }
      }
    } else {
      console.log('ℹ️ Fonctionnalité de panier en cours de développement');

      // Démonstration alternative : navigation dans l'interface
      console.log('🖱️ Démonstration de navigation alternative');
      await page.waitForTimeout(2000);
    }

    // Pause finale pour la démonstration
    await page.waitForTimeout(3000);
  });
});

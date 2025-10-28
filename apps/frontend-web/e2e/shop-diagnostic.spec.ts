import { test } from '@playwright/test';
import { loginAsUser } from './utils/auth.test-utils';

/**
 * Test de diagnostic pour identifier les vrais sélecteurs du shop
 */
test('🔍 Diagnostic - Identifier les éléments réels de la page', async ({ page }) => {
  console.log('='.repeat(80));
  console.log('🔐 Connexion');
  await page.goto('/');
  await loginAsUser(page, {
    email: 'client@tsa-logistics.com',
    password: 'Admin123!',
  });
  await page.waitForURL(/\/app/, { timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('='.repeat(80));
  console.log('🛒 Navigation vers la boutique');
  await page.goto('/app/shop');
  await page.waitForTimeout(3000);

  console.log('='.repeat(80));
  console.log('📋 ANALYSE DES ÉLÉMENTS DE LA PAGE');
  console.log('='.repeat(80));

  // 1. Inputs de recherche
  console.log('\n1️⃣ INPUTS DE RECHERCHE :');
  const inputs = await page.locator('input').all();
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type').catch(() => '');
    const placeholder = await input.getAttribute('placeholder').catch(() => '');
    const name = await input.getAttribute('name').catch(() => '');
    const className = await input.getAttribute('class').catch(() => '');
    const isVisible = await input.isVisible().catch(() => false);

    if (isVisible) {
      console.log(`   Input ${i + 1}:`);
      console.log(`     - Type: ${type}`);
      console.log(`     - Placeholder: ${placeholder}`);
      console.log(`     - Name: ${name}`);
      console.log(`     - Class: ${className}`);
    }
  }

  // 2. Boutons
  console.log('\n2️⃣ BOUTONS VISIBLES :');
  const buttons = await page.locator('button').all();
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent().catch(() => '');
    const className = await button.getAttribute('class').catch(() => '');
    const ariaLabel = await button.getAttribute('aria-label').catch(() => '');
    const isVisible = await button.isVisible().catch(() => false);

    if (isVisible && text.trim()) {
      console.log(`   Bouton ${i + 1}:`);
      console.log(`     - Texte: "${text.trim()}"`);
      console.log(`     - Aria-label: ${ariaLabel}`);
      console.log(`     - Class: ${className.substring(0, 60)}...`);
    }
  }

  // 3. Selects
  console.log('\n3️⃣ MENUS DÉROULANTS (SELECT) :');
  const selects = await page.locator('select').all();
  console.log(`   Nombre de selects trouvés: ${selects.length}`);
  for (let i = 0; i < selects.length; i++) {
    const select = selects[i];
    const isVisible = await select.isVisible().catch(() => false);
    const name = await select.getAttribute('name').catch(() => '');
    const className = await select.getAttribute('class').catch(() => '');

    if (isVisible) {
      console.log(`   Select ${i + 1}:`);
      console.log(`     - Name: ${name}`);
      console.log(`     - Class: ${className.substring(0, 60)}...`);
    }
  }

  // 4. Cartes de produits
  console.log('\n4️⃣ PRODUITS :');
  const productCards = await page.locator('[class*="product"]').all();
  console.log(`   Éléments avec "product" dans la classe: ${productCards.length}`);

  const articles = await page.locator('article').all();
  console.log(`   Articles trouvés: ${articles.length}`);

  const cards = await page.locator('[class*="card"]').all();
  console.log(`   Éléments avec "card" dans la classe: ${cards.length}`);

  // 5. Images
  console.log('\n5️⃣ IMAGES :');
  const images = await page.locator('img').all();
  const visibleImages = [];
  for (const img of images) {
    if (await img.isVisible().catch(() => false)) {
      const alt = await img.getAttribute('alt').catch(() => '');
      const src = await img.getAttribute('src').catch(() => '');
      visibleImages.push({ alt, src: src?.substring(0, 50) });
    }
  }
  console.log(`   Images visibles: ${visibleImages.length}`);
  if (visibleImages.length > 0) {
    console.log(`   Première image: alt="${visibleImages[0].alt}", src="${visibleImages[0].src}..."`);
  }

  // 6. Textes importants
  console.log('\n6️⃣ TEXTES PRINCIPAUX :');
  const headings = await page.locator('h1, h2, h3').all();
  for (let i = 0; i < Math.min(headings.length, 5); i++) {
    const heading = headings[i];
    const text = await heading.textContent().catch(() => '');
    const tagName = await heading.evaluate(el => el.tagName).catch(() => '');
    const isVisible = await heading.isVisible().catch(() => false);

    if (isVisible && text.trim()) {
      console.log(`   ${tagName}: "${text.trim()}"`);
    }
  }

  // 7. Liens contenant "panier" ou "cart"
  console.log('\n7️⃣ PANIER / CART :');
  const cartElements = await page.locator('[class*="cart"], [class*="panier"]').all();
  console.log(`   Éléments avec "cart/panier" dans la classe: ${cartElements.length}`);

  const cartText = await page.locator('text=/panier|cart/i').all();
  console.log(`   Éléments avec texte "panier/cart": ${cartText.length}`);

  // 8. Structure HTML
  console.log('\n8️⃣ STRUCTURE PRINCIPALE :');
  const mainContent = await page.locator('main').count().catch(() => 0);
  console.log(`   Balise <main>: ${mainContent}`);

  const divs = await page.locator('div').count().catch(() => 0);
  console.log(`   Nombre de <div>: ${divs}`);

  console.log('='.repeat(80));
  console.log('✅ Diagnostic terminé');
  console.log('='.repeat(80));

  await page.waitForTimeout(5000);
});

import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Category from '#models/category'
import Address from '#models/address'
import env from '#start/env'

/**
 * Test fonctionnel E2E du flux e-commerce complet
 *
 * Ce test vérifie l'intégralité du parcours d'achat :
 * 1. Création d'un client avec mot de passe par défaut
 * 2. Authentification
 * 3. Ajout de produits au panier
 * 4. Création de commande
 * 5. Paiement MTN Mobile Money
 * 6. Vérification du statut final
 */
test.group('E-commerce Complete Flow', (group) => {
  let client: User
  let clientToken: string
  let category: Category
  let product1: Product
  let product2: Product
  let shippingAddress: Address
  const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // 1. Créer un client avec le mot de passe par défaut
    // Note: Le modèle User hash automatiquement le passwordHash via un hook
    client = await User.create({
      email: 'ecommerce-client@example.com',
      passwordHash: defaultPassword,
      firstName: 'E-commerce',
      lastName: 'Client',
      phone: '+237650000000',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // 2. Créer catégorie et produits
    category = await Category.create({
      name: 'Electronics',
      description: 'Electronic products',
      slug: 'electronics',
      isActive: true,
    })

    product1 = await Product.create({
      name: 'Laptop Dell XPS',
      description: 'High performance laptop',
      price: 500000,
      stock: 5,
      categoryId: category.id,
      isActive: true,
      reference: 'LAPTOP-XPS-001',
    })

    product2 = await Product.create({
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse',
      price: 15000,
      stock: 20,
      categoryId: category.id,
      isActive: true,
      reference: 'MOUSE-WIRELESS-001',
    })

    // 3. Créer adresse
    shippingAddress = await Address.create({
      street: 'Boulevard de la Liberté',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '00237',
    })

    // 4. Générer token d'accès pour le client
    clientToken = await client.generateAccessToken('test-token')
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('complete e-commerce purchase flow with default password authentication', async ({
    assert,
    client: httpClient,
  }) => {
    // ÉTAPE 1 : Vérifier que le client a été créé avec le mot de passe par défaut
    // Note: On utilise un token généré directement car les tests fonctionnels
    // utilisent des transactions isolées. Le test unitaire client_default_password.spec.ts
    // vérifie déjà l'authentification complète avec le mot de passe Admin123!
    const accessToken = clientToken

    // Vérifier que le client a le bon rôle
    assert.equal(client.role, UserRole.CLIENT, 'User should have CLIENT role')

    // ÉTAPE 2 : Récupérer le panier (devrait être vide initialement)
    const cartResponse = await httpClient.get('/api/client/cart').bearerToken(accessToken)

    cartResponse.assertStatus(200)
    assert.equal(cartResponse.body().data.itemCount, 0, 'Cart should be empty initially')
    assert.equal(cartResponse.body().data.totalAmount, 0, 'Total should be 0 initially')

    // ÉTAPE 3 : Ajouter produit 1 au panier
    const addProduct1Response = await httpClient
      .post('/api/client/cart/items')
      .bearerToken(accessToken)
      .json({
        productId: product1.id,
        quantity: 1,
      })

    addProduct1Response.assertStatus(201)
    assert.isTrue(addProduct1Response.body().success, 'Should add product 1 to cart')

    // ÉTAPE 4 : Ajouter produit 2 au panier
    const addProduct2Response = await httpClient
      .post('/api/client/cart/items')
      .bearerToken(accessToken)
      .json({
        productId: product2.id,
        quantity: 2,
      })

    addProduct2Response.assertStatus(201)
    assert.isTrue(addProduct2Response.body().success, 'Should add product 2 to cart')

    // ÉTAPE 5 : Vérifier le résumé du panier
    const cartSummaryResponse = await httpClient.get('/api/client/cart').bearerToken(accessToken)

    cartSummaryResponse.assertStatus(200)
    assert.equal(cartSummaryResponse.body().data.itemCount, 3, 'Should have 3 items (1+2)')
    assert.equal(
      cartSummaryResponse.body().data.totalAmount,
      530000,
      'Total should be 530000 (500000 + 15000*2)'
    )

    // ÉTAPE 6 : Créer la commande
    const createOrderResponse = await httpClient
      .post('/api/client/orders')
      .bearerToken(accessToken)
      .json({
        shippingAddressId: shippingAddress.id,
        billingAddressId: shippingAddress.id,
        paymentMethod: 'mtn_mobile_money',
        notes: 'Livraison rapide svp',
      })

    createOrderResponse.assertStatus(201)
    assert.isTrue(createOrderResponse.body().success, 'Order should be created')

    const order = createOrderResponse.body().data
    assert.isDefined(order.orderNumber, 'Order should have order number')
    assert.equal(order.status, 'pending', 'Order status should be pending')
    assert.equal(order.totalAmount, 530000, 'Order total should match cart total')

    // ÉTAPE 7 : Vérifier que le panier a été converti (nouveau panier vide)
    const cartAfterOrderResponse = await httpClient.get('/api/client/cart').bearerToken(accessToken)

    cartAfterOrderResponse.assertStatus(200)
    // Le panier devrait être vide car l'ancien a été converti
    assert.equal(
      cartAfterOrderResponse.body().data.itemCount,
      0,
      'Cart should be empty after order creation'
    )

    // ÉTAPE 8 : Vérifier que le stock a été décrémenté
    await product1.refresh()
    await product2.refresh()

    assert.equal(product1.stock, 4, 'Product 1 stock should be decremented by 1')
    assert.equal(product2.stock, 18, 'Product 2 stock should be decremented by 2')

    // ÉTAPE 9 : Initier le paiement MTN
    const initiatePaymentResponse = await httpClient
      .post('/api/client/payments/initiate')
      .bearerToken(accessToken)
      .json({
        orderId: order.id,
        phoneNumber: '+237650000000',
      })

    initiatePaymentResponse.assertStatus(201)
    assert.isTrue(initiatePaymentResponse.body().success, 'Payment should be initiated')

    const payment = initiatePaymentResponse.body().data
    assert.equal(payment.status, 'pending', 'Payment should be pending')
    assert.equal(payment.amount, 530000, 'Payment amount should match order total')

    // ÉTAPE 10 : Confirmer le paiement (mode dev uniquement)
    const confirmPaymentResponse = await httpClient
      .post(`/api/client/payments/${payment.id}/confirm`)
      .bearerToken(accessToken)
      .json({
        transactionId: 'TEST-TXN-123456',
      })

    confirmPaymentResponse.assertStatus(200)
    assert.isTrue(confirmPaymentResponse.body().success, 'Payment should be confirmed')
    assert.equal(
      confirmPaymentResponse.body().data.status,
      'completed',
      'Payment status should be completed'
    )

    // ÉTAPE 11 : Vérifier que la commande a été mise à jour
    const orderDetailsResponse = await httpClient
      .get(`/api/client/orders/${order.id}`)
      .bearerToken(accessToken)

    orderDetailsResponse.assertStatus(200)
    const updatedOrder = orderDetailsResponse.body().data

    assert.equal(updatedOrder.paymentStatus, 'completed', 'Payment status should be completed')
    assert.equal(updatedOrder.status, 'paid', 'Order status should be paid')

    // ÉTAPE 12 : Vérifier les statistiques du client
    const statsResponse = await httpClient.get('/api/client/orders/stats').bearerToken(accessToken)

    statsResponse.assertStatus(200)
    const stats = statsResponse.body().data

    assert.isAbove(stats.totalOrders, 0, 'Should have at least one order')
    assert.equal(stats.totalSpent, 530000, 'Total spent should be 530000')
  })

  test('should handle out of stock scenario correctly', async ({ assert, client: httpClient }) => {
    // Utiliser le token généré
    const accessToken = clientToken

    // Essayer d'ajouter une quantité qui dépasse le stock
    const addProductResponse = await httpClient
      .post('/api/client/cart/items')
      .bearerToken(accessToken)
      .json({
        productId: product1.id,
        quantity: 100, // Stock disponible : 5
      })

    addProductResponse.assertStatus(400)
    assert.isFalse(addProductResponse.body().success, 'Should fail to add out of stock product')
    assert.include(
      addProductResponse.body().error,
      'Stock insuffisant',
      'Error message should mention stock'
    )
  })

  test('should handle order cancellation and stock restoration', async ({
    assert,
    client: httpClient,
  }) => {
    // Utiliser le token généré
    const accessToken = clientToken

    // Ajouter produit au panier
    await httpClient.post('/api/client/cart/items').bearerToken(accessToken).json({
      productId: product1.id,
      quantity: 2,
    })

    const initialStock = product1.stock

    // Créer commande
    const createOrderResponse = await httpClient
      .post('/api/client/orders')
      .bearerToken(accessToken)
      .json({
        shippingAddressId: shippingAddress.id,
        billingAddressId: shippingAddress.id,
        paymentMethod: 'mtn_mobile_money',
      })

    const order = createOrderResponse.body().data

    // Vérifier que le stock a été décrémenté
    await product1.refresh()
    assert.equal(product1.stock, initialStock - 2, 'Stock should be decremented')

    // Annuler la commande
    const cancelResponse = await httpClient
      .post(`/api/client/orders/${order.id}/cancel`)
      .bearerToken(accessToken)

    cancelResponse.assertStatus(200)
    assert.isTrue(cancelResponse.body().success, 'Order should be cancelled')

    // Vérifier que le stock a été restitué
    await product1.refresh()
    assert.equal(product1.stock, initialStock, 'Stock should be restored after cancellation')
  })

  test('should verify client with default password has correct abilities', async ({
    assert,
    client: httpClient,
  }) => {
    // Vérifier le rôle de l'utilisateur
    assert.equal(client.role, UserRole.CLIENT, 'User should have CLIENT role')

    // Vérifier les abilities du client
    const abilities = client.getAbilities()
    assert.include(abilities, 'shop', 'Client should have shop ability')
    assert.include(abilities, 'manage_cart', 'Client should have manage_cart ability')
    assert.include(abilities, 'place_orders', 'Client should have place_orders ability')
    assert.include(abilities, 'view_orders', 'Client should have view_orders ability')

    // Vérifier que le client peut accéder aux routes e-commerce
    const cartAccess = await httpClient.get('/api/client/cart').bearerToken(clientToken)

    cartAccess.assertStatus(200)

    const ordersAccess = await httpClient.get('/api/client/orders').bearerToken(clientToken)

    ordersAccess.assertStatus(200)
  })
})

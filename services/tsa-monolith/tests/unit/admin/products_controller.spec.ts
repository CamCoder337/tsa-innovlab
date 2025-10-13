import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Product from '#models/product'
import Category from '#models/category'
import User, { UserRole, UserStatus } from '#models/user'

test.group('Admin Products Controller', (group) => {
  let adminUser: User
  let adminToken: string
  let testCategory: Category

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Créer un utilisateur admin pour les tests
    adminUser = await User.create({
      email: 'admin-test@example.com',
      passwordHash: 'password123',
      firstName: 'Admin',
      lastName: 'Test',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mfaEnabled: true,
    })

    // Générer un token d'accès
    const token = await adminUser.generateAccessToken('test-token')
    adminToken = token

    // Créer une catégorie de test
    testCategory = await Category.create({
      name: 'Test Category',
      description: 'Category for testing',
      isActive: true,
      displayOrder: 1,
    })
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should list products with pagination', async ({ client, assert }) => {
    // Créer quelques produits de test
    await Product.createMany([
      {
        name: 'Product 1',
        description: 'First product',
        price: 99.99,
        stock: 10,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
      {
        name: 'Product 2',
        description: 'Second product',
        price: 199.99,
        stock: 5,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
    ])

    const response = await client
      .get('/api/admin/products')
      .bearerToken(adminToken)
      .qs({ page: 1, limit: 1 })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Products retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.products)
    assert.exists(body.data.pagination)
    assert.equal(body.data.pagination.perPage, 1)
  })

  test('should search products by name and description', async ({ client, assert }) => {
    // Clear existing products first to ensure test isolation
    await Database.rawQuery('DELETE FROM products')

    await Product.create({
      name: 'Gaming Laptop',
      description: 'High-performance gaming laptop',
      reference: 'GAM-LAP-001',
      price: 1599.99,
      stock: 3,
      categoryId: testCategory.id,
      createdBy: adminUser.id,
      isActive: true,
    })

    const response = await client
      .get('/api/admin/products')
      .bearerToken(adminToken)
      .qs({ search: 'Gaming' })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.products.data.length, 1)
    assert.equal(body.data.products.data[0].name, 'Gaming Laptop')
  })

  test('should filter products by category', async ({ client, assert }) => {
    const otherCategory = await Category.create({
      name: 'Other Category',
      isActive: true,
      displayOrder: 2,
    })

    await Product.createMany([
      {
        name: 'Product in Test Category',
        price: 100,
        stock: 5,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
      {
        name: 'Product in Other Category',
        price: 200,
        stock: 3,
        categoryId: otherCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
    ])

    const response = await client
      .get('/api/admin/products')
      .bearerToken(adminToken)
      .qs({ categoryId: testCategory.id })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.products.data.length, 1)
    assert.equal(body.data.products.data[0].name, 'Product in Test Category')
  })

  test('should filter products by price range', async ({ client, assert }) => {
    // Clear existing products first to ensure test isolation
    await Database.rawQuery('DELETE FROM products')

    await Product.createMany([
      {
        name: 'Cheap Product',
        price: 50,
        stock: 8,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
      {
        name: 'Expensive Product',
        price: 500,
        stock: 2,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
    ])

    const response = await client
      .get('/api/admin/products')
      .bearerToken(adminToken)
      .qs({ minPrice: 100, maxPrice: 600 })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.products.data.length, 1)
    assert.equal(body.data.products.data[0].name, 'Expensive Product')
  })

  test('should show a specific product with relations', async ({ client, assert }) => {
    const product = await Product.create({
      name: 'Test Product',
      description: 'A test product',
      price: 299.99,
      stock: 15,
      categoryId: testCategory.id,
      createdBy: adminUser.id,
      isActive: true,
    })

    const response = await client.get(`/api/admin/products/${product.id}`).bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Product retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.product)
    assert.equal(body.data.product.id, product.id)
    assert.exists(body.data.product.category)
    assert.exists(body.data.product.creator)
  })

  test('should create a new product', async ({ client, assert }) => {
    const productData = {
      name: 'New Product',
      description: 'A brand new product',
      reference: 'NEW-PROD-001',
      price: 149.99,
      stock: 20,
      stockAlert: 5,
      unit: 'piece',
      categoryId: testCategory.id,
      imageUrl: 'https://example.com/image.jpg',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      specifications: {
        color: 'Blue',
        weight: '1.5kg',
        dimensions: '30x20x10cm',
      },
      isActive: true,
    }

    const response = await client
      .post('/api/admin/products')
      .bearerToken(adminToken)
      .json(productData)

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Product created successfully',
    })

    const body = response.body()
    assert.equal(body.data.product.name, productData.name)
    assert.equal(body.data.product.price, productData.price)
    assert.equal(body.data.product.createdBy, adminUser.id)

    // Vérifier en base de données
    const savedProduct = await Product.findBy('reference', productData.reference)
    assert.exists(savedProduct)
    assert.equal(savedProduct!.name, productData.name)
  })

  test('should not create product with duplicate reference', async ({ client }) => {
    await Product.create({
      name: 'Existing Product',
      reference: 'EXISTING-REF',
      price: 100,
      stock: 5,
      categoryId: testCategory.id,
      createdBy: adminUser.id,
      isActive: true,
    })

    const response = await client.post('/api/admin/products').bearerToken(adminToken).json({
      name: 'New Product',
      reference: 'EXISTING-REF',
      price: 200,
      categoryId: testCategory.id,
    })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Product reference already exists',
    })
  })

  test('should update an existing product', async ({ client, assert }) => {
    const product = await Product.create({
      name: 'Original Name',
      description: 'Original description',
      price: 100,
      stock: 10,
      categoryId: testCategory.id,
      createdBy: adminUser.id,
      isActive: true,
    })

    const updateData = {
      name: 'Updated Name',
      description: 'Updated description',
      price: 150,
      stock: 15,
      isActive: false,
    }

    const response = await client
      .put(`/api/admin/products/${product.id}`)
      .bearerToken(adminToken)
      .json(updateData)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Product updated successfully',
    })

    // Vérifier en base de données
    await product.refresh()
    assert.equal(product.name, updateData.name)
    assert.equal(product.price, updateData.price)
    assert.equal(product.stock, updateData.stock)
    assert.equal(product.isActive, updateData.isActive)
  })

  test('should delete a product', async ({ client, assert }) => {
    const product = await Product.create({
      name: 'To Delete',
      price: 100,
      stock: 5,
      categoryId: testCategory.id,
      createdBy: adminUser.id,
      isActive: true,
    })

    const response = await client
      .delete(`/api/admin/products/${product.id}`)
      .bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Product deleted successfully',
    })

    // Vérifier que le produit n'existe plus
    const deletedProduct = await Product.find(product.id)
    assert.isNull(deletedProduct)
  })

  test('should perform bulk operations on products', async ({ client, assert }) => {
    const products = await Product.createMany([
      {
        name: 'Product 1',
        price: 100,
        stock: 8,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
      {
        name: 'Product 2',
        price: 200,
        stock: 12,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
    ])

    const productIds = products.map((p) => p.id)

    const response = await client.post('/api/admin/products/bulk').bearerToken(adminToken).json({
      productIds,
      action: 'deactivate',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })

    // Vérifier que les produits ont été désactivés
    const updatedProducts = await Product.query().whereIn('id', productIds)
    assert.isTrue(updatedProducts.every((p) => !p.isActive))
  })

  test('should get product statistics', async ({ client, assert }) => {
    // Créer quelques produits avec différents statuts et stocks
    await Product.createMany([
      {
        name: 'Active Product',
        price: 100,
        stock: 10,
        stockAlert: 5,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
      {
        name: 'Inactive Product',
        price: 200,
        stock: 0,
        stockAlert: 5,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: false,
      },
      {
        name: 'Low Stock Product',
        price: 150,
        stock: 2,
        stockAlert: 5,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
    ])

    const response = await client.get('/api/admin/products/stats').bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Product statistics retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.stats)
    assert.exists(body.data.stats.products)
    assert.exists(body.data.stats.inventory)
    assert.exists(body.data.stats.topCategories)
  })

  test('should get low stock products', async ({ client, assert }) => {
    await Product.createMany([
      {
        name: 'Normal Stock Product',
        price: 100,
        stock: 10,
        stockAlert: 5,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
      {
        name: 'Low Stock Product',
        price: 200,
        stock: 2,
        stockAlert: 5,
        categoryId: testCategory.id,
        createdBy: adminUser.id,
        isActive: true,
      },
    ])

    const response = await client.get('/api/admin/products/low-stock').bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Low stock products retrieved successfully',
    })

    const body = response.body()
    assert.equal(body.data.products.data.length, 1)
    assert.equal(body.data.products.data[0].name, 'Low Stock Product')
  })

  test('should require admin authentication', async ({ client }) => {
    const response = await client.get('/api/admin/products')

    response.assertStatus(401)
  })

  test('should not allow non-admin users', async ({ client }) => {
    const regularUser = await User.create({
      email: 'user@example.com',
      passwordHash: 'password123',
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: true,
    })

    const regularToken = await regularUser.generateAccessToken('test-token')

    const response = await client.get('/api/admin/products').bearerToken(regularToken)

    response.assertStatus(403)
  })
})

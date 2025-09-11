import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Category from '#models/category'
import User, { UserRole, UserStatus } from '#models/user'

test.group('Admin Categories Controller', (group) => {
  let adminUser: User
  let adminToken: string

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
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should list categories with pagination', async ({ client, assert }) => {
    // Créer quelques catégories de test
    await Category.createMany([
      { name: 'Electronics', description: 'Electronic products', isActive: true, displayOrder: 1 },
      { name: 'Furniture', description: 'Office furniture', isActive: true, displayOrder: 2 },
      { name: 'Supplies', description: 'Office supplies', isActive: false, displayOrder: 3 },
    ])

    const response = await client
      .get('/api/admin/categories')
      .bearerToken(adminToken)
      .qs({ page: 1, limit: 2 })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Categories retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.categories)
    assert.exists(body.data.pagination)
    assert.equal(body.data.pagination.perPage, 2)
  })

  test('should search categories by name', async ({ client, assert }) => {
    await Category.create({
      name: 'Computer Hardware',
      description: 'Computer components',
      isActive: true,
      displayOrder: 1,
    })

    const response = await client
      .get('/api/admin/categories')
      .bearerToken(adminToken)
      .qs({ search: 'Computer' })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.categories.data.length, 1)
    assert.equal(body.data.categories.data[0].name, 'Computer Hardware')
  })

  test('should filter categories by active status', async ({ client, assert }) => {
    await Category.createMany([
      { name: 'Active Category', isActive: true, displayOrder: 1 },
      { name: 'Inactive Category', isActive: false, displayOrder: 2 },
    ])

    const response = await client
      .get('/api/admin/categories')
      .bearerToken(adminToken)
      .qs({ isActive: false })

    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.data.categories.data.every((cat: any) => !cat.isActive))
  })

  test('should show a specific category with product stats', async ({ client, assert }) => {
    const category = await Category.create({
      name: 'Test Category',
      description: 'A test category',
      isActive: true,
      displayOrder: 1,
    })

    const response = await client
      .get(`/api/admin/categories/${category.id}`)
      .bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Category retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.category)
    assert.exists(body.data.stats.products)
    assert.equal(body.data.category.id, category.id)
  })

  test('should create a new category', async ({ client, assert }) => {
    const categoryData = {
      name: 'New Category',
      description: 'A brand new category',
      isActive: true,
      displayOrder: 1,
    }

    const response = await client
      .post('/api/admin/categories')
      .bearerToken(adminToken)
      .json(categoryData)

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Category created successfully',
    })

    const body = response.body()
    assert.equal(body.data.category.name, categoryData.name)
    assert.equal(body.data.category.description, categoryData.description)

    // Vérifier en base de données
    const savedCategory = await Category.findBy('name', categoryData.name)
    assert.exists(savedCategory)
    assert.equal(savedCategory!.name, categoryData.name)
  })

  test('should not create category with duplicate name', async ({ client }) => {
    await Category.create({
      name: 'Existing Category',
      isActive: true,
      displayOrder: 1,
    })

    const response = await client.post('/api/admin/categories').bearerToken(adminToken).json({
      name: 'Existing Category',
      description: 'This should fail',
    })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Category name already exists',
    })
  })

  test('should update an existing category', async ({ client, assert }) => {
    const category = await Category.create({
      name: 'Original Name',
      description: 'Original description',
      isActive: true,
      displayOrder: 1,
    })

    const updateData = {
      name: 'Updated Name',
      description: 'Updated description',
      isActive: false,
    }

    const response = await client
      .put(`/api/admin/categories/${category.id}`)
      .bearerToken(adminToken)
      .json(updateData)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Category updated successfully',
    })

    // Vérifier en base de données
    await category.refresh()
    assert.equal(category.name, updateData.name)
    assert.equal(category.description, updateData.description)
    assert.equal(category.isActive, updateData.isActive)
  })

  test('should delete a category without products', async ({ client, assert }) => {
    const category = await Category.create({
      name: 'To Delete',
      isActive: true,
      displayOrder: 1,
    })

    const response = await client
      .delete(`/api/admin/categories/${category.id}`)
      .bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Category deleted successfully',
    })

    // Vérifier que la catégorie n'existe plus
    const deletedCategory = await Category.find(category.id)
    assert.isNull(deletedCategory)
  })

  test('should get category tree structure', async ({ client, assert }) => {
    // Créer une hiérarchie de catégories
    const parentCategory = await Category.create({
      name: 'Parent Category',
      isActive: true,
      displayOrder: 1,
    })

    await Category.create({
      name: 'Child Category',
      parentId: parentCategory.id,
      isActive: true,
      displayOrder: 1,
    })

    const response = await client.get('/api/admin/categories/tree').bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Category tree retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.categories)
    assert.isArray(body.data.categories)

    // Vérifier la structure hiérarchique
    const parentInTree = body.data.categories.find((cat: any) => cat.name === 'Parent Category')
    assert.exists(parentInTree)
    assert.isArray(parentInTree.children)
    assert.equal(parentInTree.children.length, 1)
    assert.equal(parentInTree.children[0].name, 'Child Category')
  })

  test('should require admin authentication', async ({ client }) => {
    const response = await client.get('/api/admin/categories')

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

    const response = await client.get('/api/admin/categories').bearerToken(regularToken)

    response.assertStatus(403)
  })
})

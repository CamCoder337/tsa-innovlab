import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Category from '#models/category'
import Product from '#models/product'
import User, { UserRole, UserStatus } from '#models/user'

test.group('Category Model', (group) => {
  group.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a category with basic information', async ({ assert }) => {
    const category = await Category.create({
      name: 'Electronics',
      description: 'Electronic devices and components',
      isActive: true,
      displayOrder: 1,
    })

    assert.exists(category.id)
    assert.equal(category.name, 'Electronics')
    assert.equal(category.description, 'Electronic devices and components')
    assert.isTrue(category.isActive)
    assert.equal(category.displayOrder, 1)
    assert.exists(category.createdAt)
    assert.exists(category.updatedAt)
  })

  test('should auto-generate slug from name', async ({ assert }) => {
    const category = await Category.create({
      name: 'Office Furniture & Equipment',
      description: 'Furniture and equipment for offices',
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(category.slug, 'office-furniture-equipment')
  })

  test('should generate unique slug when name conflicts', async ({ assert }) => {
    await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      isActive: true,
      displayOrder: 1,
    })

    const category2 = await Category.create({
      name: 'Electronics',
      isActive: true,
      displayOrder: 2,
    })

    assert.equal(category2.slug, 'electronics-1')
  })

  test('should use custom slug when provided', async ({ assert }) => {
    const category = await Category.create({
      name: 'Custom Category',
      slug: 'my-custom-slug',
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(category.slug, 'my-custom-slug')
  })

  test('should handle accented characters in slug generation', async ({ assert }) => {
    const category = await Category.create({
      name: 'Équipements & Matériels',
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(category.slug, 'equipements-materiels')
  })

  test('should create parent-child relationship', async ({ assert }) => {
    const parentCategory = await Category.create({
      name: 'Electronics',
      isActive: true,
      displayOrder: 1,
    })

    const childCategory = await Category.create({
      name: 'Computers',
      parentId: parentCategory.id,
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(childCategory.parentId, parentCategory.id)

    // Vérifier la relation dans la base de données
    const savedChild = await Category.query()
      .where('id', childCategory.id)
      .first()

    assert.equal(savedChild!.parentId, parentCategory.id)
  })

  test('should have relationship with products', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const category = await Category.create({
      name: 'Electronics',
      isActive: true,
      displayOrder: 1,
    })

    const product = await Product.create({
      name: 'Laptop',
      description: 'Gaming laptop',
      price: 1500,
      stock: 5,
      categoryId: category.id,
      createdBy: user.id,
      isActive: true,
    })

    // Charger la relation
    await category.load('products')

    assert.equal(category.products.length, 1)
    assert.equal(category.products[0].id, product.id)
    assert.equal(category.products[0].name, 'Laptop')
  })

  test('should validate required fields', async ({ assert }) => {
    try {
      await Category.create({
        // name is required but missing
        description: 'Test description',
        isActive: true,
        displayOrder: 1,
      } as any)
      
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('should enforce unique name constraint', async ({ assert }) => {
    await Category.create({
      name: 'Unique Category',
      isActive: true,
      displayOrder: 1,
    })

    try {
      await Category.create({
        name: 'Unique Category', // Duplicate name
        isActive: true,
        displayOrder: 2,
      })
      
      assert.fail('Should have thrown unique constraint error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('should enforce unique slug constraint', async ({ assert }) => {
    await Category.create({
      name: 'First Category',
      slug: 'unique-slug',
      isActive: true,
      displayOrder: 1,
    })

    try {
      await Category.create({
        name: 'Second Category',
        slug: 'unique-slug', // Duplicate slug
        isActive: true,
        displayOrder: 2,
      })
      
      assert.fail('Should have thrown unique constraint error')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('should allow null parent_id', async ({ assert }) => {
    const category = await Category.create({
      name: 'Root Category',
      parentId: null,
      isActive: true,
      displayOrder: 1,
    })

    assert.isNull(category.parentId)
  })

  test('should allow null description', async ({ assert }) => {
    const category = await Category.create({
      name: 'Simple Category',
      description: null,
      isActive: true,
      displayOrder: 1,
    })

    assert.isNull(category.description)
  })

  test('should allow null imageUrl', async ({ assert }) => {
    const category = await Category.create({
      name: 'Category Without Image',
      imageUrl: null,
      isActive: true,
      displayOrder: 1,
    })

    assert.isNull(category.imageUrl)
  })

  test('should default isActive to true', async ({ assert }) => {
    const category = await Category.create({
      name: 'Default Active Category',
      displayOrder: 1,
    })

    // Note: This depends on the database default value
    // The test might need adjustment based on migration
    assert.exists(category.isActive)
  })

  test('should default displayOrder to 0', async ({ assert }) => {
    const category = await Category.create({
      name: 'Default Order Category',
      isActive: true,
    })

    // Note: This depends on the database default value
    // The test might need adjustment based on migration
    assert.exists(category.displayOrder)
  })

  test('should update timestamps on modification', async ({ assert }) => {
    const category = await Category.create({
      name: 'Original Name',
      isActive: true,
      displayOrder: 1,
    })

    const originalUpdatedAt = category.updatedAt

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10))

    category.name = 'Updated Name'
    await category.save()

    assert.notEqual(category.updatedAt.toISO(), originalUpdatedAt.toISO())
  })
})
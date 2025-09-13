import type { HttpContext } from '@adonisjs/core/http'
import Database from '@adonisjs/lucid/services/db'
import Product from '#models/product'
import Category from '#models/category'
import AuditLog from '#models/audit_log'
import {
  bulkProductValidator,
  createProductValidator,
  productsListValidator,
  updateProductValidator,
} from '#validators/product_validator'

export default class ProductsController {
  /**
   * Liste paginée des produits avec filtres et recherche
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      auth.getUserOrFail()
      const filters = await request.validateUsing(productsListValidator)

      const {
        page = 1,
        limit = 20,
        search,
        categoryId,
        isActive,
        minPrice,
        maxPrice,
        inStock,
        lowStock,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters

      const query = Product.query().preload('category').preload('creator')

      // Recherche par nom, description ou référence
      if (search) {
        query.where((builder) => {
          builder
            .whereILike('name', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
            .orWhereILike('reference', `%${search}%`)
        })
      }

      // Filtre par catégorie
      if (categoryId) {
        query.where('categoryId', categoryId)
      }

      // Filtre par statut actif
      if (typeof isActive === 'boolean') {
        query.where('isActive', isActive)
      }

      // Filtre par prix
      if (minPrice !== undefined) {
        query.where('price', '>=', minPrice)
      }
      if (maxPrice !== undefined) {
        query.where('price', '<=', maxPrice)
      }

      // Filtre par stock
      if (inStock) {
        query.where('stock', '>', 0)
      }
      if (lowStock) {
        query.whereRaw('stock <= stock_alert')
      }

      // Tri
      if (sortBy === ('category' as any)) {
        query.join('categories', 'products.category_id', 'categories.id')
        query.orderBy('categories.name', sortOrder)
        query.select('products.*') // Éviter les colonnes dupliquées
      } else {
        query.orderBy(sortBy, sortOrder)
      }

      // Pagination
      const products = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products: products.serialize(),
          pagination: {
            currentPage: products.currentPage,
            perPage: products.perPage,
            total: products.total,
            lastPage: products.lastPage,
            hasNext: products.currentPage < products.lastPage,
            hasPrev: products.currentPage > 1,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve products',
        errors: [error.message],
      })
    }
  }

  /**
   * Afficher un produit spécifique
   */
  async show({ params, response }: HttpContext) {
    try {
      const product = await Product.findOrFail(params.id)

      // Charger les relations
      await product.load('category')
      await product.load('creator')

      return response.json({
        success: true,
        message: 'Product retrieved successfully',
        data: { product: product.serialize() },
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: 'Product not found',
        errors: [error.message],
      })
    }
  }

  /**
   * Créer un nouveau produit
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(createProductValidator)

      // Vérifier l'unicité de la référence si fournie
      if (data.reference) {
        const existingProduct = await Product.findBy('reference', data.reference)
        if (existingProduct) {
          return response.status(422).json({
            success: false,
            message: 'Product reference already exists',
            errors: ['A product with this reference already exists'],
          })
        }
      }

      // Vérifier que la catégorie existe si spécifiée
      if (data.categoryId) {
        const category = await Category.find(data.categoryId)
        if (!category) {
          return response.status(422).json({
            success: false,
            message: 'Category not found',
            errors: ['The specified category does not exist'],
          })
        }
      }

      // Traiter les images en array JSON
      const processedData = {
        ...data,
        images: data.images ? JSON.stringify(data.images) : JSON.stringify([]),
        specifications: data.specifications
          ? JSON.stringify(data.specifications)
          : JSON.stringify({}),
        isActive: data.isActive ?? true,
        stock: data.stock ?? 0,
        stockAlert: data.stockAlert ?? 5,
        unit: data.unit ?? 'unité',
        createdBy: user.id,
      }

      const product = await Product.create(processedData)

      // Charger les relations pour la réponse
      await product.load('category')
      await product.load('creator')

      // Log de l'audit
      await AuditLog.create({
        action: 'product.create',
        entityType: 'products',
        entityId: product.id,
        userId: user.id,
        newValues: product.serialize(),
      })

      return response.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product: product.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to create product',
        errors: [error.message],
      })
    }
  }

  /**
   * Mettre à jour un produit existant
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const product = await Product.findOrFail(params.id)
      const data = await request.validateUsing(updateProductValidator)

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = product.serialize()

      // Vérifier l'unicité de la référence si modifiée
      if (data.reference && data.reference !== product.reference) {
        const existingProduct = await Product.findBy('reference', data.reference)
        if (existingProduct) {
          return response.status(422).json({
            success: false,
            message: 'Product reference already exists',
            errors: ['A product with this reference already exists'],
          })
        }
      }

      // Vérifier que la catégorie existe si spécifiée
      if (data.categoryId) {
        const category = await Category.find(data.categoryId)
        if (!category) {
          return response.status(422).json({
            success: false,
            message: 'Category not found',
            errors: ['The specified category does not exist'],
          })
        }
      }

      // Traiter les données avant mise à jour
      const processedData = { ...data }
      if (data.images) {
        processedData.images = JSON.stringify(data.images) as any
      }
      if (data.specifications) {
        processedData.specifications = JSON.stringify(data.specifications) as any
      }

      // Mettre à jour le produit
      product.merge(processedData)
      await product.save()

      // Charger les relations pour la réponse
      await product.load('category')
      await product.load('creator')

      // Log de l'audit
      await AuditLog.create({
        action: 'product.update',
        entityType: 'products',
        entityId: product.id,
        userId: user.id,
        oldValues,
        newValues: product.serialize(),
      })

      return response.json({
        success: true,
        message: 'Product updated successfully',
        data: { product: product.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to update product',
        errors: [error.message],
      })
    }
  }

  /**
   * Supprimer un produit
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const product = await Product.findOrFail(params.id)

      // Sauvegarder les données pour l'audit
      const oldValues = product.serialize()

      // Supprimer le produit
      await product.delete()

      // Log de l'audit
      await AuditLog.create({
        action: 'product.delete',
        entityType: 'products',
        entityId: params.id,
        userId: user.id,
        oldValues,
      })

      return response.json({
        success: true,
        message: 'Product deleted successfully',
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to delete product',
        errors: [error.message],
      })
    }
  }

  /**
   * Opérations en lot sur les produits
   */
  async bulk({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { productIds, action } = await request.validateUsing(bulkProductValidator)

      const products = await Product.query().whereIn('id', productIds)

      if (products.length !== productIds.length) {
        return response.status(422).json({
          success: false,
          message: 'Some products were not found',
          errors: ['One or more product IDs are invalid'],
        })
      }

      let message = ''

      switch (action) {
        case 'activate':
          await Product.query().whereIn('id', productIds).update({ isActive: true })
          message = `${products.length} product(s) activated successfully`
          break

        case 'deactivate':
          await Product.query().whereIn('id', productIds).update({ isActive: false })
          message = `${products.length} product(s) deactivated successfully`
          break

        case 'delete':
          await Product.query().whereIn('id', productIds).delete()
          message = `${products.length} product(s) deleted successfully`
          break

        default:
          return response.status(422).json({
            success: false,
            message: 'Invalid action',
            errors: ['The specified action is not supported'],
          })
      }

      // Log de l'audit pour chaque produit
      for (const product of products) {
        await AuditLog.create({
          action: `product.bulk_${action}`,
          entityType: 'products',
          entityId: product.id,
          userId: user.id,
          oldValues: product.serialize(),
        })
      }

      return response.json({
        success: true,
        message,
        data: {
          processed: products.length,
          action,
        },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to perform bulk operation',
        errors: [error.message],
      })
    }
  }

  /**
   * Statistiques des produits
   */
  async stats({ response }: HttpContext) {
    try {
      // Requêtes en parallèle pour les statistiques
      const [
        totalProducts,
        activeProducts,
        inactiveProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValue,
        categoriesWithProducts,
      ] = await Promise.all([
        Product.query().count('* as total'),
        Product.query().where('isActive', true).count('* as total'),
        Product.query().where('isActive', false).count('* as total'),
        Product.query()
          .whereRaw('stock <= stock_alert')
          .where('isActive', true)
          .count('* as total'),
        Product.query().where('stock', 0).where('isActive', true).count('* as total'),
        Product.query()
          .where('isActive', true)
          .select(Database.raw('SUM(price * stock) as value'))
          .first(),
        Category.query()
          .join('products', 'categories.id', 'products.category_id')
          .groupBy('categories.id', 'categories.name')
          .select('categories.name')
          .count('products.id as product_count')
          .orderBy('product_count', 'desc')
          .limit(10),
      ])

      const stats = {
        products: {
          total: Number(totalProducts[0].$extras.total),
          active: Number(activeProducts[0].$extras.total),
          inactive: Number(inactiveProducts[0].$extras.total),
          lowStock: Number(lowStockProducts[0].$extras.total),
          outOfStock: Number(outOfStockProducts[0].$extras.total),
        },
        inventory: {
          totalValue: Number(totalValue?.$extras?.value || 0),
        },
        topCategories: categoriesWithProducts.map((cat) => ({
          name: cat.name,
          productCount: Number(cat.$extras.product_count),
        })),
      }

      return response.json({
        success: true,
        message: 'Product statistics retrieved successfully',
        data: { stats },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve product statistics',
        errors: [error.message],
      })
    }
  }

  /**
   * Alerte de stock bas
   */
  async lowStock({ request, response }: HttpContext) {
    try {
      const { page = 1, limit = 20 } = request.qs()

      const products = await Product.query()
        .whereRaw('stock <= stock_alert')
        .where('isActive', true)
        .preload('category')
        .orderBy('stock', 'asc')
        .paginate(page, limit)

      return response.json({
        success: true,
        message: 'Low stock products retrieved successfully',
        data: {
          products: products.serialize(),
          pagination: {
            currentPage: products.currentPage,
            perPage: products.perPage,
            total: products.total,
            lastPage: products.lastPage,
            hasNext: products.currentPage < products.lastPage,
            hasPrev: products.currentPage > 1,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve low stock products',
        errors: [error.message],
      })
    }
  }
}

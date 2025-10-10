import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { productsListValidator } from '#validators/product_validator'

export default class ProductsController {
  /**
   * Liste publique des produits actifs (catalogue boutique)
   */
  async index({ request, response }: HttpContext) {
    try {
      const filters = await request.validateUsing(productsListValidator)

      const {
        page = 1,
        limit = 20,
        search,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
      } = filters

      const query = Product.query()
        .where('isActive', true) // Seulement les produits actifs
        .preload('category')

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

      // Filtre par prix
      if (minPrice !== undefined) {
        query.where('price', '>=', minPrice)
      }
      if (maxPrice !== undefined) {
        query.where('price', '<=', maxPrice)
      }

      // Filtre par stock (uniquement les produits en stock)
      if (inStock) {
        query.where('stock', '>', 0)
      }

      // Tri
      if (sortBy === ('category' as any)) {
        query.join('categories', 'products.category_id', 'categories.id')
        query.orderBy('categories.name', sortOrder)
        query.select('products.*')
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
   * Détails d'un produit spécifique (public)
   */
  async show({ params, response }: HttpContext) {
    try {
      const product = await Product.query()
        .where('id', params.id)
        .where('isActive', true) // Seulement les produits actifs
        .preload('category')
        .firstOrFail()

      return response.json({
        success: true,
        message: 'Product retrieved successfully',
        data: { product: product.serialize() },
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: 'Product not found or not available',
        errors: [error.message],
      })
    }
  }
}

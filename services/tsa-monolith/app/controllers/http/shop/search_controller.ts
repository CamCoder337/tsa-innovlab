import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Category from '#models/category'

/**
 * Contrôleur pour la recherche dans la boutique
 * Accessible sans authentification
 */
export default class SearchController {
  /**
   * Recherche globale dans les produits et catégories
   * GET /api/shop/search
   */
  async index({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '').trim()
      const type = request.input('type', 'all') // 'all', 'products', 'categories'
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      if (!query || query.length < 2) {
        return response.badRequest({
          success: false,
          message: 'Search query must be at least 2 characters long',
        })
      }

      const results: any = {
        query,
        products: [],
        categories: [],
      }

      // Recherche dans les produits
      if (type === 'all' || type === 'products') {
        const productsQuery = Product.query()
          .where('isActive', true)
          .where((q) => {
            q.whereILike('name', `%${query}%`)
              .orWhereILike('description', `%${query}%`)
              .orWhereILike('sku', `%${query}%`)
          })
          .preload('category')
          .orderBy('name', 'asc')

        if (type === 'products') {
          results.products = await productsQuery.paginate(page, limit)
        } else {
          results.products = await productsQuery.limit(10)
        }
      }

      // Recherche dans les catégories
      if (type === 'all' || type === 'categories') {
        const categoriesQuery = Category.query()
          .where('isActive', true)
          .where((q) => {
            q.whereILike('name', `%${query}%`).orWhereILike('description', `%${query}%`)
          })
          .orderBy('name', 'asc')

        if (type === 'categories') {
          results.categories = await categoriesQuery.paginate(page, limit)
        } else {
          results.categories = await categoriesQuery.limit(10)
        }
      }

      return response.ok({
        success: true,
        message: 'Search completed successfully',
        data: results,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Search failed',
        error: error.message,
      })
    }
  }
}

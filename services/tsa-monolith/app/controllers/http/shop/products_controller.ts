import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'

/**
 * Contrôleur pour le catalogue de produits public (boutique)
 * Accessible sans authentification
 */
export default class ProductsController {
  /**
   * Liste les produits actifs du catalogue
   * GET /api/shop/products
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const categoryId = request.input('categoryId')
      const search = request.input('search')
      const sortBy = request.input('sortBy', 'createdAt')
      const sortOrder = request.input('sortOrder', 'desc')
      const minPrice = request.input('minPrice')
      const maxPrice = request.input('maxPrice')
      const inStock = request.input('inStock', false) // Filtrer uniquement les produits en stock

      const query = Product.query()
        .where('isActive', true) // Seulement les produits actifs
        .preload('category')

      // Filtre par catégorie
      if (categoryId) {
        query.where('categoryId', categoryId)
      }

      // Recherche par nom ou description
      if (search) {
        query.where((q) => {
          q.whereILike('name', `%${search}%`).orWhereILike('description', `%${search}%`)
        })
      }

      // Filtre par prix
      if (minPrice) {
        query.where('price', '>=', minPrice)
      }
      if (maxPrice) {
        query.where('price', '<=', maxPrice)
      }

      // Filtrer les produits en stock
      if (inStock === 'true' || inStock === true) {
        query.where('stock', '>', 0)
      }

      // Tri
      const validSortColumns = ['name', 'price', 'stock', 'createdAt']
      if (validSortColumns.includes(sortBy)) {
        query.orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc')
      }

      const products = await query.paginate(page, limit)

      return response.ok({
        success: true,
        message: 'Products retrieved successfully',
        data: products,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to retrieve products',
        error: error.message,
      })
    }
  }

  /**
   * Affiche les détails d'un produit
   * GET /api/shop/products/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const product = await Product.query()
        .where('id', params.id)
        .where('isActive', true)
        .preload('category')
        .firstOrFail()

      return response.ok({
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      })
    } catch (error: any) {
      return response.notFound({
        success: false,
        message: 'Product not found or inactive',
      })
    }
  }
}

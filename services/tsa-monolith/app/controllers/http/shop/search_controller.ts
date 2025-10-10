import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Category from '#models/category'
import vine from '@vinejs/vine'

export default class SearchController {
  /**
   * Recherche multi-critères dans le catalogue
   */
  async index({ request, response }: HttpContext) {
    try {
      const searchSchema = vine.compile(
        vine.object({
          q: vine.string().minLength(1).optional(),
          categoryId: vine.string().uuid().optional(),
          minPrice: vine.number().min(0).optional(),
          maxPrice: vine.number().min(0).optional(),
          inStock: vine.boolean().optional(),
          page: vine.number().min(1).optional(),
          limit: vine.number().min(1).max(100).optional(),
        })
      )

      const filters = await request.validateUsing(searchSchema)

      const {
        q: searchQuery,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        page = 1,
        limit = 20,
      } = filters

      const productsQuery = Product.query()
        .where('isActive', true)
        .preload('category')

      // Recherche textuelle
      if (searchQuery) {
        productsQuery.where((builder) => {
          builder
            .whereILike('name', `%${searchQuery}%`)
            .orWhereILike('description', `%${searchQuery}%`)
            .orWhereILike('reference', `%${searchQuery}%`)
        })
      }

      // Filtre par catégorie
      if (categoryId) {
        productsQuery.where('categoryId', categoryId)
      }

      // Filtre par prix
      if (minPrice !== undefined) {
        productsQuery.where('price', '>=', minPrice)
      }
      if (maxPrice !== undefined) {
        productsQuery.where('price', '<=', maxPrice)
      }

      // Filtre par stock
      if (inStock) {
        productsQuery.where('stock', '>', 0)
      }

      // Pagination
      const products = await productsQuery.paginate(page, limit)

      // Recherche des catégories correspondantes (si recherche textuelle)
      let matchingCategories: any[] = []
      if (searchQuery) {
        matchingCategories = await Category.query()
          .where('isActive', true)
          .where((builder) => {
            builder
              .whereILike('name', `%${searchQuery}%`)
              .orWhereILike('description', `%${searchQuery}%`)
          })
          .limit(5)
      }

      return response.json({
        success: true,
        message: 'Search results retrieved successfully',
        data: {
          products: products.serialize(),
          categories: matchingCategories.map((cat) => cat.serialize()),
          pagination: {
            currentPage: products.currentPage,
            perPage: products.perPage,
            total: products.total,
            lastPage: products.lastPage,
            hasNext: products.currentPage < products.lastPage,
            hasPrev: products.currentPage > 1,
          },
          query: {
            searchQuery,
            categoryId,
            minPrice,
            maxPrice,
            inStock,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to perform search',
        errors: [error.message],
      })
    }
  }
}

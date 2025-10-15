import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'

/**
 * Contrôleur pour les catégories de la boutique publique
 * Accessible sans authentification
 */
export default class CategoriesController {
  /**
   * Liste toutes les catégories actives
   * GET /api/shop/categories
   */
  async index({ response }: HttpContext) {
    try {
      const categories = await Category.query()
        .where('isActive', true)
        .orderBy('name', 'asc')

      // Optionnel : Regrouper par parent pour créer une hiérarchie
      const tree = this.buildCategoryTree(categories)

      return response.ok({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories,
          tree,
        },
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to retrieve categories',
        error: error.message,
      })
    }
  }

  /**
   * Construit un arbre hiérarchique des catégories
   */
  private buildCategoryTree(categories: Category[]): any[] {
    const categoryMap = new Map()
    const tree: any[] = []

    // Créer une map de toutes les catégories
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat.toJSON(), children: [] })
    })

    // Construire l'arbre
    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id)
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          parent.children.push(node)
        } else {
          tree.push(node)
        }
      } else {
        tree.push(node)
      }
    })

    return tree
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'

export default class CategoriesController {
  /**
   * Liste publique des catégories actives avec arbre hiérarchique
   */
  async index({ response }: HttpContext) {
    try {
      // Récupérer toutes les catégories actives
      const categories = await Category.query()
        .where('isActive', true)
        .orderBy('displayOrder', 'asc')
        .orderBy('name', 'asc')

      // Organiser en arbre hiérarchique
      const categoriesMap = new Map()
      const rootCategories: any[] = []

      // Première passe : créer la map et identifier les racines
      categories.forEach((category) => {
        const categoryData = {
          ...category.serialize(),
          children: [],
        }
        categoriesMap.set(category.id, categoryData)

        if (!category.parentId) {
          rootCategories.push(categoryData)
        }
      })

      // Deuxième passe : construire la hiérarchie
      categories.forEach((category) => {
        if (category.parentId) {
          const parent = categoriesMap.get(category.parentId)
          if (parent) {
            parent.children.push(categoriesMap.get(category.id))
          }
        }
      })

      return response.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: { categories: rootCategories },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        errors: [error.message],
      })
    }
  }
}

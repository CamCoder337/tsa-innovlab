import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import AuditLog from '#models/audit_log'
import {
  categoriesListValidator,
  createCategoryValidator,
  updateCategoryValidator,
} from '#validators/category_validator'

export default class CategoriesController {
  /**
   * Liste paginée des catégories avec filtres et recherche
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      auth.getUserOrFail()
      const filters = await request.validateUsing(categoriesListValidator)

      const {
        page = 1,
        limit = 20,
        search,
        isActive,
        parentId,
        sortBy = 'displayOrder',
        sortOrder = 'asc',
      } = filters

      const query = Category.query()

      // Recherche par nom ou description
      if (search) {
        query.where((builder) => {
          builder
            .whereILike('name', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
            .orWhereILike('slug', `%${search}%`)
        })
      }

      // Filtre par statut actif
      if (typeof isActive === 'boolean') {
        query.where('isActive', isActive)
      }

      // Filtre par catégorie parent
      if (parentId === null) {
        query.whereNull('parentId')
      } else if (parentId) {
        query.where('parentId', parentId)
      }

      // Tri
      if (sortBy === 'name') {
        query.orderBy('name', sortOrder)
      } else if (sortBy === 'displayOrder') {
        query.orderBy('displayOrder', sortOrder).orderBy('name', 'asc')
      } else {
        query.orderBy(sortBy, sortOrder)
      }

      // Pagination avec préchargement des relations
      const categories = await query
        .preload('products', (productsQuery) => {
          productsQuery.select('id', 'name', 'categoryId').where('isActive', true).limit(5)
        })
        .paginate(page, limit)

      return response.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories: categories.serialize(),
          pagination: {
            currentPage: categories.currentPage,
            perPage: categories.perPage,
            total: categories.total,
            lastPage: categories.lastPage,
            hasNext: categories.currentPage < categories.lastPage,
            hasPrev: categories.currentPage > 1,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        errors: [error.message],
      })
    }
  }

  /**
   * Afficher une catégorie spécifique avec ses produits
   */
  async show({ params, response }: HttpContext) {
    try {
      const category = await Category.findOrFail(params.id)

      // Charger les relations
      await category.load('products', (productsQuery) => {
        productsQuery.where('isActive', true).orderBy('name', 'asc')
      })

      // Compter les produits par statut
      const productStats = {
        total: await category.related('products').query().count('* as total'),
        active: await category
          .related('products')
          .query()
          .where('isActive', true)
          .count('* as total'),
        lowStock: await category
          .related('products')
          .query()
          .whereRaw('stock <= stock_alert')
          .where('isActive', true)
          .count('* as total'),
      }

      return response.json({
        success: true,
        message: 'Category retrieved successfully',
        data: {
          category: category.serialize(),
          stats: {
            products: {
              total: Number(productStats.total[0].$extras.total),
              active: Number(productStats.active[0].$extras.total),
              lowStock: Number(productStats.lowStock[0].$extras.total),
            },
          },
        },
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: 'Category not found',
        errors: [error.message],
      })
    }
  }

  /**
   * Créer une nouvelle catégorie
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(createCategoryValidator)

      // Vérifier l'unicité du nom
      const existingCategory = await Category.findBy('name', data.name)
      if (existingCategory) {
        return response.status(422).json({
          success: false,
          message: 'Category name already exists',
          errors: ['A category with this name already exists'],
        })
      }

      // Vérifier l'unicité du slug si fourni
      if (data.slug) {
        const existingSlug = await Category.findBy('slug', data.slug)
        if (existingSlug) {
          return response.status(422).json({
            success: false,
            message: 'Category slug already exists',
            errors: ['A category with this slug already exists'],
          })
        }
      }

      // Vérifier que le parent existe si spécifié
      if (data.parentId) {
        const parentCategory = await Category.find(data.parentId)
        if (!parentCategory) {
          return response.status(422).json({
            success: false,
            message: 'Parent category not found',
            errors: ['The specified parent category does not exist'],
          })
        }
      }

      const categoryData = {
        ...data,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      }

      // Remove null slug if present
      if (categoryData.slug === null) {
        delete categoryData.slug
      }

      const category = await Category.create(categoryData as any)

      // Log de l'audit
      await AuditLog.create({
        action: 'category.create',
        entityType: 'categories',
        entityId: category.id,
        userId: user.id,
        newValues: category.serialize(),
      })

      return response.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category: category.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to create category',
        errors: [error.message],
      })
    }
  }

  /**
   * Mettre à jour une catégorie existante
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const category = await Category.findOrFail(params.id)
      const data = await request.validateUsing(updateCategoryValidator)

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = category.serialize()

      // Vérifier l'unicité du nom si modifié
      if (data.name && data.name !== category.name) {
        const existingCategory = await Category.findBy('name', data.name)
        if (existingCategory) {
          return response.status(422).json({
            success: false,
            message: 'Category name already exists',
            errors: ['A category with this name already exists'],
          })
        }
      }

      // Vérifier l'unicité du slug si modifié
      if (data.slug && data.slug !== category.slug) {
        const existingSlug = await Category.findBy('slug', data.slug)
        if (existingSlug) {
          return response.status(422).json({
            success: false,
            message: 'Category slug already exists',
            errors: ['A category with this slug already exists'],
          })
        }
      }

      // Vérifier que le parent existe si spécifié
      if (data.parentId) {
        const parentCategory = await Category.find(data.parentId)
        if (!parentCategory) {
          return response.status(422).json({
            success: false,
            message: 'Parent category not found',
            errors: ['The specified parent category does not exist'],
          })
        }

        // Empêcher l'auto-référencement et les références circulaires
        if (data.parentId === category.id) {
          return response.status(422).json({
            success: false,
            message: 'Invalid parent category',
            errors: ['A category cannot be its own parent'],
          })
        }
      }

      // Mettre à jour la catégorie
      const updateData = { ...data }

      // Remove null slug if present
      if (updateData.slug === null) {
        delete updateData.slug
      }

      category.merge(updateData as any)
      await category.save()

      // Log de l'audit
      await AuditLog.create({
        action: 'category.update',
        entityType: 'categories',
        entityId: category.id,
        userId: user.id,
        oldValues,
        newValues: category.serialize(),
      })

      return response.json({
        success: true,
        message: 'Category updated successfully',
        data: { category: category.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to update category',
        errors: [error.message],
      })
    }
  }

  /**
   * Supprimer une catégorie
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const category = await Category.findOrFail(params.id)

      // Vérifier s'il y a des produits associés
      const productsCount = await category.related('products').query().count('* as total')
      const totalProducts = Number(productsCount[0].$extras.total)

      if (totalProducts > 0) {
        return response.status(422).json({
          success: false,
          message: 'Cannot delete category with associated products',
          errors: [
            `This category has ${totalProducts} associated product(s). Please reassign or delete them first.`,
          ],
        })
      }

      // Vérifier s'il y a des sous-catégories
      const childrenCount = await Category.query()
        .where('parentId', category.id)
        .count('* as total')
      const totalChildren = Number(childrenCount[0].$extras.total)

      if (totalChildren > 0) {
        return response.status(422).json({
          success: false,
          message: 'Cannot delete category with subcategories',
          errors: [
            `This category has ${totalChildren} subcategorie(s). Please reassign or delete them first.`,
          ],
        })
      }

      // Sauvegarder les données pour l'audit
      const oldValues = category.serialize()

      // Supprimer la catégorie
      await category.delete()

      // Log de l'audit
      await AuditLog.create({
        action: 'category.delete',
        entityType: 'categories',
        entityId: params.id,
        userId: user.id,
        oldValues,
      })

      return response.json({
        success: true,
        message: 'Category deleted successfully',
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to delete category',
        errors: [error.message],
      })
    }
  }

  /**
   * Récupérer l'arbre des catégories (hiérarchique)
   */
  async tree({ response }: HttpContext) {
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
        message: 'Category tree retrieved successfully',
        data: { categories: rootCategories },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve category tree',
        errors: [error.message],
      })
    }
  }
}

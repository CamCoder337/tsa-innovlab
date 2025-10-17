import type { HttpContext } from '@adonisjs/core/http'
import User, { UserRole, UserStatus } from '#models/user'
import Mission from '#models/mission'
import Proposition from '#models/proposition'
import Order from '#models/order'
import AuditLog from '#models/audit_log'
import { listUsersValidator, updateUserStatusValidator } from '#validators/user_validator'

/**
 * Contrôleur pour la gestion des utilisateurs (admin seulement)
 */
export default class UsersController {
  /**
   * Liste paginée des utilisateurs avec filtres et recherche
   * GET /api/admin/users
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      auth.getUserOrFail()
      const filters = await request.validateUsing(listUsersValidator)

      const { page = 1, limit = 20, role, status, search } = filters

      const query = User.query()

      // Recherche par email, nom, prénom ou téléphone
      if (search) {
        query.where((builder) => {
          builder
            .whereILike('email', `%${search}%`)
            .orWhereILike('first_name', `%${search}%`)
            .orWhereILike('last_name', `%${search}%`)
            .orWhereILike('phone', `%${search}%`)
        })
      }

      // Filtre par rôle
      if (role) {
        query.where('role', role)
      }

      // Filtre par statut
      if (status) {
        query.where('status', status)
      }

      // Tri par date de création (les plus récents d'abord)
      query.orderBy('created_at', 'desc')

      // Pagination
      const users = await query.paginate(page, limit)

      // Sérialiser les données (masquer les champs sensibles)
      const serializedUsers = users.serialize()

      return response.json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: serializedUsers.data,
          pagination: {
            currentPage: serializedUsers.meta.currentPage,
            perPage: serializedUsers.meta.perPage,
            total: serializedUsers.meta.total,
            lastPage: serializedUsers.meta.lastPage,
            hasNext: serializedUsers.meta.currentPage < serializedUsers.meta.lastPage,
            hasPrev: serializedUsers.meta.currentPage > 1,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        errors: [error.message],
      })
    }
  }

  /**
   * Afficher les détails complets d'un utilisateur
   * GET /api/admin/users/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)

      // Charger les statistiques selon le rôle
      let stats: any = {
        totalOrders: 0,
        totalMissions: 0,
        totalPropositions: 0,
      }

      switch (user.role) {
        case UserRole.CLIENT:
          // Statistiques pour les clients
          const orders = await Order.query().where('user_id', user.id)
          stats.totalOrders = orders.length
          stats.totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
          stats.pendingOrders = orders.filter((o) => o.status === 'pending').length
          stats.completedOrders = orders.filter((o) => o.status === 'delivered').length
          break

        case UserRole.AFFRETEUR:
          // Statistiques pour les affréteurs
          const missions = await Mission.query().where('affreteur_id', user.id)
          stats.totalMissions = missions.length
          stats.publishedMissions = missions.filter((m) => m.status === 'published').length
          stats.completedMissions = missions.filter((m) => m.status === 'completed').length
          break

        case UserRole.TRANSPORTEUR:
          // Statistiques pour les transporteurs
          const propositions = await Proposition.query().where('transporteur_id', user.id)
          stats.totalPropositions = propositions.length
          stats.acceptedPropositions = propositions.filter((p) => p.status === 'accepted').length
          stats.pendingPropositions = propositions.filter((p) => p.status === 'pending').length
          break

        case UserRole.ADMIN:
          // Statistiques pour les administrateurs
          const auditLogs = await AuditLog.query().where('user_id', user.id)
          stats.totalActions = auditLogs.length
          break
      }

      return response.json({
        success: true,
        message: 'User details retrieved successfully',
        data: {
          user: user.serialize(),
          stats,
        },
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
        errors: [error.message],
      })
    }
  }

  /**
   * Suspendre/bloquer un utilisateur
   * POST /api/admin/users/:id/suspend
   */
  async suspend({ params, request, response, auth }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const user = await User.findOrFail(params.id)

      // Empêcher un admin de se bloquer lui-même
      if (admin.id === user.id) {
        return response.status(400).json({
          success: false,
          message: 'You cannot suspend your own account',
          errors: ['Self-suspension is not allowed'],
        })
      }

      const data = await request.validateUsing(updateUserStatusValidator)

      // Vérifier que le statut demandé est bien SUSPENDED
      if (data.status !== UserStatus.SUSPENDED) {
        return response.status(422).json({
          success: false,
          message: 'Invalid status',
          errors: ['Use this endpoint to suspend users only'],
        })
      }

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = user.serialize()

      // Mettre à jour le statut
      user.status = UserStatus.SUSPENDED
      await user.save()

      // Log de l'audit
      await AuditLog.create({
        action: 'user.suspend',
        entityType: 'users',
        entityId: user.id,
        userId: admin.id,
        oldValues,
        newValues: {
          ...user.serialize(),
          suspendReason: data.reason || null,
        },
      })

      return response.json({
        success: true,
        message: 'User suspended successfully',
        data: {
          user: user.serialize(),
        },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to suspend user',
        errors: [error.message],
      })
    }
  }

  /**
   * Activer/débloquer un utilisateur
   * POST /api/admin/users/:id/activate
   */
  async activate({ params, request, response, auth }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const user = await User.findOrFail(params.id)

      const data = await request.validateUsing(updateUserStatusValidator)

      // Vérifier que le statut demandé est bien ACTIVE
      if (data.status !== UserStatus.ACTIVE) {
        return response.status(422).json({
          success: false,
          message: 'Invalid status',
          errors: ['Use this endpoint to activate users only'],
        })
      }

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = user.serialize()

      // Mettre à jour le statut et réinitialiser les tentatives échouées
      user.status = UserStatus.ACTIVE
      await user.resetFailedAttempts()

      // Log de l'audit
      await AuditLog.create({
        action: 'user.activate',
        entityType: 'users',
        entityId: user.id,
        userId: admin.id,
        oldValues,
        newValues: {
          ...user.serialize(),
          activationReason: data.reason || null,
        },
      })

      return response.json({
        success: true,
        message: 'User activated successfully',
        data: {
          user: user.serialize(),
        },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to activate user',
        errors: [error.message],
      })
    }
  }

  /**
   * Statistiques globales des utilisateurs
   * GET /api/admin/users/stats
   */
  async stats({ response }: HttpContext) {
    try {
      // Statistiques par rôle
      const totalUsers = await User.query().count('* as total')
      const adminUsers = await User.query().where('role', UserRole.ADMIN).count('* as total')
      const transporteurUsers = await User.query()
        .where('role', UserRole.TRANSPORTEUR)
        .count('* as total')
      const affreteurUsers = await User.query()
        .where('role', UserRole.AFFRETEUR)
        .count('* as total')
      const clientUsers = await User.query().where('role', UserRole.CLIENT).count('* as total')

      // Statistiques par statut
      const activeUsers = await User.query().where('status', UserStatus.ACTIVE).count('* as total')
      const suspendedUsers = await User.query()
        .where('status', UserStatus.SUSPENDED)
        .count('* as total')
      const pendingUsers = await User.query()
        .where('status', UserStatus.PENDING)
        .count('* as total')

      // Utilisateurs avec MFA activé
      const mfaEnabledUsers = await User.query().where('mfa_enabled', true).count('* as total')

      const stats = {
        total: Number(totalUsers[0].$extras.total),
        byRole: {
          admin: Number(adminUsers[0].$extras.total),
          transporteur: Number(transporteurUsers[0].$extras.total),
          affreteur: Number(affreteurUsers[0].$extras.total),
          client: Number(clientUsers[0].$extras.total),
        },
        byStatus: {
          active: Number(activeUsers[0].$extras.total),
          suspended: Number(suspendedUsers[0].$extras.total),
          pending: Number(pendingUsers[0].$extras.total),
        },
        security: {
          mfaEnabled: Number(mfaEnabledUsers[0].$extras.total),
        },
      }

      return response.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: { stats },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics',
        errors: [error.message],
      })
    }
  }

  /**
   * Stub pour update et destroy (non demandés)
   */
  async update({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'User update not implemented yet',
      data: null,
    })
  }

  async destroy({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'User deletion not implemented yet',
      data: null,
    })
  }
}

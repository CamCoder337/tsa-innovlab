import type { HttpContext } from '@adonisjs/core/http'
import AdminStatsService from '#services/admin_stats_service'

/**
 * Contrôleur pour les statistiques administrateur
 */
export default class StatsController {
  private adminStatsService: AdminStatsService

  constructor() {
    this.adminStatsService = new AdminStatsService()
  }

  /**
   * Récupère les statistiques globales du dashboard admin
   * GET /api/admin/stats/overview
   *
   * Retourne :
   * - Chiffre d'affaires total et par période (aujourd'hui, 7j, 30j)
   * - Évolution du CA jour par jour
   * - Nombre de commandes total, par statut et par période
   * - Taux de conversion (commandes payées / total)
   * - Panier moyen
   * - Top 10 des produits les plus vendus
   * - Stats rapides (users, produits, missions)
   */
  async overview({ response }: HttpContext) {
    try {
      const stats = await this.adminStatsService.getOverviewStats()

      return response.ok({
        success: true,
        message: 'Overview statistics retrieved successfully',
        data: stats,
      })
    } catch (error: any) {
      console.error('Error retrieving overview statistics:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to retrieve overview statistics',
        error: error.message,
      })
    }
  }

  /**
   * Statistiques des utilisateurs
   * GET /api/admin/stats/users
   *
   * Retourne :
   * - Compteurs par rôle (admin, transporteur, affreteur, client)
   * - Évolution des inscriptions par période
   * - Utilisateurs actifs/inactifs
   * - Taux de vérification email
   * - Taux d'activation MFA
   * - Graphique d'évolution
   */
  async users({ response }: HttpContext) {
    try {
      const stats = await this.adminStatsService.getUserStats()

      return response.ok({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats,
      })
    } catch (error: any) {
      console.error('Error retrieving user statistics:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to retrieve user statistics',
        error: error.message,
      })
    }
  }

  /**
   * Statistiques des missions
   * GET /api/admin/stats/missions
   *
   * Retourne :
   * - Compteurs par statut (draft, published, assigned, completed, cancelled)
   * - Budget total et moyen des missions
   * - Taux de complétion
   * - Distribution par affreteur et transporteur
   * - Évolution temporelle
   * - Top 5 affreteurs et transporteurs
   */
  async missions({ response }: HttpContext) {
    try {
      const stats = await this.adminStatsService.getMissionStats()

      return response.ok({
        success: true,
        message: 'Mission statistics retrieved successfully',
        data: stats,
      })
    } catch (error: any) {
      console.error('Error retrieving mission statistics:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to retrieve mission statistics',
        error: error.message,
      })
    }
  }

  /**
   * Statistiques des produits
   * GET /api/admin/stats/products
   *
   * Retourne :
   * - Compteurs par catégorie
   * - Stock total et valeur du stock
   * - Produits actifs vs inactifs
   * - Alertes stock faible (< seuil minimum)
   * - Évolution du catalogue
   */
  async products({ response }: HttpContext) {
    try {
      const stats = await this.adminStatsService.getProductStats()

      return response.ok({
        success: true,
        message: 'Product statistics retrieved successfully',
        data: stats,
      })
    } catch (error: any) {
      console.error('Error retrieving product statistics:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to retrieve product statistics',
        error: error.message,
      })
    }
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import Feedback from '#models/feedback'
import db from '@adonisjs/lucid/services/db'

/**
 * Contrôleur pour la gestion des feedbacks par les administrateurs
 * Permet de voir tous les feedbacks de la plateforme
 */
export default class FeedbacksController {
  /**
   * Liste tous les feedbacks avec filtres
   * GET /api/admin/feedbacks
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const rating = request.input('rating') // Filtrer par note (1-5)
      const transporteurId = request.input('transporteurId') // Filtrer par transporteur
      const affreteurId = request.input('affreteurId') // Filtrer par affreteur
      const missionId = request.input('missionId') // Filtrer par mission
      const sortBy = request.input('sortBy', 'createdAt')
      const sortOrder = request.input('sortOrder', 'desc')

      const query = Feedback.query()
        .preload('mission', (missionQuery) => {
          missionQuery.select('id', 'title')
        })
        .preload('transporteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email')
        })
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email')
        })

      // Filtres
      if (rating) {
        query.where('rating', Number(rating))
      }

      if (transporteurId) {
        query.where('transporteurId', transporteurId)
      }

      if (affreteurId) {
        query.where('affreteurId', affreteurId)
      }

      if (missionId) {
        query.where('missionId', missionId)
      }

      // Tri
      const validSortColumns = ['rating', 'createdAt']
      if (validSortColumns.includes(sortBy)) {
        query.orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc')
      }

      const feedbacks = await query.paginate(page, limit)

      return response.ok({
        success: true,
        message: 'Feedbacks retrieved successfully',
        data: feedbacks,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to retrieve feedbacks',
        error: error.message,
      })
    }
  }

  /**
   * Affiche les détails d'un feedback spécifique
   * GET /api/admin/feedbacks/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const feedback = await Feedback.query()
        .where('id', params.id)
        .preload('mission', (missionQuery) => {
          missionQuery
            .select('id', 'title', 'status')
            .preload('adresseDepart')
            .preload('adresseArrivee')
        })
        .preload('transporteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'phone')
        })
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'phone')
        })
        .firstOrFail()

      return response.ok({
        success: true,
        message: 'Feedback retrieved successfully',
        data: feedback,
      })
    } catch (error: any) {
      return response.notFound({
        success: false,
        message: 'Feedback not found',
      })
    }
  }

  /**
   * Statistiques des feedbacks
   * GET /api/admin/feedbacks/stats
   *
   * Retourne :
   * - Nombre total de feedbacks
   * - Moyenne globale des notes
   * - Distribution des notes (1-5)
   * - Top 10 transporteurs (meilleure moyenne)
   * - Pire 10 transporteurs (pire moyenne)
   */
  async stats({ response }: HttpContext) {
    try {
      // Récupérer tous les feedbacks
      const allFeedbacks = await Feedback.query().select('rating', 'transporteurId')

      // Total
      const total = allFeedbacks.length

      // Moyenne globale
      const averageRating =
        total > 0
          ? Math.round((allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / total) * 100) / 100
          : 0

      // Distribution des notes
      const distribution = {
        1: allFeedbacks.filter((f) => f.rating === 1).length,
        2: allFeedbacks.filter((f) => f.rating === 2).length,
        3: allFeedbacks.filter((f) => f.rating === 3).length,
        4: allFeedbacks.filter((f) => f.rating === 4).length,
        5: allFeedbacks.filter((f) => f.rating === 5).length,
      }

      // Top et pire transporteurs
      const transporteurStats = await db
        .from('feedbacks')
        .join('users', 'feedbacks.transporteur_id', 'users.id')
        .select('feedbacks.transporteur_id as transporteurId')
        .select(db.raw("CONCAT(users.first_name, ' ', users.last_name) as transporteurName"))
        .avg('feedbacks.rating as averageRating')
        .count('feedbacks.id as feedbackCount')
        .groupBy('feedbacks.transporteur_id', 'users.first_name', 'users.last_name')
        .havingRaw('COUNT(feedbacks.id) >= 1') // Au moins 1 feedback

      const sortedTransporteurs = transporteurStats
        .map((t: any) => ({
          transporteurId: t.transporteurId,
          transporteurName: t.transporteurName,
          averageRating: Math.round(Number(t.averageRating) * 100) / 100,
          feedbackCount: Number(t.feedbackCount),
        }))
        .sort((a, b) => b.averageRating - a.averageRating)

      const topTransporteurs = sortedTransporteurs.slice(0, 10)
      const worstTransporteurs = sortedTransporteurs.slice(-10).reverse()

      return response.ok({
        success: true,
        message: 'Feedback statistics retrieved successfully',
        data: {
          total,
          averageRating,
          distribution,
          topTransporteurs,
          worstTransporteurs,
        },
      })
    } catch (error: any) {
      console.error('Error retrieving feedback statistics:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to retrieve feedback statistics',
        error: error.message,
      })
    }
  }
}

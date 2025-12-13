import type { HttpContext } from '@adonisjs/core/http'
import MissionIssue, { IssueStatus, IssuePriority } from '#models/mission_issue'
import { DateTime } from 'luxon'
import emitter from '@adonisjs/core/services/emitter'
import db from '@adonisjs/lucid/services/db'

/**
 * Controller pour la gestion des urgences SOS (Admin)
 */
export default class EmergenciesController {
  /**
   * Liste toutes les urgences actives
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status') // 'active' | 'all' | specific status
    const priority = request.input('priority') // 1, 2, 3

    let query = MissionIssue.query()
      .where('is_emergency', true)
      .preload('mission', (missionQuery) => {
        missionQuery.preload('affreteur')
        missionQuery.preload('transporteur')
      })
      .preload('reportedBy')
      .preload('handledBy')
      .orderBy('priority', 'asc') // Critical first
      .orderBy('created_at', 'desc')

    // Filtrer par statut
    if (status === 'active') {
      query = query.whereIn('status', [
        IssueStatus.REPORTED,
        IssueStatus.ACKNOWLEDGED,
        IssueStatus.IN_PROGRESS,
      ])
    } else if (status && status !== 'all') {
      query = query.where('status', status)
    }

    // Filtrer par priorité
    if (priority) {
      query = query.where('priority', priority)
    }

    const emergencies = await query.paginate(page, limit)

    return response.ok({
      success: true,
      data: emergencies.serialize(),
    })
  }

  /**
   * Statistiques des urgences
   */
  async stats({ response }: HttpContext) {
    const [totalActive, criticalCount, highCount, resolvedToday, avgResponseTime] =
      await Promise.all([
        // Urgences actives
        MissionIssue.query()
          .where('is_emergency', true)
          .whereIn('status', [
            IssueStatus.REPORTED,
            IssueStatus.ACKNOWLEDGED,
            IssueStatus.IN_PROGRESS,
          ])
          .count('* as count')
          .first(),

        // Urgences critiques
        MissionIssue.query()
          .where('is_emergency', true)
          .where('priority', IssuePriority.CRITICAL)
          .whereIn('status', [
            IssueStatus.REPORTED,
            IssueStatus.ACKNOWLEDGED,
            IssueStatus.IN_PROGRESS,
          ])
          .count('* as count')
          .first(),

        // Urgences haute priorité
        MissionIssue.query()
          .where('is_emergency', true)
          .where('priority', IssuePriority.HIGH)
          .whereIn('status', [
            IssueStatus.REPORTED,
            IssueStatus.ACKNOWLEDGED,
            IssueStatus.IN_PROGRESS,
          ])
          .count('* as count')
          .first(),

        // Résolues aujourd'hui
        MissionIssue.query()
          .where('is_emergency', true)
          .where('status', IssueStatus.RESOLVED)
          .where('resolved_at', '>=', DateTime.now().startOf('day').toSQL())
          .count('* as count')
          .first(),

        // Temps de réponse moyen (en minutes)
        db
          .from('mission_issues')
          .where('is_emergency', true)
          .whereNotNull('first_response_at')
          .select(
            db.raw('AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60) as avg_minutes')
          )
          .first(),
      ])

    return response.ok({
      success: true,
      data: {
        active: Number(totalActive?.$extras.count || 0),
        critical: Number(criticalCount?.$extras.count || 0),
        high: Number(highCount?.$extras.count || 0),
        resolvedToday: Number(resolvedToday?.$extras.count || 0),
        avgResponseTimeMinutes: Math.round(Number(avgResponseTime?.avg_minutes || 0)),
      },
    })
  }

  /**
   * Détails d'une urgence
   */
  async show({ params, response }: HttpContext) {
    // Valider que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return response.notFound({
        success: false,
        message: 'Emergency not found',
      })
    }

    const issue = await MissionIssue.query()
      .where('id', params.id)
      .where('is_emergency', true)
      .preload('mission', (missionQuery) => {
        missionQuery.preload('affreteur')
        missionQuery.preload('transporteur')
        missionQuery.preload('adresseDepart')
        missionQuery.preload('adresseArrivee')
      })
      .preload('reportedBy')
      .preload('handledBy')
      .preload('emergencyConversation')
      .first()

    if (!issue) {
      return response.notFound({
        success: false,
        message: 'Emergency not found',
      })
    }

    return response.ok({
      success: true,
      data: { emergency: issue },
    })
  }

  /**
   * Prendre en charge une urgence
   */
  async acknowledge({ params, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail()

    const issue = await MissionIssue.query()
      .where('id', params.id)
      .where('is_emergency', true)
      .preload('mission')
      .first()

    if (!issue) {
      return response.notFound({
        success: false,
        message: 'Emergency not found',
      })
    }

    if (issue.status !== IssueStatus.REPORTED) {
      return response.badRequest({
        success: false,
        message: 'Emergency already being handled',
        currentStatus: issue.status,
        handledById: issue.handledById,
      })
    }

    // Mettre à jour le statut
    issue.status = IssueStatus.ACKNOWLEDGED
    issue.handledById = admin.id
    issue.firstResponseAt = DateTime.now()
    await issue.save()

    // Émettre l'événement
    await emitter.emit('mission:sos_acknowledged', {
      issue,
      mission: issue.mission,
      handledBy: admin,
    })

    return response.ok({
      success: true,
      message: 'Emergency acknowledged',
      data: {
        issue: {
          id: issue.id,
          status: issue.status,
          handledById: issue.handledById,
          firstResponseAt: issue.firstResponseAt?.toISO(),
        },
      },
    })
  }

  /**
   * Marquer une urgence comme en cours de traitement
   */
  async markInProgress({ params, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail()

    const issue = await MissionIssue.query()
      .where('id', params.id)
      .where('is_emergency', true)
      .first()

    if (!issue) {
      return response.notFound({
        success: false,
        message: 'Emergency not found',
      })
    }

    if (issue.status === IssueStatus.RESOLVED) {
      return response.badRequest({
        success: false,
        message: 'Emergency already resolved',
      })
    }

    issue.status = IssueStatus.IN_PROGRESS
    if (!issue.handledById) {
      issue.handledById = admin.id
    }
    if (!issue.firstResponseAt) {
      issue.firstResponseAt = DateTime.now()
    }
    await issue.save()

    return response.ok({
      success: true,
      message: 'Emergency marked as in progress',
      data: { issue },
    })
  }

  /**
   * Résoudre une urgence
   */
  async resolve({ params, request, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail()
    const { resolutionNotes } = request.only(['resolutionNotes'])

    const issue = await MissionIssue.query()
      .where('id', params.id)
      .where('is_emergency', true)
      .preload('mission')
      .first()

    if (!issue) {
      return response.notFound({
        success: false,
        message: 'Emergency not found',
      })
    }

    if (issue.status === IssueStatus.RESOLVED) {
      return response.badRequest({
        success: false,
        message: 'Emergency already resolved',
      })
    }

    // Mettre à jour le statut
    issue.status = IssueStatus.RESOLVED
    issue.resolvedAt = DateTime.now()
    if (!issue.handledById) {
      issue.handledById = admin.id
    }
    if (resolutionNotes) {
      issue.description = `${issue.description}\n\n--- RÉSOLUTION ---\n${resolutionNotes}`
    }
    await issue.save()

    // Émettre l'événement
    await emitter.emit('mission:sos_resolved', {
      issue,
      mission: issue.mission,
      resolvedBy: admin,
    })

    return response.ok({
      success: true,
      message: 'Emergency resolved',
      data: {
        issue: {
          id: issue.id,
          status: issue.status,
          resolvedAt: issue.resolvedAt?.toISO(),
        },
      },
    })
  }
}

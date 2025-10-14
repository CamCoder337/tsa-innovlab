import type { HttpContext } from '@adonisjs/core/http'
import Mission, { MissionStatus } from '#models/mission'
import Proposition, { PropositionStatus } from '#models/proposition'
import {
  propositionActionValidator,
  propositionQueryValidator,
} from '#validators/proposition_validator'
import db from '@adonisjs/lucid/services/db'

export default class PropositionsController {
  async index({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const validatedData = await request.validateUsing(propositionQueryValidator)

      const {
        page = 1,
        limit = 15,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = validatedData

      // Vérifier que la mission appartient à l'affreteur
      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteurId', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or access denied',
        })
      }

      const query = Proposition.query()
        .where('missionId', params.id)
        .preload('transporteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'phone', 'email')
        })

      // Filtrer par statut de proposition
      if (status) {
        query.where('status', status)
      }

      // Recherche dans les commentaires
      if (search) {
        query.where('commentaire', 'ILIKE', `%${search}%`)
      }

      // Tri
      if (sortBy === 'created_at') {
        query.orderBy('createdAt', sortOrder)
      } else if (sortBy === 'prix_propose') {
        query.orderBy('prixPropose', sortOrder)
      } else if (sortBy === 'delai_propose') {
        query.orderBy('delaiPropose', sortOrder)
      }

      const propositions = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'Propositions retrieved successfully',
        data: {
          mission: {
            id: mission.id,
            title: mission.title,
            status: mission.status,
            budgetMin: mission.budgetMin,
            budgetMax: mission.budgetMax,
          },
          propositions,
        },
      })
    } catch (error) {
      console.error('Error retrieving propositions:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve propositions',
        error: error.message,
      })
    }
  }

  async accept({ params, request, auth, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.getUserOrFail()
      const validatedData = await request.validateUsing(propositionActionValidator)

      // Vérifier que la mission appartient à l'affreteur
      const mission = await Mission.query({ client: trx })
        .where('id', params.missionId)
        .where('affreteurId', user.id)
        .where('status', MissionStatus.PUBLISHED)
        .first()

      if (!mission) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Mission not found, access denied, or mission not in PUBLISHED status',
        })
      }

      // Vérifier que la proposition existe et est en attente
      const proposition = await Proposition.query({ client: trx })
        .where('id', params.id)
        .where('missionId', params.missionId)
        .where('status', PropositionStatus.PENDING)
        .first()

      if (!proposition) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Proposition not found or not in PENDING status',
        })
      }

      // Vérifier qu'il n'y a pas déjà une proposition acceptée pour cette mission
      const existingAcceptedProposition = await Proposition.query({ client: trx })
        .where('missionId', params.missionId)
        .where('status', PropositionStatus.ACCEPTED)
        .first()

      if (existingAcceptedProposition) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'A proposition has already been accepted for this mission',
          data: { acceptedPropositionId: existingAcceptedProposition.id },
        })
      }

      // Accepter la proposition
      proposition.status = PropositionStatus.ACCEPTED
      if (validatedData.commentaire) {
        proposition.commentaire = validatedData.commentaire
      }
      proposition.useTransaction(trx)
      await proposition.save()

      // Assigner la mission au transporteur (PUBLISHED → ASSIGNED)
      mission.status = MissionStatus.ASSIGNED
      mission.useTransaction(trx)
      await mission.save()

      // Rejeter automatiquement toutes les autres propositions en attente
      await Proposition.query({ client: trx })
        .where('missionId', params.missionId)
        .where('status', PropositionStatus.PENDING)
        .whereNot('id', params.id)
        .update({ status: PropositionStatus.REJECTED })

      await trx.commit()

      // Précharger les relations pour la réponse
      await proposition.load('transporteur', (userQuery) => {
        userQuery.select('id', 'firstName', 'lastName', 'phone', 'email')
      })

      return response.json({
        success: true,
        message: 'Proposition accepted successfully and mission assigned',
        data: {
          proposition,
          mission: {
            id: mission.id,
            status: mission.status,
          },
        },
      })
    } catch (error) {
      await trx.rollback()
      console.error('Error accepting proposition:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to accept proposition',
        error: error.message,
      })
    }
  }

  async reject({ params, request, auth, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.getUserOrFail()
      const validatedData = await request.validateUsing(propositionActionValidator)

      // Vérifier que la mission appartient à l'affreteur
      const mission = await Mission.query({ client: trx })
        .where('id', params.missionId)
        .where('affreteurId', user.id)
        .first()

      if (!mission) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Mission not found or access denied',
        })
      }

      // Vérifier que la proposition existe et est en attente
      const proposition = await Proposition.query({ client: trx })
        .where('id', params.id)
        .where('missionId', params.missionId)
        .where('status', PropositionStatus.PENDING)
        .first()

      if (!proposition) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Proposition not found or not in PENDING status',
        })
      }

      // Rejeter la proposition
      proposition.status = PropositionStatus.REJECTED
      if (validatedData.commentaire) {
        proposition.commentaire = validatedData.commentaire
      }
      proposition.useTransaction(trx)
      await proposition.save()

      await trx.commit()

      // Précharger les relations pour la réponse
      await proposition.load('transporteur', (userQuery) => {
        userQuery.select('id', 'firstName', 'lastName', 'phone', 'email')
      })

      return response.json({
        success: true,
        message: 'Proposition rejected successfully',
        data: proposition,
      })
    } catch (error) {
      await trx.rollback()
      console.error('Error rejecting proposition:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to reject proposition',
        error: error.message,
      })
    }
  }
}

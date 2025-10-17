import type { HttpContext } from '@adonisjs/core/http'
import Mission, { MissionStatus } from '#models/mission'
import Proposition, { PropositionStatus } from '#models/proposition'
import {
  createPropositionValidator,
  propositionQueryValidator,
} from '#validators/proposition_validator'
import db from '@adonisjs/lucid/services/db'

export default class PropositionsController {
  async apply({ params, request, auth, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.getUserOrFail()
      const validatedData = await request.validateUsing(createPropositionValidator)

      // Vérifier que la mission existe et est disponible
      const mission = await Mission.query({ client: trx })
        .where('id', params.id)
        .where('status', MissionStatus.PUBLISHED)
        .first()

      if (!mission) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Mission not found or not available for proposals',
        })
      }

      // Vérifier qu'il n'y a pas déjà une proposition en attente de ce transporteur
      const existingProposition = await Proposition.query({ client: trx })
        .where('missionId', params.id)
        .where('transporteurId', user.id)
        .where('status', PropositionStatus.PENDING)
        .first()

      if (existingProposition) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'You already have a pending proposal for this mission',
          data: { existingPropositionId: existingProposition.id },
        })
      }

      // Créer la nouvelle proposition
      const proposition = await Proposition.create(
        {
          missionId: params.id,
          transporteurId: user.id,
          prixPropose: validatedData.prixPropose,
          delaiPropose: validatedData.delaiPropose,
          commentaire: validatedData.commentaire || null,
          status: PropositionStatus.PENDING,
        },
        { client: trx }
      )

      await trx.commit()

      // Précharger les relations pour la réponse
      await proposition.load('mission', (missionQuery) => {
        missionQuery.select('id', 'title', 'description', 'budgetMin', 'budgetMax')
      })
      await proposition.load('transporteur', (userQuery) => {
        userQuery.select('id', 'firstName', 'lastName', 'phone')
      })

      return response.status(201).json({
        success: true,
        message: 'Proposition submitted successfully',
        data: proposition,
      })
    } catch (error) {
      await trx.rollback()
      console.error('Error applying to mission:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to submit proposition',
        error: error.message,
      })
    }
  }

  async myPropositions({ request, auth, response }: HttpContext) {
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

      const query = Proposition.query()
        .where('transporteurId', user.id)
        .preload('mission', (missionQuery) => {
          missionQuery
            .select(
              'id',
              'title',
              'description',
              'budgetMin',
              'budgetMax',
              'status',
              'createdAt',
              'affreteurId',
              'adresseDepartId',
              'adresseArriveeId'
            )
            .preload('affreteur', (userQuery) => {
              userQuery.select('id', 'firstName', 'lastName', 'phone')
            })
            .preload('adresseDepart', (addressQuery) => {
              addressQuery.select('id', 'street', 'city', 'region')
            })
            .preload('adresseArrivee', (addressQuery) => {
              addressQuery.select('id', 'street', 'city', 'region')
            })
        })

      // Filtrer par statut de proposition
      if (status) {
        query.where('status', status)
      }

      // Recherche dans le titre des missions
      if (search) {
        query.whereHas('mission', (missionQuery) => {
          missionQuery.where('title', 'ILIKE', `%${search}%`)
        })
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
        data: propositions,
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
}

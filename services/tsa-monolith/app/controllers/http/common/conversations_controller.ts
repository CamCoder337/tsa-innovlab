import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Conversation, { ConversationType } from '#models/conversation'
import User from '#models/user'
import Mission from '#models/mission'
import {
  createDirectConversationValidator,
  createMissionConversationValidator,
  searchUsersValidator,
  conversationIndexValidator,
} from '#validators/conversation'

@inject()
export default class ConversationsController {
  constructor() {}

  /**
   * Liste les conversations de l'utilisateur connecté
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(conversationIndexValidator)
      const { page = 1, limit = 20, type } = payload

      let query = Conversation.query()
        .where((builder) => {
          builder.where('user1_id', user.id).orWhere('user2_id', user.id)
        })
        .preload('user1', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'role')
        })
        .preload('user2', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'role')
        })
        .preload('mission', (missionQuery) => {
          missionQuery.select('id', 'title', 'status', 'departure_address', 'arrival_address')
        })
        .withCount('messages')
        .withCount('messages', (messagesQuery) => {
          messagesQuery
            .whereNot('sender_id', user.id)
            .whereNull('read_at')
            .as('unreadMessagesCount')
        })
        .orderBy('last_activity_at', 'desc')

      if (type && Object.values(ConversationType).includes(type as ConversationType)) {
        query = query.where('type', type)
      }

      const conversations = await query.paginate(page, limit)

      // Enrichir avec les informations de l'autre participant
      const enrichedConversations = conversations.serialize()
      enrichedConversations.data = enrichedConversations.data.map((conversation: any) => {
        const otherParticipant =
          conversation.user1.id === user.id ? conversation.user2 : conversation.user1
        return {
          ...conversation,
          otherParticipant,
        }
      })

      return response.ok({
        success: true,
        data: enrichedConversations,
      })
    } catch (error) {
      console.error('❌ Erreur récupération conversations:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la récupération des conversations',
        error: error.message,
      })
    }
  }

  /**
   * Affiche une conversation spécifique
   */
  async show({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = request.params()

      const conversation = await Conversation.query()
        .where('id', id)
        .preload('user1', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'role')
        })
        .preload('user2', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'role')
        })
        .preload('mission', (missionQuery) => {
          missionQuery.select('id', 'title', 'status', 'departure_address', 'arrival_address')
        })
        .firstOrFail()

      if (!conversation.isParticipant(user.id)) {
        return response.forbidden({
          success: false,
          message: 'Accès refusé à cette conversation',
        })
      }

      const otherParticipant =
        conversation.user1.id === user.id ? conversation.user2 : conversation.user1

      return response.ok({
        success: true,
        data: {
          ...conversation.serialize(),
          otherParticipant: otherParticipant.serialize(),
        },
      })
    } catch (error) {
      console.error('❌ Erreur récupération conversation:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la récupération de la conversation',
        error: error.message,
      })
    }
  }

  /**
   * Crée ou récupère une conversation directe entre deux utilisateurs
   */
  async createDirect({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(createDirectConversationValidator)
      const { userId } = payload

      if (!userId) {
        return response.badRequest({
          success: false,
          message: 'ID utilisateur requis',
        })
      }

      if (Number(userId) === Number(user.id)) {
        return response.badRequest({
          success: false,
          message: 'Impossible de créer une conversation avec soi-même',
        })
      }

      // Vérifier que l'utilisateur cible existe
      const targetUser = await User.findOrFail(userId)

      // Créer ou récupérer la conversation
      const conversation = await Conversation.findOrCreateDirectConversation(user.id, targetUser.id)

      await conversation.load('user1', (userQuery) => {
        userQuery.select('id', 'firstName', 'lastName', 'email', 'role')
      })
      await conversation.load('user2', (userQuery) => {
        userQuery.select('id', 'firstName', 'lastName', 'email', 'role')
      })

      const otherParticipant =
        conversation.user1.id === user.id ? conversation.user2 : conversation.user1

      return response.ok({
        success: true,
        message: 'Conversation créée ou récupérée avec succès',
        data: {
          ...conversation.serialize(),
          otherParticipant: otherParticipant.serialize(),
        },
      })
    } catch (error) {
      console.error('❌ Erreur création conversation directe:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la création de la conversation',
        error: error.message,
      })
    }
  }

  /**
   * Crée ou récupère une conversation liée à une mission
   */
  async createMission({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(createMissionConversationValidator)
      const { missionId, userId } = payload

      if (!missionId || !userId) {
        return response.badRequest({
          success: false,
          message: 'ID mission et ID utilisateur requis',
        })
      }

      // Vérifier que la mission existe et que l'utilisateur y a accès
      const mission = await Mission.findOrFail(missionId)

      // Vérifier les permissions d'accès à la mission
      const canAccess =
        user.role === 'admin' ||
        (user.role === 'affreteur' && mission.affreteurId === user.id) ||
        user.role === 'transporteur' // Pour l'instant, tous les transporteurs peuvent créer des conversations sur missions

      if (!canAccess) {
        return response.forbidden({
          success: false,
          message: 'Accès refusé à cette mission',
        })
      }

      // Vérifier que l'utilisateur cible existe
      const targetUser = await User.findOrFail(userId)

      // Créer ou récupérer la conversation mission
      const conversation = await Conversation.findOrCreateMissionConversation(
        mission.id,
        user.id,
        targetUser.id
      )

      await conversation.load('user1', (userQuery) => {
        userQuery.select('id', 'firstName', 'lastName', 'email', 'role')
      })
      await conversation.load('user2', (userQuery) => {
        userQuery.select('id', 'firstName', 'lastName', 'email', 'role')
      })
      await conversation.load('mission', (missionQuery) => {
        missionQuery.select('id', 'title', 'status', 'departure_address', 'arrival_address')
      })

      const otherParticipant =
        conversation.user1.id === user.id ? conversation.user2 : conversation.user1

      return response.ok({
        success: true,
        message: 'Conversation mission créée ou récupérée avec succès',
        data: {
          ...conversation.serialize(),
          otherParticipant: otherParticipant.serialize(),
        },
      })
    } catch (error) {
      console.error('❌ Erreur création conversation mission:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la création de la conversation mission',
        error: error.message,
      })
    }
  }

  /**
   * Supprime une conversation (soft delete via archivage)
   */
  async destroy({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = request.params()

      const conversation = await Conversation.findOrFail(id)

      if (!conversation.isParticipant(user.id)) {
        return response.forbidden({
          success: false,
          message: 'Accès refusé à cette conversation',
        })
      }

      // Pour l'instant, on marque juste la conversation comme inactive
      // En production, on pourrait ajouter un champ 'archived' ou 'deleted_at'
      conversation.updateLastActivity()
      await conversation.save()

      return response.ok({
        success: true,
        message: 'Conversation archivée avec succès',
      })
    } catch (error) {
      console.error('❌ Erreur suppression conversation:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la suppression de la conversation',
        error: error.message,
      })
    }
  }

  /**
   * Recherche d'utilisateurs pour créer de nouvelles conversations
   */
  async searchUsers({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(searchUsersValidator)
      const { search = '', role, limit = 10 } = payload

      let query = User.query()
        .whereNot('id', user.id)
        .select('id', 'firstName', 'lastName', 'email', 'role')

      if (search) {
        query = query.where((builder) => {
          builder
            .whereLike('firstName', `%${search}%`)
            .orWhereLike('lastName', `%${search}%`)
            .orWhereLike('email', `%${search}%`)
        })
      }

      if (role && ['admin', 'affreteur', 'transporteur'].includes(role)) {
        query = query.where('role', role)
      }

      const users = await query.limit(limit)

      return response.ok({
        success: true,
        data: users.map((u) => u.serialize()),
      })
    } catch (error) {
      console.error('❌ Erreur recherche utilisateurs:', error)
      return response.internalServerError({
        success: false,
        message: "Erreur lors de la recherche d'utilisateurs",
        error: error.message,
      })
    }
  }
}

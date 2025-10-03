import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Message, { MessageType } from '#models/message'
import Conversation from '#models/conversation'
import TransmitService from '#services/transmit_service'
import { messageValidator } from '#validators/message'

@inject()
export default class MessagesController {
  constructor(private transmitService: TransmitService) {}

  /**
   * Liste les messages d'une conversation
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { conversationId } = request.params()
      const { page = 1, limit = 50 } = request.qs()

      // Vérifier l'accès à la conversation
      const conversation = await Conversation.findOrFail(conversationId)

      if (!conversation.isParticipant(user.id)) {
        return response.forbidden({
          success: false,
          message: 'Accès refusé à cette conversation',
        })
      }

      // Récupérer les messages avec pagination
      const messages = await Message.query()
        .where('conversation_id', conversationId)
        .preload('sender', (query) => {
          query.select('id', 'firstName', 'lastName', 'email', 'role')
        })
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      // Marquer les messages comme lus
      await Message.query()
        .where('conversation_id', conversationId)
        .whereNot('sender_id', user.id)
        .whereNull('read_at')
        .update({ read_at: new Date() })

      return response.ok({
        success: true,
        data: {
          messages: messages.serialize(),
          conversation: conversation.serialize(),
        },
      })
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la récupération des messages',
        error: error.message,
      })
    }
  }

  /**
   * Envoie un nouveau message
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { conversationId } = request.params()

      // Validation
      const payload = await request.validateUsing(messageValidator)

      // Vérifier l'accès à la conversation
      const conversation = await Conversation.findOrFail(conversationId)

      if (!conversation.isParticipant(user.id)) {
        return response.forbidden({
          success: false,
          message: 'Accès refusé à cette conversation',
        })
      }

      // Créer le message
      const message = await Message.create({
        conversationId,
        senderId: user.id,
        missionId: conversation.missionId,
        content: payload.content,
        type: (payload.type as MessageType) || MessageType.TEXT,
      })

      // Mettre à jour la conversation
      conversation.updateLastActivity()
      await conversation.save()

      // Charger les relations du message
      await message.load('sender', (query) => {
        query.select('id', 'firstName', 'lastName', 'email', 'role')
      })

      // Diffuser le message en temps réel via Transmit (conversation partagée)
      await this.transmitService.broadcastChatMessage(
        conversation.id,
        Number(user.id),
        message.serialize()
      )

      return response.created({
        success: true,
        message: 'Message envoyé avec succès',
        data: {
          message: message.serialize(),
        },
      })
    } catch (error) {
      console.error('❌ Erreur envoi message:', error)
      return response.internalServerError({
        success: false,
        message: "Erreur lors de l'envoi du message",
        error: error.message,
      })
    }
  }

  /**
   * Marque un message comme lu
   */
  async markAsRead({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = request.params()

      const message = await Message.findOrFail(id)

      // Vérifier que l'utilisateur peut marquer ce message comme lu
      // (ne peut pas marquer ses propres messages comme lus)
      if (message.senderId === user.id) {
        return response.badRequest({
          success: false,
          message: 'Impossible de marquer vos propres messages comme lus',
        })
      }

      // Vérifier l'accès à la conversation
      const conversation = await Conversation.findOrFail(message.conversationId)

      if (!conversation.isParticipant(user.id)) {
        return response.forbidden({
          success: false,
          message: 'Accès refusé à cette conversation',
        })
      }

      // Marquer comme lu
      message.markAsRead()
      await message.save()

      return response.ok({
        success: true,
        message: 'Message marqué comme lu',
        data: {
          message: message.serialize(),
        },
      })
    } catch (error) {
      console.error('❌ Erreur marquage message lu:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du marquage du message',
        error: error.message,
      })
    }
  }

  /**
   * Marque tous les messages d'une conversation comme lus
   */
  async markAllAsRead({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { conversationId } = request.params()

      // Vérifier l'accès à la conversation
      const conversation = await Conversation.findOrFail(conversationId)

      if (!conversation.isParticipant(user.id)) {
        return response.forbidden({
          success: false,
          message: 'Accès refusé à cette conversation',
        })
      }

      // Marquer tous les messages non lus de cette conversation
      const updatedCount = await Message.query()
        .where('conversation_id', conversationId)
        .whereNot('sender_id', user.id)
        .whereNull('read_at')
        .update({ read_at: new Date() })

      return response.ok({
        success: true,
        message: `${updatedCount} messages marqués comme lus`,
        data: {
          updatedCount,
        },
      })
    } catch (error) {
      console.error('❌ Erreur marquage messages lus:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du marquage des messages',
        error: error.message,
      })
    }
  }

  /**
   * Récupère le nombre de messages non lus pour l'utilisateur
   */
  async unreadCount({ response, auth }: HttpContext) {
    try {
      const user = auth.user!

      const unreadCount = await Message.query()
        .whereNot('sender_id', user.id)
        .whereNull('read_at')
        .whereHas('conversation', (query) => {
          query.where('user1_id', user.id).orWhere('user2_id', user.id)
        })
        .count('* as total')

      return response.ok({
        success: true,
        data: {
          unreadCount: Number.parseInt(unreadCount[0].$extras.total),
        },
      })
    } catch (error) {
      console.error('❌ Erreur comptage messages non lus:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du comptage des messages non lus',
        error: error.message,
      })
    }
  }
}

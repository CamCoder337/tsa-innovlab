import transmit from '@adonisjs/transmit/services/main'
import { inject } from '@adonisjs/core'
import User from '#models/user'

export interface TransmitMessage {
  type: string
  data: any
  timestamp: string
  userId?: string
}

@inject()
export default class TransmitService {
  /**
   * Vérifie si un utilisateur peut accéder à un channel privé
   */
  async canAccessChannel(user: User, channel: string): Promise<boolean> {
    // Chat de conversation partagée (nouveau système sécurisé)
    if (channel.startsWith('chat:conversation:')) {
      const conversationId = Number.parseInt(channel.split(':')[2])
      return await this.canAccessConversation(user, conversationId)
    }

    // Chat privé utilisateur (ancien système - déprécié)
    if (channel.startsWith('chat:user:')) {
      const targetUserId = channel.split(':')[2]
      return user.id.toString() === targetUserId
    }

    // Notifications utilisateur
    if (channel.startsWith('notifications:user:')) {
      const targetUserId = channel.split(':')[2]
      return user.id.toString() === targetUserId
    }

    // Tracking et chat de mission
    if (channel.startsWith('mission:')) {
      const missionId = channel.split(':')[1]
      return await this.canAccessMission(user, missionId)
    }

    // Nouvelles missions pour transporteurs
    if (channel === 'missions:new:transporteurs') {
      return user.role === 'transporteur'
    }

    // Channels publics/globaux
    if (channel === 'global') {
      return true // Accessible à tous les utilisateurs connectés
    }

    if (channel.startsWith('public:')) {
      return true // Tous les channels public:* sont accessibles
    }

    // Channel de test
    if (channel.startsWith('test:')) {
      return true // Channels de test accessibles à tous
    }

    return false
  }

  /**
   * Vérifie si un utilisateur peut accéder à une conversation
   */
  private async canAccessConversation(user: User, conversationId: number): Promise<boolean> {
    try {
      const { default: Conversation } = await import('#models/conversation')
      const conversation = await Conversation.find(conversationId)

      if (!conversation) return false

      // L'utilisateur doit être participant à la conversation
      return conversation.isParticipant(user.id)
    } catch (error) {
      console.error(`❌ Erreur vérification accès conversation ${conversationId}:`, error)
      return false
    }
  }

  /**
   * Vérifie si un utilisateur peut accéder aux informations d'une mission
   */
  private async canAccessMission(user: User, missionId: string): Promise<boolean> {
    const { default: Mission } = await import('#models/mission')
    const mission = await Mission.find(missionId)

    if (!mission) return false

    // Admin peut tout voir
    if (user.role === 'admin') return true

    // Affreteur peut voir ses missions
    if (user.role === 'affreteur' && mission.affreteurId === user.id) return true

    // Transporteur peut voir les missions qui lui sont assignées1
    // Transporteur check removed for now - no direct transporteurId field in Mission model

    return false
  }

  /**
   * Diffuse un message à un channel avec authentification
   */
  async broadcast(channel: string, message: TransmitMessage): Promise<void> {
    try {
      await transmit.broadcast(channel, {
        ...message,
        timestamp: new Date().toISOString(),
      })

      console.log(`📡 Broadcast envoyé: ${channel}`, message.type)
    } catch (error) {
      console.error(`❌ Erreur broadcast ${channel}:`, error)
      throw error
    }
  }

  /**
   * Diffuse un message chat via conversation partagée
   */
  async broadcastChatMessage(
    conversationId: number,
    senderId: number,
    message: any
  ): Promise<void> {
    const transmitMessage: TransmitMessage = {
      type: 'chat:message',
      data: {
        ...message,
        senderId,
        conversationId,
      },
      timestamp: new Date().toISOString(),
      userId: senderId.toString(),
    }

    // Broadcaster sur le channel de conversation partagé
    await this.broadcast(`chat:conversation:${conversationId}`, transmitMessage)
  }

  /**
   * Diffuse un message chat (méthode dépréciée - compatibilité)
   */
  async broadcastChatMessageLegacy(
    senderId: string,
    receiverId: string,
    message: any
  ): Promise<void> {
    const transmitMessage: TransmitMessage = {
      type: 'chat:message',
      data: message,
      timestamp: new Date().toISOString(),
      userId: senderId,
    }

    // Envoyer au destinataire
    await this.broadcast(`chat:user:${receiverId}`, transmitMessage)

    // Envoyer confirmation à l'expéditeur
    await this.broadcast(`chat:user:${senderId}`, {
      ...transmitMessage,
      type: 'chat:message:sent',
    })
  }

  /**
   * Diffuse une notification à un utilisateur
   */
  async broadcastNotification(userId: string, notification: any): Promise<void> {
    const transmitMessage: TransmitMessage = {
      type: 'notification:new',
      data: notification,
      timestamp: new Date().toISOString(),
    }

    await this.broadcast(`notifications:user:${userId}`, transmitMessage)
  }

  /**
   * Diffuse une nouvelle mission aux transporteurs
   */
  async broadcastNewMission(mission: any): Promise<void> {
    const transmitMessage: TransmitMessage = {
      type: 'mission:new',
      data: mission,
      timestamp: new Date().toISOString(),
    }

    await this.broadcast('missions:new:transporteurs', transmitMessage)
  }

  /**
   * Diffuse une mise à jour de mission (tracking)
   */
  async broadcastMissionUpdate(missionId: string, update: any): Promise<void> {
    const transmitMessage: TransmitMessage = {
      type: 'mission:update',
      data: update,
      timestamp: new Date().toISOString(),
    }

    await this.broadcast(`mission:${missionId}:tracking`, transmitMessage)
  }

  /**
   * Diffuse un message dans le chat d'une mission
   */
  async broadcastMissionChat(missionId: string, message: any): Promise<void> {
    const transmitMessage: TransmitMessage = {
      type: 'mission:chat:message',
      data: message,
      timestamp: new Date().toISOString(),
    }

    await this.broadcast(`mission:${missionId}:chat`, transmitMessage)
  }

  /**
   * Obtient la liste des utilisateurs connectés à un channel
   */
  async getChannelSubscribers(_channel: string): Promise<string[]> {
    // Cette fonctionnalité dépend de l'implémentation Transmit
    // Pour l'instant, on retourne un tableau vide
    return []
  }

  /**
   * Vérifie si Transmit est correctement configuré
   */
  isConfigured(): boolean {
    try {
      return !!transmit
    } catch (error) {
      return false
    }
  }
}

import { WebSocket } from 'ws'

/**
 * Interface pour représenter une connexion utilisateur active
 */
export interface ConnectedUser {
  userId: string
  role: string
  ws: WebSocket
  connectedAt: Date
}

/**
 * Types d'événements WebSocket
 */
export enum WebSocketEventType {
  // Événements généraux
  CONNECTED = 'connected',
  BROADCAST = 'broadcast',
  NOTIFICATION = 'notification',

  // Événements de chat
  CHAT_MESSAGE = 'chat:message',
  CHAT_MESSAGE_READ = 'chat:read',
  CHAT_TYPING_START = 'chat:typing:start',
  CHAT_TYPING_STOP = 'chat:typing:stop',
  CHAT_CONVERSATION_CREATED = 'chat:conversation:created',
  CHAT_CONVERSATION_UPDATED = 'chat:conversation:updated',

  // Événements de missions
  MISSION_NEW = 'mission:new',
  MISSION_UPDATED = 'mission:updated',
  MISSION_STATUS_CHANGED = 'mission:status:changed',

  // Événements de localisation
  LOCATION_UPDATE = 'location:update',

  // Événements SOS / Urgences
  SOS_ALERT = 'sos:alert',
  SOS_ACKNOWLEDGED = 'sos:acknowledged',
  SOS_RESOLVED = 'sos:resolved',
}

/**
 * Interface pour les messages WebSocket
 */
export interface WebSocketMessage {
  type: string | WebSocketEventType
  data: any
  timestamp: string
  userId?: string
}

/**
 * Service de gestion des connexions WebSocket (SINGLETON)
 * Gère les connexions actives, le broadcasting par rôle et par utilisateur
 */
class WebSocketService {
  /**
   * Instance singleton
   */
  private static instance: WebSocketService
  /**
   * Map pour tracker toutes les connexions actives
   * Key: userId, Value: ConnectedUser
   */
  private connections: Map<string, ConnectedUser> = new Map()

  /**
   * Constructeur privé pour pattern singleton
   */
  private constructor() {
    console.log('🔧 WebSocketService: Instance créée (singleton)')
  }

  /**
   * Obtenir l'instance unique du service
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  /**
   * Enregistrer une nouvelle connexion utilisateur
   */
  registerConnection(userId: string, role: string, ws: WebSocket): void {
    const connection: ConnectedUser = {
      userId,
      role,
      ws,
      connectedAt: new Date(),
    }

    this.connections.set(userId, connection)

    console.log(
      `✅ WebSocket: Utilisateur ${userId} (${role}) enregistré. Total connexions: ${this.connections.size}`
    )
  }

  /**
   * Désenregistrer une connexion
   */
  unregisterConnection(userId: string): void {
    const removed = this.connections.delete(userId)

    if (removed) {
      console.log(
        `❌ WebSocket: Utilisateur ${userId} déconnecté. Connexions restantes: ${this.connections.size}`
      )
    }
  }

  /**
   * Broadcaster un message à tous les transporteurs connectés
   */
  async broadcastToTransporteurs(message: object): Promise<void> {
    let count = 0

    const transporteurConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.role === 'transporteur'
    )

    console.log(
      `📡 WebSocket: Broadcasting aux transporteurs (${transporteurConnections.length} connectés)`
    )

    for (const connection of transporteurConnections) {
      try {
        if (connection.ws.readyState === WebSocket.OPEN) {
          let wsMessage: any

          // Si le message est déjà structuré avec type/data, l'envoyer tel quel
          if ((message as any).type && (message as any).data !== undefined) {
            wsMessage = {
              ...message,
              timestamp: (message as any).timestamp || new Date().toISOString(),
            }
          } else {
            // Sinon, créer la structure complète
            wsMessage = {
              type: (message as any).type || 'broadcast',
              data: message,
              timestamp: new Date().toISOString(),
            }
          }

          const messageStr = JSON.stringify(wsMessage)
          connection.ws.send(messageStr)
          console.log(`✅ WebSocket: Message envoyé à transporteur ${connection.userId}`, {
            type: wsMessage.type,
            missionId: (wsMessage.data as any)?.missionId,
            hasCoordinates:
              !!(wsMessage.data as any)?.latitude && !!(wsMessage.data as any)?.longitude,
          })
          count++
        } else {
          console.log(`⚠️  WebSocket: Connexion fermée pour transporteur ${connection.userId}`)
        }
      } catch (error) {
        console.error(
          `❌ WebSocket: Erreur envoi à transporteur ${connection.userId}:`,
          error.message
        )
      }
    }

    console.log(`✅ WebSocket: Message envoyé à ${count} transporteurs`)
  }

  /**
   * Envoyer un message à un utilisateur spécifique
   */
  async sendToUser(userId: string, message: object): Promise<void> {
    const connection = this.connections.get(userId)

    if (!connection) {
      console.log(`⚠️  WebSocket: Utilisateur ${userId} non connecté, message non envoyé`)
      return
    }

    try {
      if (connection.ws.readyState === WebSocket.OPEN) {
        let wsMessage: any

        // Si le message est déjà structuré avec type/data, l'envoyer tel quel avec userId
        if ((message as any).type && (message as any).data !== undefined) {
          wsMessage = {
            ...message,
            userId, // Ajouter userId au message existant
          }
        } else {
          // Sinon, créer la structure complète
          wsMessage = {
            type: (message as any).type || 'notification',
            data: message,
            timestamp: new Date().toISOString(),
            userId,
          }
        }

        connection.ws.send(JSON.stringify(wsMessage))
        console.log(`✅ WebSocket: Message envoyé à l'utilisateur ${userId}`)
      } else {
        console.log(
          `⚠️  WebSocket: WebSocket fermé pour utilisateur ${userId}, impossible d'envoyer`
        )
      }
    } catch (error) {
      console.error(`❌ WebSocket: Erreur envoi à utilisateur ${userId}:`, error.message)
    }
  }

  /**
   * Broadcaster à tous les utilisateurs d'une mission spécifique
   */
  async broadcastToMission(missionId: string, message: object): Promise<void> {
    // Import Mission pour éviter les dépendances circulaires
    const { default: Mission } = await import('#models/mission')

    const mission = await Mission.find(missionId)

    if (!mission) {
      console.error(`❌ WebSocket: Mission ${missionId} non trouvée`)
      return
    }

    const userIds: string[] = []

    // Affreteur propriétaire
    if (mission.affreteurId) {
      userIds.push(mission.affreteurId)
    }

    // Transporteur assigné (si existe)
    if (mission.transporteurId) {
      userIds.push(mission.transporteurId)
    }

    console.log(`📡 WebSocket: Broadcasting à la mission ${missionId} (${userIds.length} users)`)

    for (const userId of userIds) {
      await this.sendToUser(userId, message)
    }
  }

  /**
   * Obtenir le nombre d'utilisateurs connectés par rôle
   */
  getConnectionStats(): {
    total: number
    transporteurs: number
    affreteurs: number
    admins: number
  } {
    const connections = Array.from(this.connections.values())

    return {
      total: connections.length,
      transporteurs: connections.filter((c) => c.role === 'transporteur').length,
      affreteurs: connections.filter((c) => c.role === 'affreteur').length,
      admins: connections.filter((c) => c.role === 'admin').length,
    }
  }

  /**
   * Vérifier si un utilisateur est connecté
   */
  isUserConnected(userId: string): boolean {
    return this.connections.has(userId)
  }

  /**
   * Obtenir toutes les connexions actives (pour debug)
   */
  getActiveConnections(): ConnectedUser[] {
    return Array.from(this.connections.values())
  }

  /**
   * Broadcaster à tous les affreteurs connectés
   */
  async broadcastToAffreteurs(message: object): Promise<void> {
    let count = 0

    const affreteurConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.role === 'affreteur'
    )

    console.log(
      `📡 WebSocket: Broadcasting aux affreteurs (${affreteurConnections.length} connectés)`
    )

    for (const connection of affreteurConnections) {
      try {
        if (connection.ws.readyState === WebSocket.OPEN) {
          let wsMessage: any

          // Si le message est déjà structuré avec type/data, l'envoyer tel quel
          if ((message as any).type && (message as any).data !== undefined) {
            wsMessage = message
          } else {
            // Sinon, créer la structure complète
            wsMessage = {
              type: (message as any).type || 'broadcast',
              data: message,
              timestamp: new Date().toISOString(),
            }
          }

          connection.ws.send(JSON.stringify(wsMessage))
          count++
        }
      } catch (error) {
        console.error(`❌ WebSocket: Erreur envoi à affreteur ${connection.userId}:`, error.message)
      }
    }

    console.log(`✅ WebSocket: Message envoyé à ${count} affreteurs`)
  }

  /**
   * Broadcaster à tous les utilisateurs connectés (tous rôles)
   */
  async broadcastToAll(message: object): Promise<void> {
    let count = 0

    console.log(`📡 WebSocket: Broadcasting à tous (${this.connections.size} connectés)`)

    for (const connection of this.connections.values()) {
      try {
        if (connection.ws.readyState === WebSocket.OPEN) {
          let wsMessage: any

          // Si le message est déjà structuré avec type/data, l'envoyer tel quel
          if ((message as any).type && (message as any).data !== undefined) {
            wsMessage = message
          } else {
            // Sinon, créer la structure complète
            wsMessage = {
              type: (message as any).type || 'broadcast',
              data: message,
              timestamp: new Date().toISOString(),
            }
          }

          connection.ws.send(JSON.stringify(wsMessage))
          count++
        }
      } catch (error) {
        console.error(
          `❌ WebSocket: Erreur envoi à utilisateur ${connection.userId}:`,
          error.message
        )
      }
    }

    console.log(`✅ WebSocket: Message envoyé à ${count} utilisateurs`)
  }

  /**
   * Envoyer un événement de chat à plusieurs utilisateurs
   * Utilisé pour les conversations de chat
   */
  async sendChatEvent(userIds: string[], eventType: WebSocketEventType, data: any): Promise<void> {
    const message = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    }

    for (const userId of userIds) {
      await this.sendToUser(userId, message)
    }
  }

  /**
   * Envoyer une notification de "typing" (en train d'écrire)
   * aux participants d'une conversation
   */
  async sendTypingIndicator(
    conversationId: number,
    senderId: string,
    recipientIds: string[],
    isTyping: boolean
  ): Promise<void> {
    const eventType = isTyping
      ? WebSocketEventType.CHAT_TYPING_START
      : WebSocketEventType.CHAT_TYPING_STOP

    const message = {
      type: eventType,
      data: {
        conversationId,
        senderId,
        isTyping,
      },
      timestamp: new Date().toISOString(),
    }

    // Envoyer uniquement aux destinataires (pas à l'expéditeur)
    for (const recipientId of recipientIds) {
      if (recipientId !== senderId) {
        await this.sendToUser(recipientId, message)
      }
    }
  }

  /**
   * Envoyer une notification de message lu
   */
  async sendMessageReadNotification(
    messageId: number,
    conversationId: number,
    readerId: string,
    senderId: string
  ): Promise<void> {
    const message = {
      type: WebSocketEventType.CHAT_MESSAGE_READ,
      data: {
        messageId,
        conversationId,
        readerId,
        readAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }

    // Notifier uniquement l'expéditeur du message
    await this.sendToUser(senderId, message)
  }

  /**
   * Envoyer une notification de nouvelle conversation
   */
  async sendConversationCreatedNotification(
    conversationId: number,
    participantIds: string[]
  ): Promise<void> {
    await this.sendChatEvent(participantIds, WebSocketEventType.CHAT_CONVERSATION_CREATED, {
      conversationId,
    })
  }
}

// Export l'instance singleton
export default WebSocketService

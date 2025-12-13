import type { EventsList } from '@adonisjs/core/types'

/**
 * SOS Listener - Gère les alertes d'urgence
 *
 * Workflow:
 * 1. Reçoit l'événement mission:sos_alert
 * 2. Broadcast aux admins connectés (WebSocket)
 * 3. Notifie l'affréteur de la mission
 */
export default class SosListener {
  /**
   * Gère une alerte SOS émise par un transporteur
   */
  async onSosAlert({ issue, mission }: EventsList['mission:sos_alert']) {
    // Import dynamique pour éviter les dépendances circulaires
    const { default: WebSocketService, WebSocketEventType } = await import(
      '#services/websocket_service'
    )
    const websocketService = WebSocketService.getInstance()

    console.log(`🚨 SOS ALERT received for mission ${mission.id}`)
    console.log(`   Type: ${issue.type}, Priority: ${issue.priority}`)

    const sosData = {
      issueId: issue.id,
      missionId: mission.id,
      missionTitle: mission.title,
      type: issue.type,
      priority: issue.priority,
      description: issue.description,
      location:
        issue.latitude && issue.longitude ? { lat: issue.latitude, lng: issue.longitude } : null,
      transporteurId: mission.transporteurId,
      affreteurId: mission.affreteurId,
      conversationId: issue.emergencyConversationId,
      createdAt: issue.createdAt.toISO(),
    }

    // 1. Broadcast à tous les admins connectés
    const adminConnections = websocketService
      .getActiveConnections()
      .filter((conn) => conn.role === 'admin')

    console.log(`📡 Broadcasting SOS to ${adminConnections.length} admin(s)`)

    for (const admin of adminConnections) {
      await websocketService.sendToUser(admin.userId, {
        type: WebSocketEventType.SOS_ALERT,
        data: sosData,
        timestamp: new Date().toISOString(),
      })
    }

    // 2. Notifier l'affréteur de la mission
    if (mission.affreteurId) {
      console.log(`📱 Notifying affréteur ${mission.affreteurId}`)
      await websocketService.sendToUser(mission.affreteurId, {
        type: WebSocketEventType.SOS_ALERT,
        data: {
          ...sosData,
          message: `🚨 URGENCE sur votre mission "${mission.title}"`,
        },
        timestamp: new Date().toISOString(),
      })
    }

    console.log(`✅ SOS Alert broadcasted successfully`)
  }

  /**
   * Gère la prise en charge d'un SOS par un admin
   */
  async onSosAcknowledged({ issue, mission, handledBy }: EventsList['mission:sos_acknowledged']) {
    const { default: WebSocketService, WebSocketEventType } = await import(
      '#services/websocket_service'
    )
    const websocketService = WebSocketService.getInstance()

    console.log(`✅ SOS ${issue.id} acknowledged by admin ${handledBy.id}`)

    const ackData = {
      issueId: issue.id,
      missionId: mission.id,
      handledBy: {
        id: handledBy.id,
        firstName: handledBy.firstName,
        lastName: handledBy.lastName,
      },
      acknowledgedAt: new Date().toISOString(),
    }

    // Notifier le transporteur que son SOS est pris en charge
    if (mission.transporteurId) {
      await websocketService.sendToUser(mission.transporteurId, {
        type: WebSocketEventType.SOS_ACKNOWLEDGED,
        data: {
          ...ackData,
          message: `Un admin prend en charge votre urgence`,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Notifier l'affréteur
    if (mission.affreteurId) {
      await websocketService.sendToUser(mission.affreteurId, {
        type: WebSocketEventType.SOS_ACKNOWLEDGED,
        data: ackData,
        timestamp: new Date().toISOString(),
      })
    }

    // Notifier tous les admins (pour mettre à jour leur dashboard)
    const adminConnections = websocketService
      .getActiveConnections()
      .filter((conn) => conn.role === 'admin')

    for (const admin of adminConnections) {
      await websocketService.sendToUser(admin.userId, {
        type: WebSocketEventType.SOS_ACKNOWLEDGED,
        data: ackData,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Gère la résolution d'un SOS
   */
  async onSosResolved({ issue, mission, resolvedBy }: EventsList['mission:sos_resolved']) {
    const { default: WebSocketService, WebSocketEventType } = await import(
      '#services/websocket_service'
    )
    const websocketService = WebSocketService.getInstance()

    console.log(`✅ SOS ${issue.id} resolved by ${resolvedBy.id}`)

    const resolveData = {
      issueId: issue.id,
      missionId: mission.id,
      resolvedBy: {
        id: resolvedBy.id,
        firstName: resolvedBy.firstName,
        lastName: resolvedBy.lastName,
      },
      resolvedAt: issue.resolvedAt?.toISO(),
    }

    // Notifier toutes les parties concernées
    const userIds = [mission.transporteurId, mission.affreteurId].filter(Boolean) as string[]

    for (const userId of userIds) {
      await websocketService.sendToUser(userId, {
        type: WebSocketEventType.SOS_RESOLVED,
        data: {
          ...resolveData,
          message: `L'urgence a été résolue`,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Notifier tous les admins
    const adminConnections = websocketService
      .getActiveConnections()
      .filter((conn) => conn.role === 'admin')

    for (const admin of adminConnections) {
      await websocketService.sendToUser(admin.userId, {
        type: WebSocketEventType.SOS_RESOLVED,
        data: resolveData,
        timestamp: new Date().toISOString(),
      })
    }
  }
}

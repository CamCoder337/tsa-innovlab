import type LocationUpdate from '#models/location_update'
import type MissionIssue from '#models/mission_issue'
import type Mission from '#models/mission'
import type User from '#models/user'

declare module '@adonisjs/core/types' {
  interface EventsList {
    'mission:location_update': {
      missionId: string
      location: LocationUpdate
    }

    // Événements SOS / Urgences
    'mission:sos_alert': {
      issue: MissionIssue
      mission: Mission
    }

    'mission:sos_acknowledged': {
      issue: MissionIssue
      mission: Mission
      handledBy: User
    }

    'mission:sos_resolved': {
      issue: MissionIssue
      mission: Mission
      resolvedBy: User
    }
  }
}

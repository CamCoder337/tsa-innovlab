import type LocationUpdate from '#models/location_update'

declare module '@adonisjs/core/types' {
  interface EventsList {
    'mission:location_update': {
      missionId: string
      location: LocationUpdate
    }
  }
}

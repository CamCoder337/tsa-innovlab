import Mission from '#models/mission'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    mission?: Mission
  }
}

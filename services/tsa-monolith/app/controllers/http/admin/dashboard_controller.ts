import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Admin dashboard not implemented yet',
      data: null,
    })
  }
}
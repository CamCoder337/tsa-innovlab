import type { HttpContext } from '@adonisjs/core/http'

export default class NotificationsController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Notifications not implemented yet',
      data: null,
    })
  }

  async markAsRead({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Marking notifications as read not implemented yet',
      data: null,
    })
  }

  async markAllAsRead({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Marking all notifications as read not implemented yet',
      data: null,
    })
  }
}
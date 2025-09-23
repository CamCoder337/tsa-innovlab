import type { HttpContext } from '@adonisjs/core/http'

export default class MessagesController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Messages/chat not implemented yet',
      data: null,
    })
  }

  async store({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Sending messages not implemented yet',
      data: null,
    })
  }

  async markAsRead({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Marking messages as read not implemented yet',
      data: null,
    })
  }
}
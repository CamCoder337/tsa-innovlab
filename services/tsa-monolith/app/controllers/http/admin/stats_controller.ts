import type { HttpContext } from '@adonisjs/core/http'

export default class StatsController {
  async overview({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Overview statistics not implemented yet',
      data: null,
    })
  }

  async users({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'User statistics not implemented yet',
      data: null,
    })
  }

  async missions({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Mission statistics not implemented yet',
      data: null,
    })
  }

  async products({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Product statistics not implemented yet',
      data: null,
    })
  }
}

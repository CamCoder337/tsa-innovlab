import type { HttpContext } from '@adonisjs/core/http'

export default class SearchController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Shop search not implemented yet',
      data: null,
    })
  }
}
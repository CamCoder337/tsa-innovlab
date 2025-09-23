import type { HttpContext } from '@adonisjs/core/http'

export default class CategoriesController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Shop categories not implemented yet',
      data: null,
    })
  }
}
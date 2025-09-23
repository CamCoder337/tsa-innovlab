import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Shop product catalog not implemented yet',
      data: null,
    })
  }

  async show({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Shop product details not implemented yet',
      data: null,
    })
  }
}

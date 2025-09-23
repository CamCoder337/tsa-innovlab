import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Users management not implemented yet',
      data: null,
    })
  }

  async show({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'User details not implemented yet',
      data: null,
    })
  }

  async update({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'User update not implemented yet',
      data: null,
    })
  }

  async destroy({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'User deletion not implemented yet',
      data: null,
    })
  }
}
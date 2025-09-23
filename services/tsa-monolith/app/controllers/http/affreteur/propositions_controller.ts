import type { HttpContext } from '@adonisjs/core/http'

export default class PropositionsController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Viewing propositions not implemented yet',
      data: null,
    })
  }

  async accept({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Accepting propositions not implemented yet',
      data: null,
    })
  }

  async reject({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Rejecting propositions not implemented yet',
      data: null,
    })
  }
}
import type { HttpContext } from '@adonisjs/core/http'

export default class PropositionsController {
  async apply({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Mission application not implemented yet',
      data: null,
    })
  }

  async myPropositions({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'My propositions listing not implemented yet',
      data: null,
    })
  }
}

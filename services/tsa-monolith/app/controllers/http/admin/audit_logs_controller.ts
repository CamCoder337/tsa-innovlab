import type { HttpContext } from '@adonisjs/core/http'

export default class AuditLogsController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Audit logs viewing not implemented yet',
      data: null,
    })
  }
}

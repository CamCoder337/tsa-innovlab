import type { HttpContext } from '@adonisjs/core/http'

export default class ShipmentsController {
  async index({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Shipments tracking not implemented yet',
      data: null,
    })
  }

  async tracking({ response }: HttpContext) {
    return response.status(501).json({
      success: false,
      message: 'Shipment tracking details not implemented yet',
      data: null,
    })
  }
}

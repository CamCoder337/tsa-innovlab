import type { HttpContext } from '@adonisjs/core/http'
import Address from '#models/address'

/**
 * Contrôleur pour la gestion des adresses
 * Accessible à tous les rôles authentifiés (admin, transporteur, affreteur, client)
 */
export default class AddressesController {
  /**
   * Récupère toutes les adresses de l'utilisateur connecté
   * GET /api/common/addresses
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Pagination
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Récupérer les adresses de l'utilisateur
      const addresses = await Address.query()
        .where('userId', user.id)
        .orderBy('createdAt', 'desc')
        .paginate(page, limit)

      return response.ok({
        success: true,
        message: 'Addresses retrieved successfully',
        data: addresses.all(),
        meta: addresses.getMeta(),
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to retrieve addresses',
        error: error.message,
      })
    }
  }

  /**
   * Affiche les détails d'une adresse spécifique
   * GET /api/common/addresses/:id
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const address = await Address.query()
        .where('id', params.id)
        .where('userId', user.id)
        .firstOrFail()

      return response.ok({
        success: true,
        message: 'Address retrieved successfully',
        data: address,
      })
    } catch (error: any) {
      return response.notFound({
        success: false,
        message: 'Address not found or does not belong to you',
        error: error.message,
      })
    }
  }

  /**
   * Crée une nouvelle adresse pour l'utilisateur
   * POST /api/common/addresses
   */
  async store({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const data = request.only([
        'street',
        'city',
        'region',
        'country',
        'postalCode',
        'latitude',
        'longitude',
        'label',
      ])

      const address = await Address.create({
        userId: user.id,
        ...data,
      })

      return response.created({
        success: true,
        message: 'Address created successfully',
        data: address,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to create address',
        error: error.message,
      })
    }
  }

  /**
   * Met à jour une adresse existante
   * PUT /api/common/addresses/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const address = await Address.query()
        .where('id', params.id)
        .where('userId', user.id)
        .firstOrFail()

      const data = request.only([
        'street',
        'city',
        'region',
        'country',
        'postalCode',
        'latitude',
        'longitude',
        'label',
      ])

      address.merge(data)
      await address.save()

      return response.ok({
        success: true,
        message: 'Address updated successfully',
        data: address,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to update address',
        error: error.message,
      })
    }
  }

  /**
   * Supprime une adresse
   * DELETE /api/common/addresses/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const address = await Address.query()
        .where('id', params.id)
        .where('userId', user.id)
        .firstOrFail()

      await address.delete()

      return response.ok({
        success: true,
        message: 'Address deleted successfully',
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to delete address',
        error: error.message,
      })
    }
  }
}

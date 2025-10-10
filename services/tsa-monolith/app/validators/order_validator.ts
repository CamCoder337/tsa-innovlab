import vine from '@vinejs/vine'
import { OrderStatus, PaymentMethod } from '#models/order'

/**
 * Validator pour créer une commande depuis le panier
 */
export const createOrderValidator = vine.compile(
  vine.object({
    shippingAddressId: vine.string().uuid().optional(),
    billingAddressId: vine.string().uuid().optional(),
    paymentMethod: vine.enum([
      PaymentMethod.ORANGE_MONEY,
      PaymentMethod.MTN_MOMO,
      PaymentMethod.WAVE,
      PaymentMethod.BANK_TRANSFER,
      PaymentMethod.CASH_ON_DELIVERY,
    ]),
    notes: vine.string().maxLength(500).optional(),
  })
)

/**
 * Validator pour mettre à jour le statut d'une commande
 */
export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum([
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ]),
    trackingNumber: vine.string().maxLength(100).optional(),
  })
)

/**
 * Validator pour lister les commandes avec filtres
 */
export const listOrdersValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    status: vine
      .enum([
        OrderStatus.PENDING,
        OrderStatus.PAID,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED,
      ])
      .optional(),
    sortBy: vine.string().in(['createdAt', 'total', 'status']).optional(),
    sortOrder: vine.string().in(['asc', 'desc']).optional(),
  })
)

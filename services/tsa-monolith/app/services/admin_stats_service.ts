import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Order, { OrderStatus, PaymentStatus } from '#models/order'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Mission, { MissionStatus } from '#models/mission'

/**
 * Types pour les statistiques
 */
export interface RevenueStats {
  total: number
  today: number
  last7Days: number
  last30Days: number
  evolution: {
    labels: string[]
    today: number[]
    last7Days: number[]
    last30Days: number[]
  }
}

export interface OrderStats {
  total: number
  byStatus: {
    pending: number
    paid: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  byPeriod: {
    today: number
    last7Days: number
    last30Days: number
  }
}

export interface ConversionStats {
  total: number
  today: number
  last7Days: number
  last30Days: number
}

export interface AverageBasketStats {
  total: number
  today: number
  last7Days: number
  last30Days: number
}

export interface TopProduct {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
}

export interface QuickStats {
  totalUsers: number
  totalProducts: number
  totalMissions: number
}

export interface OverviewStats {
  revenue: RevenueStats
  orders: OrderStats
  conversion: ConversionStats
  averageBasket: AverageBasketStats
  topProducts: TopProduct[]
  quickStats: QuickStats
}

export interface UserStats {
  total: number
  byRole: {
    admin: number
    transporteur: number
    affreteur: number
    client: number
  }
  byPeriod: {
    today: number
    last7Days: number
    last30Days: number
  }
  active: number
  inactive: number
  emailVerified: number
  emailUnverified: number
  mfaEnabled: number
  evolution: {
    labels: string[]
    data: number[]
  }
}

export interface MissionStats {
  total: number
  byStatus: {
    draft: number
    published: number
    assigned: number
    in_progress: number
    completed: number
    cancelled: number
  }
  byPeriod: {
    today: number
    last7Days: number
    last30Days: number
  }
  totalBudget: number
  averageBudget: number
  completionRate: number
  topAffreteurs: Array<{
    userId: string
    userName: string
    missionCount: number
  }>
  topTransporteurs: Array<{
    userId: string
    userName: string
    missionCount: number
  }>
}

export interface ProductStats {
  total: number
  active: number
  inactive: number
  byCategory: Array<{
    categoryId: string
    categoryName: string
    productCount: number
    totalStock: number
  }>
  totalStock: number
  totalStockValue: number
  lowStockCount: number
  lowStockProducts: Array<{
    productId: string
    productName: string
    stock: number
    stockAlert: number
  }>
  evolution: {
    labels: string[]
    data: number[]
  }
}

/**
 * Service pour les statistiques administrateur
 */
export default class AdminStatsService {
  /**
   * Récupère les statistiques complètes du dashboard admin
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const [revenue, orders, conversion, averageBasket, topProducts, quickStats] = await Promise.all(
      [
        this.getRevenueStats(),
        this.getOrderStats(),
        this.getConversionStats(),
        this.getAverageBasketStats(),
        this.getTopProducts(10),
        this.getQuickStats(),
      ]
    )

    return {
      revenue,
      orders,
      conversion,
      averageBasket,
      topProducts,
      quickStats,
    }
  }

  /**
   * Calcule les statistiques de chiffre d'affaires
   */
  async getRevenueStats(): Promise<RevenueStats> {
    const now = DateTime.now()
    const today = now.startOf('day')
    const last7Days = now.minus({ days: 7 }).startOf('day')
    const last30Days = now.minus({ days: 30 }).startOf('day')

    // Récupérer toutes les commandes payées (PAID ou DELIVERED)
    const allOrders = await Order.query().where((query) => {
      query
        .where('paymentStatus', PaymentStatus.COMPLETED)
        .orWhere('status', OrderStatus.PAID)
        .orWhere('status', OrderStatus.DELIVERED)
    })

    // Calculer les totaux par période
    const total = allOrders.reduce((sum, order) => sum + Number.parseFloat(String(order.total)), 0)

    const todayOrders = allOrders.filter((order) => order.createdAt >= today)
    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + Number.parseFloat(String(order.total)),
      0
    )

    const last7DaysOrders = allOrders.filter((order) => order.createdAt >= last7Days)
    const last7DaysRevenue = last7DaysOrders.reduce(
      (sum, order) => sum + Number.parseFloat(String(order.total)),
      0
    )

    const last30DaysOrders = allOrders.filter((order) => order.createdAt >= last30Days)
    const last30DaysRevenue = last30DaysOrders.reduce(
      (sum, order) => sum + Number.parseFloat(String(order.total)),
      0
    )

    // Calculer l'évolution jour par jour
    const evolution = this.calculateRevenueEvolution(allOrders, now)

    return {
      total,
      today: todayRevenue,
      last7Days: last7DaysRevenue,
      last30Days: last30DaysRevenue,
      evolution,
    }
  }

  /**
   * Calcule l'évolution du CA jour par jour
   */
  private calculateRevenueEvolution(orders: Order[], now: DateTime): RevenueStats['evolution'] {
    const today = now.startOf('day')
    const labels: string[] = []
    const todayData: number[] = []
    const last7DaysData: number[] = []
    const last30DaysData: number[] = []

    // Évolution pour aujourd'hui (par heure sur 24h)
    for (let i = 0; i < 24; i++) {
      const hour = today.plus({ hours: i })
      labels.push(hour.toFormat('HH:mm'))
      const hourOrders = orders.filter(
        (order) => order.createdAt >= hour && order.createdAt < hour.plus({ hours: 1 })
      )
      todayData.push(
        hourOrders.reduce((sum, order) => sum + Number.parseFloat(String(order.total)), 0)
      )
    }

    // Évolution pour 7 derniers jours (par jour)
    const labels7Days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const day = now.minus({ days: i }).startOf('day')
      labels7Days.push(day.toFormat('dd/MM'))
      const dayOrders = orders.filter(
        (order) => order.createdAt >= day && order.createdAt < day.plus({ days: 1 })
      )
      last7DaysData.push(
        dayOrders.reduce((sum, order) => sum + Number.parseFloat(String(order.total)), 0)
      )
    }

    // Évolution pour 30 derniers jours (par jour)
    const labels30Days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const day = now.minus({ days: i }).startOf('day')
      labels30Days.push(day.toFormat('dd/MM'))
      const dayOrders = orders.filter(
        (order) => order.createdAt >= day && order.createdAt < day.plus({ days: 1 })
      )
      last30DaysData.push(
        dayOrders.reduce((sum, order) => sum + Number.parseFloat(String(order.total)), 0)
      )
    }

    return {
      labels: labels.length > 0 ? labels : labels7Days.length > 0 ? labels7Days : labels30Days,
      today: todayData,
      last7Days: last7DaysData,
      last30Days: last30DaysData,
    }
  }

  /**
   * Calcule les statistiques des commandes
   */
  async getOrderStats(): Promise<OrderStats> {
    const now = DateTime.now()
    const today = now.startOf('day')
    const last7Days = now.minus({ days: 7 }).startOf('day')
    const last30Days = now.minus({ days: 30 }).startOf('day')

    // Récupérer toutes les commandes
    const allOrders = await Order.query().select('status', 'createdAt')

    // Total
    const total = allOrders.length

    // Par statut
    const byStatus = {
      pending: allOrders.filter((o) => o.status === OrderStatus.PENDING).length,
      paid: allOrders.filter((o) => o.status === OrderStatus.PAID).length,
      processing: allOrders.filter((o) => o.status === OrderStatus.PROCESSING).length,
      shipped: allOrders.filter((o) => o.status === OrderStatus.SHIPPED).length,
      delivered: allOrders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      cancelled: allOrders.filter((o) => o.status === OrderStatus.CANCELLED).length,
    }

    // Par période
    const byPeriod = {
      today: allOrders.filter((o) => o.createdAt >= today).length,
      last7Days: allOrders.filter((o) => o.createdAt >= last7Days).length,
      last30Days: allOrders.filter((o) => o.createdAt >= last30Days).length,
    }

    return {
      total,
      byStatus,
      byPeriod,
    }
  }

  /**
   * Calcule le taux de conversion (commandes payées / commandes totales)
   */
  async getConversionStats(): Promise<ConversionStats> {
    const now = DateTime.now()
    const today = now.startOf('day')
    const last7Days = now.minus({ days: 7 }).startOf('day')
    const last30Days = now.minus({ days: 30 }).startOf('day')

    // Récupérer toutes les commandes
    const allOrders = await Order.query().select('status', 'paymentStatus', 'createdAt')

    // Helper pour calculer le taux de conversion
    const calculateRate = (orders: Order[]) => {
      if (orders.length === 0) return 0
      const successful = orders.filter(
        (o) =>
          o.paymentStatus === PaymentStatus.COMPLETED ||
          o.status === OrderStatus.DELIVERED ||
          o.status === OrderStatus.PAID
      ).length
      return Math.round((successful / orders.length) * 100) / 100
    }

    // Calculer par période
    const todayOrders = allOrders.filter((o) => o.createdAt >= today)
    const last7DaysOrders = allOrders.filter((o) => o.createdAt >= last7Days)
    const last30DaysOrders = allOrders.filter((o) => o.createdAt >= last30Days)

    return {
      total: calculateRate(allOrders),
      today: calculateRate(todayOrders),
      last7Days: calculateRate(last7DaysOrders),
      last30Days: calculateRate(last30DaysOrders),
    }
  }

  /**
   * Calcule le panier moyen
   */
  async getAverageBasketStats(): Promise<AverageBasketStats> {
    const now = DateTime.now()
    const today = now.startOf('day')
    const last7Days = now.minus({ days: 7 }).startOf('day')
    const last30Days = now.minus({ days: 30 }).startOf('day')

    // Récupérer toutes les commandes payées
    const allOrders = await Order.query().where((query) => {
      query
        .where('paymentStatus', PaymentStatus.COMPLETED)
        .orWhere('status', OrderStatus.PAID)
        .orWhere('status', OrderStatus.DELIVERED)
    })

    // Helper pour calculer le panier moyen
    const calculateAverage = (orders: Order[]) => {
      if (orders.length === 0) return 0
      const total = orders.reduce((sum, order) => sum + Number.parseFloat(String(order.total)), 0)
      return Math.round(total / orders.length)
    }

    // Calculer par période
    const todayOrders = allOrders.filter((o) => o.createdAt >= today)
    const last7DaysOrders = allOrders.filter((o) => o.createdAt >= last7Days)
    const last30DaysOrders = allOrders.filter((o) => o.createdAt >= last30Days)

    return {
      total: calculateAverage(allOrders),
      today: calculateAverage(todayOrders),
      last7Days: calculateAverage(last7DaysOrders),
      last30Days: calculateAverage(last30DaysOrders),
    }
  }

  /**
   * Récupère les produits les plus vendus
   */
  async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
    // Requête SQL pour agréger les ventes par produit
    const topProducts = await db
      .from('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where((query) => {
        query
          .where('orders.payment_status', PaymentStatus.COMPLETED)
          .orWhere('orders.status', OrderStatus.PAID)
          .orWhere('orders.status', OrderStatus.DELIVERED)
      })
      .select('order_items.product_id as productId')
      .select('order_items.product_name as productName')
      .sum('order_items.quantity as quantitySold')
      .sum('order_items.total_price as revenue')
      .groupBy('order_items.product_id', 'order_items.product_name')
      .orderBy('revenue', 'desc')
      .limit(limit)

    return topProducts.map((product: any) => ({
      productId: product.productId,
      productName: product.productName,
      quantitySold: Number(product.quantitySold),
      revenue: Number(product.revenue),
    }))
  }

  /**
   * Récupère les statistiques rapides (users, produits, missions)
   */
  async getQuickStats(): Promise<QuickStats> {
    const [usersCount, productsCount, missionsCount] = await Promise.all([
      User.query().count('* as total'),
      Product.query().count('* as total'),
      Mission.query().count('* as total'),
    ])

    return {
      totalUsers: Number(usersCount[0].$extras.total),
      totalProducts: Number(productsCount[0].$extras.total),
      totalMissions: Number(missionsCount[0].$extras.total),
    }
  }

  /**
   * Récupère les statistiques détaillées des utilisateurs
   */
  async getUserStats(): Promise<UserStats> {
    const now = DateTime.now()
    const today = now.startOf('day')
    const last7Days = now.minus({ days: 7 }).startOf('day')
    const last30Days = now.minus({ days: 30 }).startOf('day')

    // Récupérer tous les utilisateurs
    const allUsers = await User.query().select(
      'id',
      'role',
      'status',
      'emailVerifiedAt',
      'mfaEnabled',
      'createdAt'
    )

    // Total
    const total = allUsers.length

    // Par rôle
    const byRole = {
      admin: allUsers.filter((u) => u.role === UserRole.ADMIN).length,
      transporteur: allUsers.filter((u) => u.role === UserRole.TRANSPORTEUR).length,
      affreteur: allUsers.filter((u) => u.role === UserRole.AFFRETEUR).length,
      client: allUsers.filter((u) => u.role === UserRole.CLIENT).length,
    }

    // Par période
    const byPeriod = {
      today: allUsers.filter((u) => u.createdAt >= today).length,
      last7Days: allUsers.filter((u) => u.createdAt >= last7Days).length,
      last30Days: allUsers.filter((u) => u.createdAt >= last30Days).length,
    }

    // Actifs/Inactifs
    const active = allUsers.filter((u) => u.status === UserStatus.ACTIVE).length
    const inactive = allUsers.filter((u) => u.status !== UserStatus.ACTIVE).length

    // Email vérifié
    const emailVerified = allUsers.filter((u) => u.emailVerifiedAt !== null).length
    const emailUnverified = total - emailVerified

    // MFA activé
    const mfaEnabled = allUsers.filter((u) => u.mfaEnabled).length

    // Évolution des inscriptions (30 derniers jours)
    const labels: string[] = []
    const data: number[] = []
    for (let i = 29; i >= 0; i--) {
      const day = now.minus({ days: i }).startOf('day')
      labels.push(day.toFormat('dd/MM'))
      const dayUsers = allUsers.filter(
        (u) => u.createdAt >= day && u.createdAt < day.plus({ days: 1 })
      )
      data.push(dayUsers.length)
    }

    return {
      total,
      byRole,
      byPeriod,
      active,
      inactive,
      emailVerified,
      emailUnverified,
      mfaEnabled,
      evolution: {
        labels,
        data,
      },
    }
  }

  /**
   * Récupère les statistiques détaillées des missions
   */
  async getMissionStats(): Promise<MissionStats> {
    const now = DateTime.now()
    const today = now.startOf('day')
    const last7Days = now.minus({ days: 7 }).startOf('day')
    const last30Days = now.minus({ days: 30 }).startOf('day')

    // Récupérer toutes les missions
    const allMissions = await Mission.query()
      .select(
        'id',
        'status',
        'budgetMin',
        'budgetMax',
        'affreteurId',
        'transporteurId',
        'createdAt'
      )
      .preload('affreteur', (query) => {
        query.select('id', 'firstName', 'lastName')
      })
      .preload('transporteur', (query) => {
        query.select('id', 'firstName', 'lastName')
      })

    // Total
    const total = allMissions.length

    // Par statut
    const byStatus = {
      draft: allMissions.filter((m) => m.status === MissionStatus.DRAFT).length,
      published: allMissions.filter((m) => m.status === MissionStatus.PUBLISHED).length,
      assigned: allMissions.filter((m) => m.status === MissionStatus.ASSIGNED).length,
      in_progress: allMissions.filter((m) => m.status === MissionStatus.IN_PROGRESS).length,
      completed: allMissions.filter((m) => m.status === MissionStatus.COMPLETED).length,
      cancelled: allMissions.filter((m) => m.status === MissionStatus.CANCELLED).length,
    }

    // Par période
    const byPeriod = {
      today: allMissions.filter((m) => m.createdAt >= today).length,
      last7Days: allMissions.filter((m) => m.createdAt >= last7Days).length,
      last30Days: allMissions.filter((m) => m.createdAt >= last30Days).length,
    }

    // Budget total et moyen
    const totalBudget = allMissions.reduce(
      (sum, m) => sum + (Number(m.budgetMax) || Number(m.budgetMin) || 0),
      0
    )
    const averageBudget = allMissions.length > 0 ? Math.round(totalBudget / allMissions.length) : 0

    // Taux de complétion
    const completedMissions = allMissions.filter((m) => m.status === MissionStatus.COMPLETED).length
    const completionRate = total > 0 ? Math.round((completedMissions / total) * 100) / 100 : 0

    // Top affreteurs (par nombre de missions)
    const affreteurMap = new Map<string, { name: string; count: number }>()
    allMissions.forEach((m) => {
      if (m.affreteurId && m.affreteur) {
        const key = m.affreteurId
        const name = `${m.affreteur.firstName} ${m.affreteur.lastName}`
        const existing = affreteurMap.get(key) || { name, count: 0 }
        affreteurMap.set(key, { name, count: existing.count + 1 })
      }
    })
    const topAffreteurs = Array.from(affreteurMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        missionCount: data.count,
      }))
      .sort((a, b) => b.missionCount - a.missionCount)
      .slice(0, 5)

    // Top transporteurs (par nombre de missions assignées)
    const transporteurMap = new Map<string, { name: string; count: number }>()
    allMissions
      .filter((m) => m.transporteurId && m.transporteur)
      .forEach((m) => {
        if (m.transporteurId && m.transporteur) {
          const key = m.transporteurId
          const name = `${m.transporteur.firstName} ${m.transporteur.lastName}`
          const existing = transporteurMap.get(key) || { name, count: 0 }
          transporteurMap.set(key, { name, count: existing.count + 1 })
        }
      })
    const topTransporteurs = Array.from(transporteurMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        missionCount: data.count,
      }))
      .sort((a, b) => b.missionCount - a.missionCount)
      .slice(0, 5)

    return {
      total,
      byStatus,
      byPeriod,
      totalBudget,
      averageBudget,
      completionRate,
      topAffreteurs,
      topTransporteurs,
    }
  }

  /**
   * Récupère les statistiques détaillées des produits
   */
  async getProductStats(): Promise<ProductStats> {
    const now = DateTime.now()

    // Récupérer tous les produits avec leurs catégories
    const allProducts = await Product.query()
      .select('id', 'name', 'isActive', 'stock', 'price', 'stockAlert', 'categoryId', 'createdAt')
      .preload('category')

    // Total
    const total = allProducts.length

    // Actifs/Inactifs
    const active = allProducts.filter((p) => p.isActive).length
    const inactive = total - active

    // Par catégorie
    const categoryMap = new Map<string, { name: string; count: number; totalStock: number }>()
    allProducts.forEach((p) => {
      if (p.categoryId && p.category) {
        const key = p.categoryId
        const name = p.category.name
        const existing = categoryMap.get(key) || { name, count: 0, totalStock: 0 }
        categoryMap.set(key, {
          name,
          count: existing.count + 1,
          totalStock: existing.totalStock + p.stock,
        })
      }
    })
    const byCategory = Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        productCount: data.count,
        totalStock: data.totalStock,
      }))
      .sort((a, b) => b.productCount - a.productCount)

    // Stock total
    const totalStock = allProducts.reduce((sum, p) => sum + p.stock, 0)

    // Valeur totale du stock
    const totalStockValue = allProducts.reduce((sum, p) => sum + p.stock * Number(p.price), 0)

    // Produits en stock faible
    const lowStockProducts = allProducts
      .filter((p) => p.isActive && p.stock <= p.stockAlert)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        stock: p.stock,
        stockAlert: p.stockAlert,
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)

    const lowStockCount = lowStockProducts.length

    // Évolution du catalogue (30 derniers jours)
    const labels: string[] = []
    const data: number[] = []
    for (let i = 29; i >= 0; i--) {
      const day = now.minus({ days: i }).startOf('day')
      labels.push(day.toFormat('dd/MM'))
      const dayProducts = allProducts.filter(
        (p) => p.createdAt >= day && p.createdAt < day.plus({ days: 1 })
      )
      data.push(dayProducts.length)
    }

    return {
      total,
      active,
      inactive,
      byCategory,
      totalStock,
      totalStockValue,
      lowStockCount,
      lowStockProducts,
      evolution: {
        labels,
        data,
      },
    }
  }
}

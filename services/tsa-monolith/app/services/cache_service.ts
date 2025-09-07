import redis from '@adonisjs/redis/services/main'

export interface UserSession {
  userId: string
  role: string
  abilities: string[]
  lastActivity: string
}

export default class CacheService {
  private readonly PREFIX = 'tsa:'
  private readonly TTL = {
    USER_SESSION: 1800, // 30 minutes
    MISSION_LIST: 300, // 5 minutes
    MISSION_DETAIL: 600, // 10 minutes
    PRODUCT_LIST: 300, // 5 minutes
    CATEGORY_TREE: 3600, // 1 hour
    STATS_DASHBOARD: 600, // 10 minutes
    BLACKLIST_TOKEN: 86400, // 24 hours
  }

  // User Session Management
  async setUserSession(userId: string, session: UserSession): Promise<void> {
    const key = `${this.PREFIX}session:${userId}`
    await redis.setex(key, this.TTL.USER_SESSION, JSON.stringify(session))
  }

  async getUserSession(userId: string): Promise<UserSession | null> {
    const key = `${this.PREFIX}session:${userId}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  async extendUserSession(userId: string): Promise<void> {
    const key = `${this.PREFIX}session:${userId}`
    await redis.expire(key, this.TTL.USER_SESSION)
  }

  async clearUserSession(userId: string): Promise<void> {
    const key = `${this.PREFIX}session:${userId}`
    await redis.del(key)
  }

  // Mission Caching
  async setMissionList(filters: Record<string, any>, data: any): Promise<void> {
    const key = this.generateCacheKey('missions', filters)
    await redis.setex(key, this.TTL.MISSION_LIST, JSON.stringify(data))
  }

  async getMissionList(filters: Record<string, any>): Promise<any | null> {
    const key = this.generateCacheKey('missions', filters)
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  async setMission(missionId: string, data: any): Promise<void> {
    const key = `${this.PREFIX}mission:${missionId}`
    await redis.setex(key, this.TTL.MISSION_DETAIL, JSON.stringify(data))
  }

  async getMission(missionId: string): Promise<any | null> {
    const key = `${this.PREFIX}mission:${missionId}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  async invalidateMission(missionId: string): Promise<void> {
    // Delete specific mission
    await redis.del(`${this.PREFIX}mission:${missionId}`)

    // Delete all mission lists (they might contain this mission)
    const pattern = `${this.PREFIX}missions:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(keys)
    }
  }

  // Product Caching
  async setProductList(filters: Record<string, any>, data: any): Promise<void> {
    const key = this.generateCacheKey('products', filters)
    await redis.setex(key, this.TTL.PRODUCT_LIST, JSON.stringify(data))
  }

  async getProductList(filters: Record<string, any>): Promise<any | null> {
    const key = this.generateCacheKey('products', filters)
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  async setCategoryTree(data: any): Promise<void> {
    const key = `${this.PREFIX}categories:tree`
    await redis.setex(key, this.TTL.CATEGORY_TREE, JSON.stringify(data))
  }

  async getCategoryTree(): Promise<any | null> {
    const key = `${this.PREFIX}categories:tree`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  // Dashboard Stats Caching
  async setDashboardStats(role: string, data: any): Promise<void> {
    const key = `${this.PREFIX}stats:dashboard:${role}`
    await redis.setex(key, this.TTL.STATS_DASHBOARD, JSON.stringify(data))
  }

  async getDashboardStats(role: string): Promise<any | null> {
    const key = `${this.PREFIX}stats:dashboard:${role}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  // Token Blacklisting
  async blacklistToken(token: string): Promise<void> {
    const key = `${this.PREFIX}blacklist:${token}`
    await redis.setex(key, this.TTL.BLACKLIST_TOKEN, '1')
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${this.PREFIX}blacklist:${token}`
    const exists = await redis.exists(key)
    return exists === 1
  }
  async checkRateLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `${this.PREFIX}rate:${identifier}`
    const now = Date.now()
    const windowStart = now - window * 1000

    // Remove old entries
    await redis.zremrangebyscore(key, '-inf', windowStart.toString())

    // Count current requests
    const count = await redis.zcard(key)

    if (count < limit) {
      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`)
      await redis.expire(key, window)

      return {
        allowed: true,
        remaining: limit - count - 1,
        resetAt: now + window * 1000,
      }
    }
    // Get oldest entry to determine reset time
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const resetAt =
      oldest.length > 0 ? Number.parseInt(oldest[1]) + window * 1000 : now + window * 1000

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    }
  }

  // Pattern-based cache invalidation
  async flushPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(`${this.PREFIX}${pattern}`)
    if (keys.length > 0) {
      await redis.del(keys)
    }
  }

  // Utility method to generate consistent cache keys
  private generateCacheKey(prefix: string, filters: Record<string, any>): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(':')

    return `${this.PREFIX}${prefix}:${filterString || 'all'}`
  }

  // Clear all cache (use with caution)
  async flushAll(): Promise<void> {
    const keys = await redis.keys(`${this.PREFIX}*`)
    if (keys.length > 0) {
      await redis.del(keys)
    }
  }

  // Generic cache methods for other services
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, value)
    } else {
      await redis.set(key, value)
    }
  }

  async get(key: string): Promise<string | null> {
    return await redis.get(key)
  }

  async delete(key: string): Promise<void> {
    await redis.del(key)
  }

  async getKeys(pattern: string): Promise<string[]> {
    return await redis.keys(pattern)
  }
}

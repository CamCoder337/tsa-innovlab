/**
 * Maps Cache Service
 * Intelligent caching system for Google Maps API responses
 * Reduces API calls and improves performance
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
}

export class MapsCacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize = 500; // Maximum cache entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private options: CacheOptions = {}) {
    // Start automatic cleanup every 2 minutes
    this.startCleanup();
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheTTL = ttl || this.options.ttl || this.defaultTTL;
    const now = Date.now();

    // If cache is full, remove oldest entry
    if (this.cache.size >= (this.options.maxSize || this.maxSize)) {
      this.removeOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cacheTTL,
    });
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get or set pattern - if not in cache, fetch and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Generate key for route calculations
   */
  getRouteKey(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: Record<string, unknown>
  ): string {
    return this.generateKey('route', {
      origin: `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`,
      destination: `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`,
      ...options,
    });
  }

  /**
   * Generate key for geocoding
   */
  getGeocodeKey(address: string): string {
    return this.generateKey('geocode', { address: address.toLowerCase().trim() });
  }

  /**
   * Generate key for reverse geocoding
   */
  getReverseGeocodeKey(lat: number, lng: number): string {
    return this.generateKey('reverse', {
      location: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    });
  }

  /**
   * Generate key for distance matrix
   */
  getDistanceMatrixKey(
    origins: { lat: number; lng: number }[],
    destinations: { lat: number; lng: number }[],
    options?: Record<string, unknown>
  ): string {
    return this.generateKey('distancematrix', {
      origins: origins
        .map((o) => `${o.lat.toFixed(6)},${o.lng.toFixed(6)}`)
        .join(';'),
      destinations: destinations
        .map((d) => `${d.lat.toFixed(6)},${d.lng.toFixed(6)}`)
        .join(';'),
      ...options,
    });
  }

  /**
   * Clear specific entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldest: number | null = null;
    let newest: number | null = null;

    this.cache.forEach((entry) => {
      if (oldest === null || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
      if (newest === null || entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize || this.maxSize,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  /**
   * Remove oldest entry
   */
  private removeOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[MapsCacheService] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy cache service
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

// Singleton instance
export const mapsCacheService = new MapsCacheService({
  ttl: 5 * 60 * 1000, // 5 minutes for traffic data
  maxSize: 500,
});

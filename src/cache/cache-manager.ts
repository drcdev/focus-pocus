import crypto from 'crypto';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export interface CacheOptions {
  maxSize?: number;
  defaultTTL?: number;
  cleanupInterval?: number;
  enableStats?: boolean;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly enableStats: boolean;
  private cleanupTimer?: NodeJS.Timeout;
  
  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.enableStats = options.enableStats ?? true;

    // Start cleanup timer
    const cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minute
    this.startCleanupTimer(cleanupInterval);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // If cache is full, evict least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    if (this.enableStats) this.stats.hits++;
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  size(): number {
    return this.cache.size;
  }

  // Generate cache key from operation and parameters
  generateKey(operation: string, params: any = {}): string {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto.createHash('md5').update(`${operation}:${sortedParams}`).digest('hex');
    return `${operation}:${hash.substring(0, 16)}`;
  }

  // Invalidate cache entries by pattern
  invalidateByPattern(pattern: string | RegExp): number {
    let deletedCount = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  // Invalidate all task-related cache entries
  invalidateTaskCache(): number {
    return this.invalidateByPattern(/^(getAllTasks|getTaskById|searchTasks):/);
  }

  // Invalidate all project-related cache entries
  invalidateProjectCache(): number {
    return this.invalidateByPattern(/^(getAllProjects|getProjectById):/);
  }

  // Invalidate entries by pattern (alias for invalidateByPattern for convenience)
  invalidate(pattern: string | RegExp): number {
    return this.invalidateByPattern(pattern);
  }

  // Invalidate all cache entries
  invalidateAll(): void {
    this.clear();
  }

  // Get cache statistics
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0
    };
  }

  // Reset statistics
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  // Check if cache entry is expired
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Evict least recently used entry
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.enableStats) this.stats.evictions++;
    }
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  // Start cleanup timer
  private startCleanupTimer(interval: number): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  // Stop cleanup timer
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

// Singleton instance
let cacheManager: CacheManager | null = null;

export function getCacheManager(options?: CacheOptions): CacheManager {
  if (!cacheManager) {
    cacheManager = new CacheManager(options);
  }
  return cacheManager;
}

export function destroyCacheManager(): void {
  if (cacheManager) {
    cacheManager.destroy();
    cacheManager = null;
  }
}
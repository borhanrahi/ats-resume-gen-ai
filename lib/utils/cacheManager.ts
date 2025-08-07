/**
 * Client-side caching system for analysis results, templates, and heavy resources
 * Implements memory cache with LRU eviction and localStorage persistence
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxMemorySize: number; // in bytes
  maxLocalStorageSize: number; // in bytes
  defaultTTL: number; // in milliseconds
  persistToLocalStorage: boolean;
  enableCompression: boolean;
}

export interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  localStorageHits: number;
  localStorageMisses: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxMemorySize: 50 * 1024 * 1024, // 50MB
  maxLocalStorageSize: 10 * 1024 * 1024, // 10MB
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  persistToLocalStorage: true,
  enableCompression: false, // Disabled for now, can be enabled with compression library
};

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats = {
    memoryHits: 0,
    memoryMisses: 0,
    localStorageHits: 0,
    localStorageMisses: 0,
    totalSize: 0,
    entryCount: 0,
    evictions: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromLocalStorage();
    this.startCleanupInterval();
  }

  /**
   * Store data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);
    const serializedData = JSON.stringify(data);
    const size = this.calculateSize(serializedData);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      size,
      accessCount: 0,
      lastAccessed: now,
    };

    // Check if we need to evict entries to make space
    this.ensureSpace(size);

    // Store in memory cache
    this.memoryCache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.entryCount++;

    // Persist to localStorage if enabled
    if (this.config.persistToLocalStorage) {
      this.persistToLocalStorage(key, entry);
    }
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (this.isExpired(memoryEntry)) {
        this.delete(key);
        this.stats.memoryMisses++;
        return null;
      }

      // Update access statistics
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = Date.now();
      this.stats.memoryHits++;
      return memoryEntry.data as T;
    }

    // Try localStorage if enabled
    if (this.config.persistToLocalStorage) {
      const localStorageEntry = this.loadFromLocalStorageKey(key);
      if (localStorageEntry) {
        if (this.isExpired(localStorageEntry)) {
          this.deleteFromLocalStorage(key);
          this.stats.localStorageMisses++;
          return null;
        }

        // Move back to memory cache
        this.memoryCache.set(key, localStorageEntry);
        this.stats.localStorageHits++;
        return localStorageEntry.data as T;
      }
    }

    this.stats.memoryMisses++;
    return null;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.memoryCache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
    }

    if (this.config.persistToLocalStorage) {
      this.deleteFromLocalStorage(key);
    }

    return !!entry;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear();
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      localStorageHits: 0,
      localStorageMisses: 0,
      totalSize: 0,
      entryCount: 0,
      evictions: 0,
    };

    if (this.config.persistToLocalStorage) {
      this.clearLocalStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const totalHits = this.stats.memoryHits + this.stats.localStorageHits;
    const totalRequests = totalHits + this.stats.memoryMisses + this.stats.localStorageMisses;
    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  /**
   * Ensure there's enough space for new entry
   */
  private ensureSpace(requiredSize: number): void {
    while (this.stats.totalSize + requiredSize > this.config.maxMemorySize) {
      const evicted = this.evictLRU();
      if (!evicted) break; // No more entries to evict
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): boolean {
    let oldestEntry: { key: string; entry: CacheEntry } | null = null;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.entry.lastAccessed) {
        oldestEntry = { key, entry };
      }
    }

    if (oldestEntry) {
      this.delete(oldestEntry.key);
      this.stats.evictions++;
      return true;
    }

    return false;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Calculate size of serialized data
   */
  private calculateSize(data: string): number {
    return new Blob([data]).size;
  }

  /**
   * Load cache from localStorage on initialization
   */
  private loadFromLocalStorage(): void {
    if (!this.config.persistToLocalStorage || typeof window === 'undefined') {
      return;
    }

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'));
      
      for (const key of keys) {
        const cacheKey = key.replace('cache:', '');
        const entry = this.loadFromLocalStorageKey(cacheKey);
        
        if (entry && !this.isExpired(entry)) {
          this.memoryCache.set(cacheKey, entry);
          this.stats.totalSize += entry.size;
          this.stats.entryCount++;
        } else if (entry) {
          // Remove expired entries
          this.deleteFromLocalStorage(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Load single entry from localStorage
   */
  private loadFromLocalStorageKey(key: string): CacheEntry | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (stored) {
        return JSON.parse(stored) as CacheEntry;
      }
    } catch (error) {
      console.warn(`Failed to load cache entry ${key} from localStorage:`, error);
      this.deleteFromLocalStorage(key);
    }

    return null;
  }

  /**
   * Persist entry to localStorage
   */
  private persistToLocalStorage(key: string, entry: CacheEntry): void {
    if (typeof window === 'undefined') return;

    try {
      const serialized = JSON.stringify(entry);
      
      // Check localStorage size limit
      if (this.getLocalStorageSize() + serialized.length > this.config.maxLocalStorageSize) {
        this.cleanupLocalStorage();
      }

      localStorage.setItem(`cache:${key}`, serialized);
    } catch (error) {
      console.warn(`Failed to persist cache entry ${key} to localStorage:`, error);
    }
  }

  /**
   * Delete entry from localStorage
   */
  private deleteFromLocalStorage(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.warn(`Failed to delete cache entry ${key} from localStorage:`, error);
    }
  }

  /**
   * Clear all cache entries from localStorage
   */
  private clearLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache from localStorage:', error);
    }
  }

  /**
   * Get current localStorage usage
   */
  private getLocalStorageSize(): number {
    if (typeof window === 'undefined') return 0;

    let size = 0;
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'));
      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    } catch (error) {
      console.warn('Failed to calculate localStorage size:', error);
    }

    return size;
  }

  /**
   * Cleanup expired entries from localStorage
   */
  private cleanupLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'));
      
      for (const key of keys) {
        const cacheKey = key.replace('cache:', '');
        const entry = this.loadFromLocalStorageKey(cacheKey);
        
        if (!entry || this.isExpired(entry)) {
          this.deleteFromLocalStorage(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup localStorage cache:', error);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  /**
   * Remove expired entries from memory cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }
}

// Specialized cache managers for different data types
export class AnalysisCache extends CacheManager {
  constructor() {
    super({
      maxMemorySize: 20 * 1024 * 1024, // 20MB for analysis results
      defaultTTL: 60 * 60 * 1000, // 1 hour
      persistToLocalStorage: true,
    });
  }

  /**
   * Generate cache key for analysis result
   */
  generateAnalysisKey(resumeContent: string, jobDescription?: string): string {
    const content = resumeContent + (jobDescription || '');
    return `analysis:${this.hashString(content)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export class TemplateCache extends CacheManager {
  constructor() {
    super({
      maxMemorySize: 10 * 1024 * 1024, // 10MB for templates
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      persistToLocalStorage: true,
    });
  }
}

export class ComponentCache extends CacheManager {
  constructor() {
    super({
      maxMemorySize: 5 * 1024 * 1024, // 5MB for component data
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      persistToLocalStorage: false, // Don't persist component cache
    });
  }
}

// Global cache instances
export const analysisCache = new AnalysisCache();
export const templateCache = new TemplateCache();
export const componentCache = new ComponentCache();

// Cache utilities
export const cacheUtils = {
  /**
   * Warm up cache with commonly used data
   */
  warmup: async () => {
    // This could be called on app initialization to preload common templates
    console.log('Cache warmup initiated');
  },

  /**
   * Get combined cache statistics
   */
  getAllStats: () => ({
    analysis: analysisCache.getStats(),
    template: templateCache.getStats(),
    component: componentCache.getStats(),
  }),

  /**
   * Clear all caches
   */
  clearAll: () => {
    analysisCache.clear();
    templateCache.clear();
    componentCache.clear();
  },

  /**
   * Get overall hit ratio across all caches
   */
  getOverallHitRatio: () => {
    const stats = cacheUtils.getAllStats();
    const totalHits = Object.values(stats).reduce(
      (sum, stat) => sum + stat.memoryHits + stat.localStorageHits, 0
    );
    const totalMisses = Object.values(stats).reduce(
      (sum, stat) => sum + stat.memoryMisses + stat.localStorageMisses, 0
    );
    const totalRequests = totalHits + totalMisses;
    return totalRequests > 0 ? totalHits / totalRequests : 0;
  },
};
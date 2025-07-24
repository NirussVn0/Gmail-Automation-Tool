import { CacheService } from '@/types/core';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class MemoryCacheService implements CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async keys(): Promise<string[]> {
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    this.cleanup();
    return this.cache.size;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

export class LocalStorageCacheService implements CacheService {
  private prefix = 'gmail_tool_cache_';
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const item = localStorage.getItem(this.prefix + key);
      
      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (this.isExpired(entry)) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: MemoryCacheService;
  private localStorageCache: LocalStorageCacheService;

  private constructor() {
    this.memoryCache = new MemoryCacheService();
    this.localStorageCache = new LocalStorageCacheService();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string, useLocalStorage = false): Promise<T | null> {
    if (useLocalStorage) {
      return this.localStorageCache.get<T>(key);
    }
    return this.memoryCache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number, useLocalStorage = false): Promise<void> {
    if (useLocalStorage) {
      return this.localStorageCache.set(key, value, ttl);
    }
    return this.memoryCache.set(key, value, ttl);
  }

  async delete(key: string, useLocalStorage = false): Promise<void> {
    if (useLocalStorage) {
      return this.localStorageCache.delete(key);
    }
    return this.memoryCache.delete(key);
  }

  async clear(useLocalStorage = false): Promise<void> {
    if (useLocalStorage) {
      return this.localStorageCache.clear();
    }
    return this.memoryCache.clear();
  }

  async remember<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
    useLocalStorage = false
  ): Promise<T> {
    const cached = await this.get<T>(key, useLocalStorage);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl, useLocalStorage);
    
    return value;
  }

  getMemoryCache(): MemoryCacheService {
    return this.memoryCache;
  }

  getLocalStorageCache(): LocalStorageCacheService {
    return this.localStorageCache;
  }

  destroy(): void {
    this.memoryCache.destroy();
  }
}

export const cacheManager = CacheManager.getInstance();

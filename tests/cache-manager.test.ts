import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CacheManager, getCacheManager, destroyCacheManager } from '../src/cache/cache-manager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager({
      maxSize: 5,
      defaultTTL: 5000, // 5 seconds - longer to avoid expiration during tests
      cleanupInterval: 60000, // 1 minute to avoid interference
      enableStats: true
    });
  });

  afterEach(() => {
    cacheManager.destroy();
  });

  describe('basic operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: '1', name: 'Test' };
      cacheManager.set('test-key', testData);

      const result = cacheManager.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cacheManager.set('exists', 'data');
      
      expect(cacheManager.has('exists')).toBe(true);
      expect(cacheManager.has('not-exists')).toBe(false);
    });

    it('should delete entries', () => {
      cacheManager.set('delete-me', 'data');
      expect(cacheManager.has('delete-me')).toBe(true);

      const deleted = cacheManager.delete('delete-me');
      expect(deleted).toBe(true);
      expect(cacheManager.has('delete-me')).toBe(false);
    });

    it('should clear all entries', () => {
      cacheManager.set('key1', 'data1');
      cacheManager.set('key2', 'data2');
      expect(cacheManager.size()).toBe(2);

      cacheManager.clear();
      expect(cacheManager.size()).toBe(0);
    });

    it('should report correct size', () => {
      expect(cacheManager.size()).toBe(0);
      
      cacheManager.set('key1', 'data1');
      expect(cacheManager.size()).toBe(1);
      
      cacheManager.set('key2', 'data2');
      expect(cacheManager.size()).toBe(2);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cacheManager.set('expire-me', 'data', 50); // 50ms TTL
      
      expect(cacheManager.get('expire-me')).toBe('data');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cacheManager.get('expire-me')).toBeNull();
      expect(cacheManager.has('expire-me')).toBe(false);
    });

    it('should use default TTL when not specified', async () => {
      cacheManager.set('default-ttl', 'data');
      
      expect(cacheManager.get('default-ttl')).toBe('data');
      
      // Wait longer than default TTL (5000ms)
      await new Promise(resolve => setTimeout(resolve, 5100));
      
      expect(cacheManager.get('default-ttl')).toBeNull();
    }, 10000);

    it('should handle different TTLs for different entries', async () => {
      cacheManager.set('short-ttl', 'data1', 50);
      cacheManager.set('long-ttl', 'data2', 200);
      
      // Wait for short TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cacheManager.get('short-ttl')).toBeNull();
      expect(cacheManager.get('long-ttl')).toBe('data2');
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used items when full', () => {
      // Fill cache to max size (5) with small delays to ensure different timestamps
      for (let i = 1; i <= 5; i++) {
        cacheManager.set(`key${i}`, `data${i}`);
        // Small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() - start < 2) { /* wait */ }
      }
      
      expect(cacheManager.size()).toBe(5);
      
      // Access key2 to make it more recently used
      cacheManager.get('key2');
      
      // Add one more item, should evict key1 (least recently used)
      cacheManager.set('key6', 'data6');
      
      expect(cacheManager.size()).toBe(5);
      expect(cacheManager.has('key1')).toBe(false); // Evicted
      expect(cacheManager.has('key2')).toBe(true);  // Still there due to recent access
      expect(cacheManager.has('key6')).toBe(true);  // Newly added
    });

    it('should update access time on get', () => {
      // Fill cache with delays to ensure different timestamps
      for (let i = 1; i <= 5; i++) {
        cacheManager.set(`key${i}`, `data${i}`);
        // Small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() - start < 2) { /* wait */ }
      }
      
      // Make key1 most recently accessed
      cacheManager.get('key1');
      
      // Add new item, key2 should be evicted (now least recently used)
      cacheManager.set('key6', 'data6');
      
      expect(cacheManager.has('key1')).toBe(true);  // Should still be there
      expect(cacheManager.has('key2')).toBe(false); // Should be evicted
    });
  });

  describe('key generation', () => {
    it('should generate consistent keys for same operation and params', () => {
      const key1 = cacheManager.generateKey('getTasks', { projectId: '123' });
      const key2 = cacheManager.generateKey('getTasks', { projectId: '123' });
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different operations', () => {
      const key1 = cacheManager.generateKey('getTasks', { projectId: '123' });
      const key2 = cacheManager.generateKey('getProjects', { projectId: '123' });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different params', () => {
      const key1 = cacheManager.generateKey('getTasks', { projectId: '123' });
      const key2 = cacheManager.generateKey('getTasks', { projectId: '456' });
      
      expect(key1).not.toBe(key2);
    });

    it('should handle params object order consistently', () => {
      const key1 = cacheManager.generateKey('getTasks', { a: '1', b: '2' });
      const key2 = cacheManager.generateKey('getTasks', { b: '2', a: '1' });
      
      expect(key1).toBe(key2);
    });
  });

  describe('pattern-based invalidation', () => {
    beforeEach(() => {
      cacheManager.set('getAllTasks:hash1', 'all tasks');
      cacheManager.set('getTaskById:hash2', 'single task');
      cacheManager.set('searchTasks:hash3', 'search results');
      cacheManager.set('getAllProjects:hash4', 'all projects');
      cacheManager.set('getProjectById:hash5', 'single project');
    });

    it('should invalidate by string pattern', () => {
      const deletedCount = cacheManager.invalidateByPattern('Task');
      
      expect(deletedCount).toBe(3); // getAllTasks, getTaskById, searchTasks
      expect(cacheManager.has('getAllTasks:hash1')).toBe(false);
      expect(cacheManager.has('getTaskById:hash2')).toBe(false);
      expect(cacheManager.has('searchTasks:hash3')).toBe(false);
      expect(cacheManager.has('getAllProjects:hash4')).toBe(true);
      expect(cacheManager.has('getProjectById:hash5')).toBe(true);
    });

    it('should invalidate by regex pattern', () => {
      const deletedCount = cacheManager.invalidateByPattern(/^get.*Task/);
      
      expect(deletedCount).toBe(2); // getAllTasks, getTaskById
      expect(cacheManager.has('getAllTasks:hash1')).toBe(false);
      expect(cacheManager.has('getTaskById:hash2')).toBe(false);
      expect(cacheManager.has('searchTasks:hash3')).toBe(true);
    });

    it('should invalidate task cache', () => {
      const deletedCount = cacheManager.invalidateTaskCache();
      
      expect(deletedCount).toBe(3);
      expect(cacheManager.has('getAllProjects:hash4')).toBe(true);
      expect(cacheManager.has('getProjectById:hash5')).toBe(true);
    });

    it('should invalidate project cache', () => {
      const deletedCount = cacheManager.invalidateProjectCache();
      
      expect(deletedCount).toBe(2);
      expect(cacheManager.has('getAllTasks:hash1')).toBe(true);
      expect(cacheManager.has('getTaskById:hash2')).toBe(true);
      expect(cacheManager.has('searchTasks:hash3')).toBe(true);
    });

    it('should invalidate all cache', () => {
      expect(cacheManager.size()).toBe(5);
      
      cacheManager.invalidateAll();
      
      expect(cacheManager.size()).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      cacheManager.set('key1', 'data1');
      
      // Hit
      cacheManager.get('key1');
      
      // Miss
      cacheManager.get('key2');
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track evictions', () => {
      // Fill cache beyond capacity with delays
      for (let i = 1; i <= 7; i++) {
        cacheManager.set(`key${i}`, `data${i}`);
        // Small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() - start < 1) { /* wait */ }
      }
      
      const stats = cacheManager.getStats();
      expect(stats.evictions).toBe(2); // 7 - 5 = 2 evictions
      expect(stats.size).toBe(5);
      expect(stats.maxSize).toBe(5);
    });

    it('should calculate hit rate correctly', () => {
      cacheManager.set('key1', 'data1');
      
      // 3 hits, 2 misses = 60% hit rate
      cacheManager.get('key1'); // hit
      cacheManager.get('key1'); // hit  
      cacheManager.get('key1'); // hit
      cacheManager.get('key2'); // miss
      cacheManager.get('key3'); // miss
      
      const stats = cacheManager.getStats();
      expect(stats.hitRate).toBe(0.6);
    });
  });

  describe('cleanup timer', () => {
    it('should automatically clean up expired entries', async () => {
      // Create cache with shorter cleanup interval
      const testCache = new CacheManager({
        maxSize: 10,
        defaultTTL: 100, // 100ms
        cleanupInterval: 150, // 150ms cleanup
        enableStats: true
      });
      
      testCache.set('expire-soon', 'data', 50); // 50ms TTL
      expect(testCache.size()).toBe(1);
      
      // Wait for expiration and cleanup
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(testCache.size()).toBe(0);
      testCache.destroy();
    });
  });

  describe('singleton pattern', () => {
    afterEach(() => {
      destroyCacheManager();
    });

    it('should return same instance', () => {
      const instance1 = getCacheManager();
      const instance2 = getCacheManager();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after destroy', () => {
      const instance1 = getCacheManager();
      destroyCacheManager();
      const instance2 = getCacheManager();
      
      expect(instance1).not.toBe(instance2);
    });
  });
});
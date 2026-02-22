/**
 * LRU Cache for agent results to avoid redundant API calls
 */

export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    hits: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

export class AgentCache<T = any> {
    private cache: Map<string, CacheEntry<T>>;
    private maxSize: number;
    private ttlMs: number;
    private hits: number = 0;
    private misses: number = 0;

    constructor(maxSize: number = 100, ttlMs: number = 5 * 60 * 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    /**
     * Generate cache key from diagram or request
     */
    generateKey(...parts: any[]): string {
        return JSON.stringify(parts);
    }

    /**
     * Get value from cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        const age = Date.now() - entry.timestamp;
        if (age > this.ttlMs) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        entry.hits++;
        this.hits++;
        return entry.value;
    }

    /**
     * Set value in cache
     */
    set(key: string, value: T): void {
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            hits: 0,
        });
    }

    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        const age = Date.now() - entry.timestamp;
        if (age > this.ttlMs) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Invalidate cache entry
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            size: this.cache.size,
            hitRate: total > 0 ? this.hits / total : 0,
        };
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        let lruKey: string | null = null;
        let lruTimestamp = Infinity;
        let lruHits = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.hits < lruHits || (entry.hits === lruHits && entry.timestamp < lruTimestamp)) {
                lruKey = key;
                lruTimestamp = entry.timestamp;
                lruHits = entry.hits;
            }
        }

        if (lruKey) {
            this.cache.delete(lruKey);
        }
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttlMs) {
                this.cache.delete(key);
            }
        }
    }
}

/**
 * Caching system for agent results with TTL support
 */

export interface CacheEntry<T> {
    value: T;
    expiresAt: number;
    createdAt: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

export class AgentCache<T = any> {
    private cache: Map<string, CacheEntry<T>> = new Map();
    private stats = {
        hits: 0,
        misses: 0,
    };

    constructor(private defaultTTL: number = 300000) {}

    set(key: string, value: T, ttl?: number): void {
        const now = Date.now();
        this.cache.set(key, {
            value,
            expiresAt: now + (ttl ?? this.defaultTTL),
            createdAt: now,
        });
    }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return undefined;
        }

        const now = Date.now();
        if (now > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return undefined;
        }

        this.stats.hits++;
        return entry.value;
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        const now = Date.now();
        if (now > entry.expiresAt) {
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
        this.stats.hits = 0;
        this.stats.misses = 0;
    }

    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            hitRate: total > 0 ? this.stats.hits / total : 0,
        };
    }

    cleanExpired(): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        return cleaned;
    }

    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    size(): number {
        return this.cache.size;
    }
}

export function generateCacheKey(...parts: (string | number | boolean | object)[]): string {
    return parts
        .map(part => {
            if (typeof part === 'object') {
                return JSON.stringify(part);
            }
            return String(part);
        })
        .join(':');
}

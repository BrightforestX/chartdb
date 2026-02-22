/**
 * Tests for caching system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentCache, generateCacheKey } from '../utils/cache.js';

describe('AgentCache', () => {
    let cache: AgentCache<string>;

    beforeEach(() => {
        cache = new AgentCache<string>(1000);
    });

    describe('Basic Operations', () => {
        it('should store and retrieve values', () => {
            cache.set('key1', 'value1');
            
            expect(cache.get('key1')).toBe('value1');
        });

        it('should return undefined for missing keys', () => {
            expect(cache.get('nonexistent')).toBeUndefined();
        });

        it('should check if key exists', () => {
            cache.set('key1', 'value1');
            
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false);
        });

        it('should delete entries', () => {
            cache.set('key1', 'value1');
            
            expect(cache.delete('key1')).toBe(true);
            expect(cache.has('key1')).toBe(false);
            expect(cache.delete('key1')).toBe(false);
        });

        it('should clear all entries', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            cache.clear();
            
            expect(cache.size()).toBe(0);
            expect(cache.get('key1')).toBeUndefined();
        });
    });

    describe('TTL Management', () => {
        it('should expire entries after TTL', async () => {
            cache.set('key1', 'value1', 100);
            
            expect(cache.get('key1')).toBe('value1');
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            expect(cache.get('key1')).toBeUndefined();
        });

        it('should use default TTL when not specified', () => {
            cache.set('key1', 'value1');
            
            expect(cache.has('key1')).toBe(true);
        });

        it('should clean expired entries', async () => {
            cache.set('key1', 'value1', 100);
            cache.set('key2', 'value2', 1000);
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const cleaned = cache.cleanExpired();
            
            expect(cleaned).toBe(1);
            expect(cache.size()).toBe(1);
            expect(cache.has('key2')).toBe(true);
        });
    });

    describe('Statistics', () => {
        it('should track cache hits and misses', () => {
            cache.set('key1', 'value1');
            
            cache.get('key1');
            cache.get('key1');
            cache.get('key2');
            
            const stats = cache.getStats();
            
            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
            expect(stats.hitRate).toBeCloseTo(0.667, 2);
        });

        it('should calculate hit rate correctly', () => {
            cache.set('key1', 'value1');
            
            for (let i = 0; i < 10; i++) {
                cache.get('key1');
            }
            cache.get('key2');
            
            const stats = cache.getStats();
            
            expect(stats.hitRate).toBeCloseTo(0.909, 2);
        });

        it('should report cache size', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            
            const stats = cache.getStats();
            
            expect(stats.size).toBe(3);
        });

        it('should handle zero operations gracefully', () => {
            const stats = cache.getStats();
            
            expect(stats.hitRate).toBe(0);
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });
    });

    describe('Cache Keys', () => {
        it('should list all cache keys', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            const keys = cache.keys();
            
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys.length).toBe(2);
        });
    });
});

describe('generateCacheKey', () => {
    it('should generate consistent keys from strings', () => {
        const key1 = generateCacheKey('agent', 'operation', 'param');
        const key2 = generateCacheKey('agent', 'operation', 'param');
        
        expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
        const key1 = generateCacheKey('agent1', 'op1');
        const key2 = generateCacheKey('agent2', 'op2');
        
        expect(key1).not.toBe(key2);
    });

    it('should handle objects in key generation', () => {
        const obj = { id: 1, name: 'test' };
        const key = generateCacheKey('agent', obj);
        
        expect(key).toContain('agent');
        expect(key).toContain('"id":1');
    });

    it('should handle mixed types', () => {
        const key = generateCacheKey('agent', 123, true, { nested: 'value' });
        
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
    });
});

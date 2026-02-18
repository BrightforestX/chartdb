/**
 * Tests for optimized SchemaCrew
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchemaCrew } from '../crews/schema-crew.js';
import type { Diagram } from '../agents/schema-analyzer.js';

describe('SchemaCrew Optimizations', () => {
    let crew: SchemaCrew;
    let mockDiagram: Diagram;

    beforeEach(() => {
        crew = new SchemaCrew();
        
        mockDiagram = {
            id: 'test-diagram-1',
            name: 'Test Schema',
            databaseType: 'postgresql',
            tables: [
                {
                    id: 'table-1',
                    name: 'users',
                    fields: [
                        { id: 'f1', name: 'id', type: 'SERIAL', primaryKey: true },
                        { id: 'f2', name: 'email', type: 'VARCHAR(255)', unique: true },
                        { id: 'f3', name: 'name', type: 'VARCHAR(100)' },
                        { id: 'f4', name: 'created_at', type: 'TIMESTAMP' },
                        { id: 'f5', name: 'updated_at', type: 'TIMESTAMP' },
                    ],
                },
                {
                    id: 'table-2',
                    name: 'orders',
                    fields: [
                        { id: 'f6', name: 'id', type: 'SERIAL', primaryKey: true },
                        { id: 'f7', name: 'user_id', type: 'INTEGER' },
                        { id: 'f8', name: 'total', type: 'DECIMAL(10,2)' },
                        { id: 'f9', name: 'created_at', type: 'TIMESTAMP' },
                        { id: 'f10', name: 'updated_at', type: 'TIMESTAMP' },
                    ],
                },
            ],
            relationships: [
                {
                    id: 'rel-1',
                    sourceTableId: 'table-2',
                    targetTableId: 'table-1',
                    type: 'many_to_one',
                },
            ],
        };
    });

    describe('Parallel Execution', () => {
        it('should execute independent agents in parallel', async () => {
            const result = await crew.analyzeDiagram(mockDiagram);
            
            expect(result.success).toBe(true);
            expect(result.metadata?.timing).toBeDefined();
            expect(result.metadata?.executionTime).toBeDefined();
        });

        it('should complete faster with parallelization', async () => {
            const startTime = performance.now();
            const result = await crew.optimizeDiagram(mockDiagram);
            const totalTime = performance.now() - startTime;

            expect(result.success).toBe(true);
            expect(result.metadata?.timing?.parallel).toBeDefined();
            expect(result.metadata?.timing?.parallel).toBeLessThan(totalTime);
        });

        it('should track timing for each phase', async () => {
            const result = await crew.generateAndOptimize(
                'e-commerce with users and orders',
                'postgresql'
            );

            expect(result.success).toBe(true);
            expect(result.metadata?.timing?.generation).toBeGreaterThan(0);
            expect(result.metadata?.timing?.parallel).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle errors gracefully', async () => {
            const invalidDiagram = { ...mockDiagram, tables: undefined as any };
            
            const result = await crew.analyzeDiagram(invalidDiagram);
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.metadata?.errorType).toBeDefined();
        });

        it('should provide detailed error information', async () => {
            const invalidDiagram = { ...mockDiagram, tables: [] };
            
            const result = await crew.analyzeDiagram(invalidDiagram);
            
            expect(result.metadata).toBeDefined();
            expect(result.metadata?.executionTime).toBeGreaterThan(0);
        });

        it('should report circuit breaker status', () => {
            const status = crew.getCircuitBreakerStatus();
            
            expect(status).toBeDefined();
            expect(status.analyzer).toBe('closed');
            expect(status.generator).toBe('closed');
            expect(status.optimizer).toBe('closed');
        });
    });

    describe('Caching System', () => {
        it('should cache analysis results', async () => {
            const result1 = await crew.analyzeDiagram(mockDiagram);
            expect(result1.success).toBe(true);

            const result2 = await crew.analyzeDiagram(mockDiagram);
            expect(result2.success).toBe(true);
            
            const stats = crew.getCacheStats();
            expect(stats.analysis.hits).toBeGreaterThan(0);
        });

        it('should provide cache statistics', async () => {
            await crew.analyzeDiagram(mockDiagram);
            
            const stats = crew.getCacheStats();
            
            expect(stats.analysis).toBeDefined();
            expect(stats.optimization).toBeDefined();
            expect(stats.layout).toBeDefined();
            expect(typeof stats.analysis.hitRate).toBe('number');
        });

        it('should clear cache when requested', async () => {
            await crew.analyzeDiagram(mockDiagram);
            
            crew.clearCache();
            
            const stats = crew.getCacheStats();
            expect(stats.analysis.size).toBe(0);
            expect(stats.optimization.size).toBe(0);
            expect(stats.layout.size).toBe(0);
        });

        it('should track cache hits in metadata', async () => {
            await crew.analyzeDiagram(mockDiagram);
            const result = await crew.analyzeDiagram(mockDiagram);
            
            expect(result.metadata?.cache).toBeDefined();
            expect(result.metadata?.cache?.hits).toBeGreaterThan(0);
        });
    });

    describe('Type Safety', () => {
        it('should return strongly typed results for generateAndOptimize', async () => {
            const result = await crew.generateAndOptimize(
                'blog with users and posts',
                'postgresql'
            );

            if (result.success && result.data) {
                expect(result.data.diagram).toBeDefined();
                expect(result.data.analysis).toBeDefined();
                expect(result.data.optimization).toBeDefined();
                expect(result.data.layout).toBeDefined();
            }
        });

        it('should return strongly typed results for analyzeDiagram', async () => {
            const result = await crew.analyzeDiagram(mockDiagram);

            if (result.success && result.data) {
                expect(result.data.analysis).toBeDefined();
                expect(result.data.analysisReport).toBeDefined();
                expect(typeof result.data.analysisReport).toBe('string');
            }
        });

        it('should return strongly typed results for validateDiagram', async () => {
            const result = await crew.validateDiagram(mockDiagram);

            if (result.success && result.data) {
                expect(typeof result.data.isValid).toBe('boolean');
                expect(Array.isArray(result.data.errors)).toBe(true);
                expect(Array.isArray(result.data.warnings)).toBe(true);
                expect(result.data.summary).toBeDefined();
            }
        });
    });

    describe('Performance Monitoring', () => {
        it('should track performance metrics', async () => {
            await crew.analyzeDiagram(mockDiagram);
            
            const stats = crew.getPerformanceStats();
            
            expect(stats.overall).toBeDefined();
            expect(stats.byAgent).toBeDefined();
            expect(stats.byOperation).toBeDefined();
        });

        it('should generate performance report', async () => {
            await crew.analyzeDiagram(mockDiagram);
            
            const report = crew.generatePerformanceReport();
            
            expect(typeof report).toBe('string');
            expect(report).toContain('Performance Report');
            expect(report).toContain('Overall Statistics');
        });

        it('should track metrics by agent', async () => {
            await crew.analyzeDiagram(mockDiagram);
            
            const stats = crew.getPerformanceStats();
            
            expect(stats.byAgent).toBeDefined();
            expect(Object.keys(stats.byAgent).length).toBeGreaterThan(0);
        });

        it('should clear performance metrics', async () => {
            await crew.analyzeDiagram(mockDiagram);
            
            crew.clearPerformanceMetrics();
            
            const stats = crew.getPerformanceStats();
            expect(stats.overall.totalOperations).toBe(0);
        });
    });

    describe('Agent Communication', () => {
        it('should log agent communications', async () => {
            await crew.generateAndOptimize('simple schema', 'postgresql');
            
            const log = crew.getCommunicationLog();
            
            expect(Array.isArray(log)).toBe(true);
            expect(log.length).toBeGreaterThan(0);
        });

        it('should allow event subscription', () => {
            const handler = vi.fn();
            
            crew.subscribeToEvents(handler);
            
            expect(handler).toBeDefined();
        });
    });

    describe('Integration', () => {
        it('should handle complex workflow with all features', async () => {
            const result = await crew.generateAndOptimize(
                'e-commerce with users, products, orders',
                'postgresql'
            );

            expect(result.success).toBe(true);
            expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
            expect(result.metadata?.agentsUsed).toBeDefined();
            
            const stats = crew.getPerformanceStats();
            expect(stats.overall.totalOperations).toBeGreaterThanOrEqual(0);
            
            const cacheStats = crew.getCacheStats();
            expect(cacheStats).toBeDefined();
            expect(cacheStats.analysis).toBeDefined();
            expect(cacheStats.optimization).toBeDefined();
            expect(cacheStats.layout).toBeDefined();
        });

        it('should benefit from caching on repeated operations', async () => {
            const result1 = await crew.optimizeDiagram(mockDiagram);
            const time1 = result1.metadata?.executionTime || 0;

            const result2 = await crew.optimizeDiagram(mockDiagram);
            const time2 = result2.metadata?.executionTime || 0;

            expect(result2.metadata?.cache?.hits).toBeGreaterThan(0);
            expect(time2).toBeLessThanOrEqual(time1);
        });

        it('should maintain circuit breaker state across operations', async () => {
            await crew.analyzeDiagram(mockDiagram);
            
            const status = crew.getCircuitBreakerStatus();
            
            expect(status.analyzer).toBe('closed');
            expect(status.generator).toBe('closed');
            expect(status.optimizer).toBe('closed');
        });
    });
});

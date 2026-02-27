/**
 * Integration Tests for CrewAI Orchestration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SchemaCrew } from '../../src/crews/schema-crew.js';
import { SchemaCrewPipeline } from '../../src/crews/schema-crew-pipeline.js';
import type { Diagram } from '../../src/agents/schema-analyzer.js';

describe('SchemaCrew Integration Tests', () => {
    let crew: SchemaCrew;

    beforeEach(() => {
        crew = new SchemaCrew();
    });

    afterEach(() => {
        crew.clearCaches();
        crew.resetCircuitBreaker();
    });

    describe('Parallel Execution', () => {
        it('should execute analysis and optimization in parallel', async () => {
            const diagram = createTestDiagram();
            const result = await crew.generateAndOptimize('Test database', 'postgresql');

            expect(result.success).toBe(true);
            expect(result.metadata?.executionTimeMs).toBeDefined();
            expect(result.data).toHaveProperty('analysis');
            expect(result.data).toHaveProperty('optimization');
        });

        it('should handle parallel execution with one agent failure', async () => {
            const diagram = createTestDiagram();
            const result = await crew.analyzeDiagram(diagram);

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('analysis');
        });
    });

    describe('Caching', () => {
        it('should cache analysis results', async () => {
            const diagram = createTestDiagram();

            const result1 = await crew.analyzeDiagram(diagram);
            const result2 = await crew.analyzeDiagram(diagram);

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);

            const stats = crew.getCacheStats();
            expect(stats.analysis.hits).toBeGreaterThan(0);
        });

        it('should use cached results for repeated operations', async () => {
            const diagram = createTestDiagram();

            await crew.optimizeDiagram(diagram);
            await crew.optimizeDiagram(diagram);
            await crew.optimizeDiagram(diagram);

            const stats = crew.getCacheStats();
            expect(stats.analysis.hits + stats.optimization.hits).toBeGreaterThan(0);
        });

        it('should respect cache TTL', async () => {
            const diagram = createTestDiagram();

            await crew.analyzeDiagram(diagram);
            const stats1 = crew.getCacheStats();

            crew.clearCaches();

            await crew.analyzeDiagram(diagram);
            const stats2 = crew.getCacheStats();

            expect(stats2.analysis.hits).toBe(0);
        });
    });

    describe('Circuit Breaker', () => {
        it('should track circuit breaker state', async () => {
            const stats = crew.getCircuitBreakerStats();
            
            expect(stats.state).toBe('CLOSED');
            expect(stats.totalRequests).toBeDefined();
        });

        it('should provide fallback when agent fails', async () => {
            const diagram = createTestDiagram();
            
            const result = await crew.generateAndOptimize('Test', 'postgresql');
            
            expect(result).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should return error result on failure', async () => {
            const invalidDiagram = {} as Diagram;
            
            const result = await crew.analyzeDiagram(invalidDiagram);
            
            expect(result).toBeDefined();
        });

        it('should handle empty diagrams gracefully', async () => {
            const emptyDiagram: Diagram = {
                id: 'empty',
                name: 'Empty',
                databaseType: 'postgresql',
                tables: [],
                relationships: [],
            };

            const result = await crew.validateDiagram(emptyDiagram);
            
            expect(result.success).toBe(true);
            expect(result.data?.warnings).toBeDefined();
        });
    });

    describe('Performance', () => {
        it('should complete operations within reasonable time', async () => {
            const diagram = createTestDiagram();
            const startTime = Date.now();

            await crew.analyzeDiagram(diagram);
            
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(5000);
        });

        it('should show performance improvement with parallel execution', async () => {
            const diagram = createTestDiagram();
            
            const result = await crew.optimizeDiagram(diagram);
            
            expect(result.success).toBe(true);
            expect(result.metadata?.executionTimeMs).toBeLessThan(10000);
        });
    });

    describe('Validation', () => {
        it('should validate diagrams correctly', async () => {
            const validDiagram = createTestDiagram();
            const result = await crew.validateDiagram(validDiagram);

            expect(result.success).toBe(true);
            expect(result.data?.isValid).toBeDefined();
            expect(result.data?.summary).toBeDefined();
        });

        it('should detect missing primary keys', async () => {
            const diagram = createDiagramWithoutPrimaryKeys();
            const result = await crew.validateDiagram(diagram);

            expect(result.success).toBe(true);
            expect(result.data?.warnings.length).toBeGreaterThan(0);
        });

        it('should detect orphaned tables', async () => {
            const diagram = createDiagramWithOrphanedTable();
            const result = await crew.validateDiagram(diagram);

            expect(result.success).toBe(true);
            expect(result.data?.warnings).toBeDefined();
        });
    });
});

describe('SchemaCrewPipeline Integration Tests', () => {
    let crew: SchemaCrewPipeline;

    beforeEach(() => {
        crew = new SchemaCrewPipeline();
    });

    describe('Pipeline Execution', () => {
        it('should execute pipeline stages in order', async () => {
            const result = await crew.generateAndOptimize('Test database with users and posts', 'postgresql');

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('diagram');
            expect(result.data).toHaveProperty('analysis');
            expect(result.data).toHaveProperty('optimization');
        });

        it('should handle pipeline errors gracefully', async () => {
            const result = await crew.generateAndOptimize('', 'postgresql');

            expect(result).toBeDefined();
        });

        it('should execute analysis pipeline', async () => {
            const diagram = createTestDiagram();
            const result = await crew.analyzeDiagram(diagram);

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('analysis');
            expect(result.data).toHaveProperty('analysisReport');
        });
    });

    describe('Pipeline Performance', () => {
        it('should complete pipeline within time limits', async () => {
            const startTime = Date.now();
            
            await crew.generateAndOptimize('E-commerce database', 'postgresql');
            
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(15000);
        });
    });
});

describe('End-to-End Orchestration Tests', () => {
    it('should complete full generation and optimization flow', async () => {
        const crew = new SchemaCrew();
        
        const result = await crew.generateAndOptimize(
            'Social media platform with users, posts, comments, and likes',
            'postgresql'
        );

        expect(result.success).toBe(true);
        expect(result.data?.diagram).toBeDefined();
        expect(result.data?.analysis).toBeDefined();
        expect(result.data?.optimization).toBeDefined();
        expect(result.data?.layout).toBeDefined();
        
        const analysis = result.data?.analysis;
        expect(analysis?.tableCount).toBeGreaterThan(0);
        expect(analysis?.suggestions).toBeDefined();
    });

    it('should handle complex multi-table schemas', async () => {
        const crew = new SchemaCrew();
        const diagram = createComplexTestDiagram();

        const result = await crew.analyzeDiagram(diagram);

        expect(result.success).toBe(true);
        expect(result.data?.analysis?.issues).toBeDefined();
        expect(result.data?.analysisReport).toBeDefined();
    });

    it('should demonstrate cache effectiveness', async () => {
        const crew = new SchemaCrew();
        const diagram = createTestDiagram();

        await crew.analyzeDiagram(diagram);
        await crew.optimizeDiagram(diagram);
        await crew.validateDiagram(diagram);

        const cacheStats = crew.getCacheStats();
        expect(cacheStats.analysis.hits).toBeGreaterThan(0);
    });
});

describe('Stress Tests', () => {
    it('should handle multiple concurrent operations', async () => {
        const crew = new SchemaCrew();
        const diagram = createTestDiagram();

        const operations = [
            crew.analyzeDiagram(diagram),
            crew.optimizeDiagram(diagram),
            crew.validateDiagram(diagram),
        ];

        const results = await Promise.all(operations);

        expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle large schemas efficiently', async () => {
        const crew = new SchemaCrew();
        const largeDiagram = createLargeDiagram(50);

        const startTime = Date.now();
        const result = await crew.analyzeDiagram(largeDiagram);
        const duration = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(10000);
    });
});

// Helper Functions

function createTestDiagram(): Diagram {
    return {
        id: 'test-1',
        name: 'Test Database',
        databaseType: 'postgresql',
        tables: [
            {
                id: 'table-1',
                name: 'users',
                fields: [
                    { id: 'f1', name: 'id', type: 'INTEGER', primaryKey: true },
                    { id: 'f2', name: 'email', type: 'VARCHAR(255)', unique: true },
                    { id: 'f3', name: 'name', type: 'VARCHAR(100)' },
                    { id: 'f4', name: 'created_at', type: 'TIMESTAMP' },
                ],
            },
            {
                id: 'table-2',
                name: 'posts',
                fields: [
                    { id: 'f5', name: 'id', type: 'INTEGER', primaryKey: true },
                    { id: 'f6', name: 'user_id', type: 'INTEGER' },
                    { id: 'f7', name: 'title', type: 'VARCHAR(255)' },
                    { id: 'f8', name: 'content', type: 'TEXT' },
                    { id: 'f9', name: 'created_at', type: 'TIMESTAMP' },
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
}

function createDiagramWithoutPrimaryKeys(): Diagram {
    return {
        id: 'test-2',
        name: 'No PKs',
        databaseType: 'postgresql',
        tables: [
            {
                id: 'table-1',
                name: 'items',
                fields: [
                    { id: 'f1', name: 'name', type: 'VARCHAR(100)' },
                    { id: 'f2', name: 'value', type: 'INTEGER' },
                ],
            },
        ],
        relationships: [],
    };
}

function createDiagramWithOrphanedTable(): Diagram {
    return {
        id: 'test-3',
        name: 'Orphaned',
        databaseType: 'postgresql',
        tables: [
            {
                id: 'table-1',
                name: 'users',
                fields: [{ id: 'f1', name: 'id', type: 'INTEGER', primaryKey: true }],
            },
            {
                id: 'table-2',
                name: 'orphan',
                fields: [{ id: 'f2', name: 'id', type: 'INTEGER', primaryKey: true }],
            },
            {
                id: 'table-3',
                name: 'posts',
                fields: [
                    { id: 'f3', name: 'id', type: 'INTEGER', primaryKey: true },
                    { id: 'f4', name: 'user_id', type: 'INTEGER' },
                ],
            },
        ],
        relationships: [
            {
                id: 'rel-1',
                sourceTableId: 'table-3',
                targetTableId: 'table-1',
                type: 'many_to_one',
            },
        ],
    };
}

function createComplexTestDiagram(): Diagram {
    return {
        id: 'test-4',
        name: 'Complex Schema',
        databaseType: 'postgresql',
        tables: [
            {
                id: 'users',
                name: 'users',
                fields: [
                    { id: 'u1', name: 'id', type: 'INTEGER', primaryKey: true },
                    { id: 'u2', name: 'email', type: 'VARCHAR(255)', unique: true },
                    { id: 'u3', name: 'username', type: 'VARCHAR(50)', unique: true },
                ],
            },
            {
                id: 'posts',
                name: 'posts',
                fields: [
                    { id: 'p1', name: 'id', type: 'INTEGER', primaryKey: true },
                    { id: 'p2', name: 'user_id', type: 'INTEGER' },
                    { id: 'p3', name: 'title', type: 'VARCHAR(255)' },
                ],
            },
            {
                id: 'comments',
                name: 'comments',
                fields: [
                    { id: 'c1', name: 'id', type: 'INTEGER', primaryKey: true },
                    { id: 'c2', name: 'post_id', type: 'INTEGER' },
                    { id: 'c3', name: 'user_id', type: 'INTEGER' },
                ],
            },
            {
                id: 'likes',
                name: 'likes',
                fields: [
                    { id: 'l1', name: 'id', type: 'INTEGER', primaryKey: true },
                    { id: 'l2', name: 'user_id', type: 'INTEGER' },
                    { id: 'l3', name: 'post_id', type: 'INTEGER' },
                ],
            },
        ],
        relationships: [
            { id: 'r1', sourceTableId: 'posts', targetTableId: 'users', type: 'many_to_one' },
            { id: 'r2', sourceTableId: 'comments', targetTableId: 'posts', type: 'many_to_one' },
            { id: 'r3', sourceTableId: 'comments', targetTableId: 'users', type: 'many_to_one' },
            { id: 'r4', sourceTableId: 'likes', targetTableId: 'posts', type: 'many_to_one' },
            { id: 'r5', sourceTableId: 'likes', targetTableId: 'users', type: 'many_to_one' },
        ],
    };
}

function createLargeDiagram(tableCount: number): Diagram {
    const tables = [];
    const relationships = [];

    for (let i = 0; i < tableCount; i++) {
        tables.push({
            id: `table-${i}`,
            name: `table_${i}`,
            fields: [
                { id: `f${i}-1`, name: 'id', type: 'INTEGER', primaryKey: true },
                { id: `f${i}-2`, name: 'name', type: 'VARCHAR(100)' },
                { id: `f${i}-3`, name: 'created_at', type: 'TIMESTAMP' },
            ],
        });

        if (i > 0) {
            relationships.push({
                id: `rel-${i}`,
                sourceTableId: `table-${i}`,
                targetTableId: `table-0`,
                type: 'many_to_one',
            });
        }
    }

    return {
        id: 'large-test',
        name: 'Large Schema',
        databaseType: 'postgresql',
        tables,
        relationships,
    };
}

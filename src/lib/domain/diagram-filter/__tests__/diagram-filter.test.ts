import { describe, it, expect } from 'vitest';
import {
    reduceFilter,
    spreadFilterTables,
    type DiagramFilter,
    type FilterTableInfo,
} from '../diagram-filter';

describe('diagram-filter', () => {
    describe('reduceFilter', () => {
        const createTables = (): FilterTableInfo[] => [
            { id: 'table-1', schemaId: 'schema-1', schema: 'public' },
            { id: 'table-2', schemaId: 'schema-1', schema: 'public' },
            { id: 'table-3', schemaId: 'schema-2', schema: 'admin' },
            { id: 'table-4', schemaId: 'schema-2', schema: 'admin' },
        ];

        it('should return undefined for both fields when no filters defined', () => {
            const filter: DiagramFilter = {};
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            expect(result.schemaIds).toBeUndefined();
            expect(result.tableIds).toBeUndefined();
        });

        it('should return empty tableIds array when provided', () => {
            const filter: DiagramFilter = { tableIds: [] };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            expect(result.schemaIds).toBeUndefined();
            expect(result.tableIds).toEqual([]);
        });

        it('should consolidate all tables from same schema into schemaIds', () => {
            const filter: DiagramFilter = {
                tableIds: ['table-1', 'table-2'], // All tables from schema-1
            };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            expect(result.schemaIds).toContain('schema-1');
            expect(result.tableIds).toBeUndefined();
        });

        it('should keep partial tables in tableIds when not all schema tables are selected', () => {
            const filter: DiagramFilter = {
                tableIds: ['table-1'], // Only one table from schema-1
            };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            expect(result.tableIds).toEqual(['table-1']);
        });

        it('should remove tableIds that belong to schemas in schemaIds', () => {
            const filter: DiagramFilter = {
                schemaIds: ['schema-1'],
                tableIds: ['table-1', 'table-3'], // table-1 is in schema-1
            };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            expect(result.schemaIds).toEqual(['schema-1']);
            expect(result.tableIds).toEqual(['table-3']);
        });

        it('should return undefined for both when all schemas are selected', () => {
            const filter: DiagramFilter = {
                schemaIds: ['schema-1', 'schema-2'],
            };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            expect(result.schemaIds).toBeUndefined();
            expect(result.tableIds).toBeUndefined();
        });

        it('should return undefined for both when all tables are selected', () => {
            const filter: DiagramFilter = {
                tableIds: ['table-1', 'table-2', 'table-3', 'table-4'],
            };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            expect(result.schemaIds).toBeUndefined();
            expect(result.tableIds).toBeUndefined();
        });

        it('should handle database without schemas', () => {
            const tablesNoSchema: FilterTableInfo[] = [
                { id: 'table-1' },
                { id: 'table-2' },
                { id: 'table-3' },
            ];

            const filter: DiagramFilter = {
                tableIds: ['table-1', 'table-2', 'table-3'],
            };

            const result = reduceFilter(filter, tablesNoSchema, {
                databaseWithSchemas: false,
            });

            expect(result.schemaIds).toBeUndefined();
            expect(result.tableIds).toBeUndefined();
        });

        it('should keep partial tables for database without schemas', () => {
            const tablesNoSchema: FilterTableInfo[] = [
                { id: 'table-1' },
                { id: 'table-2' },
                { id: 'table-3' },
            ];

            const filter: DiagramFilter = {
                tableIds: ['table-1', 'table-2'],
            };

            const result = reduceFilter(filter, tablesNoSchema, {
                databaseWithSchemas: false,
            });

            expect(result.schemaIds).toBeUndefined();
            expect(result.tableIds).toEqual(['table-1', 'table-2']);
        });

        it('should consolidate multiple complete schemas', () => {
            const filter: DiagramFilter = {
                tableIds: ['table-1', 'table-2', 'table-3', 'table-4'],
            };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            // All tables selected = everything visible
            expect(result.schemaIds).toBeUndefined();
            expect(result.tableIds).toBeUndefined();
        });

        it('should handle mixed schema and table selections', () => {
            const filter: DiagramFilter = {
                schemaIds: ['schema-1'],
                tableIds: ['table-1', 'table-2', 'table-3'], // table-3 is in schema-2
            };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            expect(result.schemaIds).toEqual(['schema-1']);
            expect(result.tableIds).toEqual(['table-3']);
        });

        it('should set tableIds to undefined when all become redundant', () => {
            const filter: DiagramFilter = {
                schemaIds: ['schema-1', 'schema-2'],
                tableIds: ['table-1', 'table-2'], // Both in schema-1 which is already selected
            };
            const tables = createTables();
            const result = reduceFilter(filter, tables, {
                databaseWithSchemas: true,
            });

            // All schemas selected = everything visible
            expect(result.schemaIds).toBeUndefined();
            expect(result.tableIds).toBeUndefined();
        });
    });

    describe('spreadFilterTables', () => {
        const createTables = (): FilterTableInfo[] => [
            { id: 'table-1', schemaId: 'schema-1', schema: 'public' },
            { id: 'table-2', schemaId: 'schema-1', schema: 'public' },
            { id: 'table-3', schemaId: 'schema-2', schema: 'admin' },
            { id: 'table-4', schemaId: 'schema-2', schema: 'admin' },
        ];

        it('should return all table IDs when no filters defined', () => {
            const filter: DiagramFilter = {};
            const tables = createTables();
            const result = spreadFilterTables(filter, tables);

            expect(result.tableIds).toHaveLength(4);
            expect(result.tableIds).toEqual(
                expect.arrayContaining([
                    'table-1',
                    'table-2',
                    'table-3',
                    'table-4',
                ])
            );
        });

        it('should return tableIds as-is when only tableIds is defined', () => {
            const filter: DiagramFilter = { tableIds: ['table-1', 'table-2'] };
            const tables = createTables();
            const result = spreadFilterTables(filter, tables);

            expect(result.tableIds).toEqual(['table-1', 'table-2']);
        });

        it('should expand schemaIds to all tables in those schemas', () => {
            const filter: DiagramFilter = { schemaIds: ['schema-1'] };
            const tables = createTables();
            const result = spreadFilterTables(filter, tables);

            expect(result.tableIds).toHaveLength(2);
            expect(result.tableIds).toEqual(
                expect.arrayContaining(['table-1', 'table-2'])
            );
        });

        it('should expand multiple schemaIds to all their tables', () => {
            const filter: DiagramFilter = {
                schemaIds: ['schema-1', 'schema-2'],
            };
            const tables = createTables();
            const result = spreadFilterTables(filter, tables);

            expect(result.tableIds).toHaveLength(4);
            expect(result.tableIds).toEqual(
                expect.arrayContaining([
                    'table-1',
                    'table-2',
                    'table-3',
                    'table-4',
                ])
            );
        });

        it('should combine tableIds and expanded schemaIds', () => {
            const filter: DiagramFilter = {
                schemaIds: ['schema-1'],
                tableIds: ['table-3'], // Add a table from schema-2
            };
            const tables = createTables();
            const result = spreadFilterTables(filter, tables);

            expect(result.tableIds).toHaveLength(3);
            expect(result.tableIds).toEqual(
                expect.arrayContaining(['table-1', 'table-2', 'table-3'])
            );
        });

        it('should return empty array when no tables match', () => {
            const filter: DiagramFilter = {
                schemaIds: ['non-existent-schema'],
            };
            const tables = createTables();
            const result = spreadFilterTables(filter, tables);

            expect(result.tableIds).toEqual([]);
        });

        it('should handle empty schemaIds', () => {
            const filter: DiagramFilter = {
                schemaIds: [],
                tableIds: ['table-1'],
            };
            const tables = createTables();
            const result = spreadFilterTables(filter, tables);

            expect(result.tableIds).toEqual(['table-1']);
        });

        it('should deduplicate table IDs', () => {
            const filter: DiagramFilter = {
                schemaIds: ['schema-1'],
                tableIds: ['table-1', 'table-2'], // Already in schema-1
            };
            const tables = createTables();
            const result = spreadFilterTables(filter, tables);

            expect(result.tableIds).toHaveLength(2);
            expect(new Set(result.tableIds).size).toBe(2); // No duplicates
        });

        it('should handle tables without schemaId', () => {
            const tablesNoSchema: FilterTableInfo[] = [
                { id: 'table-1' },
                { id: 'table-2' },
            ];

            const filter: DiagramFilter = {
                schemaIds: ['schema-1'],
                tableIds: ['table-1'],
            };

            const result = spreadFilterTables(filter, tablesNoSchema);

            expect(result.tableIds).toEqual(['table-1']);
        });
    });
});

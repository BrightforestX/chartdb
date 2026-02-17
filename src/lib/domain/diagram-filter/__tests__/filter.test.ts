import { describe, it, expect } from 'vitest';
import {
    filterTable,
    filterRelationship,
    filterDependency,
    applyFilterOnDiagram,
} from '../filter';
import type { DiagramFilter } from '../diagram-filter';
import type { Diagram } from '../../diagram';

describe('filter', () => {
    describe('filterTable', () => {
        it('should return true when no filter is provided', () => {
            const result = filterTable({
                table: { id: 'table-1', schema: 'public' },
            });

            expect(result).toBe(true);
        });

        it('should return true when filter has no tableIds or schemaIds', () => {
            const filter: DiagramFilter = {};
            const result = filterTable({
                table: { id: 'table-1', schema: 'public' },
                filter,
            });

            expect(result).toBe(true);
        });

        it('should return true when table id is in filter.tableIds', () => {
            const filter: DiagramFilter = { tableIds: ['table-1', 'table-2'] };
            const result = filterTable({
                table: { id: 'table-1', schema: 'public' },
                filter,
            });

            expect(result).toBe(true);
        });

        it('should return false when table id is not in filter.tableIds', () => {
            const filter: DiagramFilter = { tableIds: ['table-2', 'table-3'] };
            const result = filterTable({
                table: { id: 'table-1', schema: 'public' },
                filter,
            });

            expect(result).toBe(false);
        });

        it('should return true when table schema is in filter.schemaIds', () => {
            const filter: DiagramFilter = { schemaIds: ['public', 'admin'] };
            const result = filterTable({
                table: { id: 'table-1', schema: 'public' },
                filter,
            });

            expect(result).toBe(true);
        });

        it('should return false when table schema is not in filter.schemaIds', () => {
            const filter: DiagramFilter = { schemaIds: ['admin', 'test'] };
            const result = filterTable({
                table: { id: 'table-1', schema: 'public' },
                filter,
            });

            expect(result).toBe(false);
        });

        it('should use default schema when table schema is null', () => {
            const filter: DiagramFilter = { schemaIds: ['public'] };
            const result = filterTable({
                table: { id: 'table-1', schema: null },
                filter,
                options: { defaultSchema: 'public' },
            });

            expect(result).toBe(true);
        });

        it('should use default schema when table schema is undefined', () => {
            const filter: DiagramFilter = { schemaIds: ['public'] };
            const result = filterTable({
                table: { id: 'table-1' },
                filter,
                options: { defaultSchema: 'public' },
            });

            expect(result).toBe(true);
        });

        it('should handle both tableIds and schemaIds in filter (union logic)', () => {
            const filter: DiagramFilter = {
                tableIds: ['table-1'],
                schemaIds: ['admin'],
            };

            // Should match by tableId
            expect(
                filterTable({
                    table: { id: 'table-1', schema: 'public' },
                    filter,
                })
            ).toBe(true);

            // Should match by schemaId
            expect(
                filterTable({
                    table: { id: 'table-2', schema: 'admin' },
                    filter,
                })
            ).toBe(true);

            // Should not match
            expect(
                filterTable({
                    table: { id: 'table-3', schema: 'public' },
                    filter,
                })
            ).toBe(false);
        });
    });

    describe('filterRelationship', () => {
        it('should return true when no filter is provided', () => {
            const result = filterRelationship({
                tableA: { id: 'table-1', schema: 'public' },
                tableB: { id: 'table-2', schema: 'public' },
            });

            expect(result).toBe(true);
        });

        it('should return true when both tables are visible', () => {
            const filter: DiagramFilter = { tableIds: ['table-1', 'table-2'] };
            const result = filterRelationship({
                tableA: { id: 'table-1', schema: 'public' },
                tableB: { id: 'table-2', schema: 'public' },
                filter,
            });

            expect(result).toBe(true);
        });

        it('should return false when only one table is visible', () => {
            const filter: DiagramFilter = { tableIds: ['table-1'] };
            const result = filterRelationship({
                tableA: { id: 'table-1', schema: 'public' },
                tableB: { id: 'table-2', schema: 'public' },
                filter,
            });

            expect(result).toBe(false);
        });

        it('should return false when neither table is visible', () => {
            const filter: DiagramFilter = { tableIds: ['table-3'] };
            const result = filterRelationship({
                tableA: { id: 'table-1', schema: 'public' },
                tableB: { id: 'table-2', schema: 'public' },
                filter,
            });

            expect(result).toBe(false);
        });

        it('should work with schema filters', () => {
            const filter: DiagramFilter = { schemaIds: ['public'] };
            const result = filterRelationship({
                tableA: { id: 'table-1', schema: 'public' },
                tableB: { id: 'table-2', schema: 'public' },
                filter,
            });

            expect(result).toBe(true);
        });

        it('should return false when one table is in different schema', () => {
            const filter: DiagramFilter = { schemaIds: ['public'] };
            const result = filterRelationship({
                tableA: { id: 'table-1', schema: 'public' },
                tableB: { id: 'table-2', schema: 'admin' },
                filter,
            });

            expect(result).toBe(false);
        });

        it('should use default schema for tables without schema', () => {
            const filter: DiagramFilter = { schemaIds: ['public'] };
            const result = filterRelationship({
                tableA: { id: 'table-1' },
                tableB: { id: 'table-2' },
                filter,
                options: { defaultSchema: 'public' },
            });

            expect(result).toBe(true);
        });
    });

    describe('filterDependency', () => {
        it('should be the same as filterRelationship', () => {
            expect(filterDependency).toBe(filterRelationship);
        });

        it('should work the same as filterRelationship', () => {
            const filter: DiagramFilter = { tableIds: ['table-1', 'table-2'] };
            const result = filterDependency({
                tableA: { id: 'table-1', schema: 'public' },
                tableB: { id: 'table-2', schema: 'public' },
                filter,
            });

            expect(result).toBe(true);
        });
    });

    describe('applyFilterOnDiagram', () => {
        const createMockDiagram = (): Diagram => ({
            id: 'diagram-1',
            name: 'Test Diagram',
            databaseType: 'postgresql',
            tables: [
                {
                    id: 'table-1',
                    name: 'users',
                    schema: 'public',
                    fields: [],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#000000',
                    isView: false,
                    createdAt: 0,
                },
                {
                    id: 'table-2',
                    name: 'posts',
                    schema: 'public',
                    fields: [],
                    indexes: [],
                    x: 100,
                    y: 0,
                    color: '#000000',
                    isView: false,
                    createdAt: 0,
                },
                {
                    id: 'table-3',
                    name: 'comments',
                    schema: 'admin',
                    fields: [],
                    indexes: [],
                    x: 200,
                    y: 0,
                    color: '#000000',
                    isView: false,
                    createdAt: 0,
                },
            ],
            relationships: [
                {
                    id: 'rel-1',
                    name: 'fk_posts_users',
                    sourceTableId: 'table-2',
                    targetTableId: 'table-1',
                    sourceFieldId: 'field-1',
                    targetFieldId: 'field-2',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: 0,
                },
                {
                    id: 'rel-2',
                    name: 'fk_comments_posts',
                    sourceTableId: 'table-3',
                    targetTableId: 'table-2',
                    sourceFieldId: 'field-3',
                    targetFieldId: 'field-4',
                    sourceCardinality: 'many',
                    targetCardinality: 'one',
                    createdAt: 0,
                },
            ],
            dependencies: [
                {
                    id: 'dep-1',
                    tableId: 'table-2',
                    dependentTableId: 'table-1',
                },
            ],
            areas: [
                {
                    id: 'area-1',
                    name: 'Area 1',
                    x: 0,
                    y: 0,
                    width: 300,
                    height: 300,
                    color: '#FF0000',
                    isCollapsed: false,
                    showFieldTypes: true,
                },
            ],
            createdAt: 0,
            updatedAt: 0,
        });

        it('should filter tables by tableIds', () => {
            const diagram = createMockDiagram();
            const filter: DiagramFilter = { tableIds: ['table-1', 'table-2'] };
            const result = applyFilterOnDiagram({ diagram, filter });

            expect(result.tables).toHaveLength(2);
            expect(result.tables?.map((t) => t.id)).toEqual([
                'table-1',
                'table-2',
            ]);
        });

        it('should filter tables by schemaIds', () => {
            const diagram = createMockDiagram();
            const filter: DiagramFilter = { schemaIds: ['public'] };
            const result = applyFilterOnDiagram({ diagram, filter });

            expect(result.tables).toHaveLength(2);
            expect(result.tables?.map((t) => t.id)).toEqual([
                'table-1',
                'table-2',
            ]);
        });

        it('should filter relationships based on visible tables', () => {
            const diagram = createMockDiagram();
            const filter: DiagramFilter = { tableIds: ['table-1', 'table-2'] };
            const result = applyFilterOnDiagram({ diagram, filter });

            expect(result.relationships).toHaveLength(1);
            expect(result.relationships?.[0].id).toBe('rel-1');
        });

        it('should filter relationships when no tables match', () => {
            const diagram = createMockDiagram();
            const filter: DiagramFilter = { tableIds: [] };
            const result = applyFilterOnDiagram({ diagram, filter });

            expect(result.relationships).toHaveLength(0);
        });

        it('should filter dependencies based on visible tables', () => {
            const diagram = createMockDiagram();
            const filter: DiagramFilter = { tableIds: ['table-1', 'table-2'] };
            const result = applyFilterOnDiagram({ diagram, filter });

            expect(result.dependencies).toHaveLength(1);
            expect(result.dependencies?.[0].id).toBe('dep-1');
        });

        it('should filter areas based on visible tables', () => {
            const diagram = createMockDiagram();
            // Add parentAreaId to a table
            if (diagram.tables) {
                diagram.tables[0].parentAreaId = 'area-1';
            }

            const filter: DiagramFilter = { tableIds: ['table-1'] };
            const result = applyFilterOnDiagram({ diagram, filter });

            expect(result.areas).toHaveLength(1);
            expect(result.areas?.[0].id).toBe('area-1');
        });

        it('should remove areas when no tables belong to them', () => {
            const diagram = createMockDiagram();
            const filter: DiagramFilter = { tableIds: ['table-1'] };
            const result = applyFilterOnDiagram({ diagram, filter });

            expect(result.areas).toHaveLength(0);
        });

        it('should preserve all diagram properties', () => {
            const diagram = createMockDiagram();
            const filter: DiagramFilter = { tableIds: ['table-1'] };
            const result = applyFilterOnDiagram({ diagram, filter });

            expect(result.id).toBe(diagram.id);
            expect(result.name).toBe(diagram.name);
            expect(result.databaseType).toBe(diagram.databaseType);
            expect(result.createdAt).toBe(diagram.createdAt);
            expect(result.updatedAt).toBe(diagram.updatedAt);
        });
    });
});

import { describe, it, expect } from 'vitest';
import {
    isTableInsideArea,
    findContainingArea,
    updateTablesParentAreas,
    getTablesInArea,
} from '../area-utils';
import type { DBTable } from '@/lib/domain/db-table';
import type { Area } from '@/lib/domain/area';

describe('area-utils', () => {
    const createMockTable = (overrides: Partial<DBTable> = {}): DBTable => ({
        id: 'table-1',
        name: 'test_table',
        fields: [],
        indexes: [],
        x: 100,
        y: 100,
        color: '#000000',
        isView: false,
        createdAt: 0,
        ...overrides,
    });

    const createMockArea = (overrides: Partial<Area> = {}): Area => ({
        id: 'area-1',
        name: 'Test Area',
        x: 50,
        y: 50,
        width: 500,
        height: 400,
        color: '#FF0000',
        isCollapsed: false,
        showFieldTypes: true,
        ...overrides,
    });

    describe('isTableInsideArea', () => {
        it('should return true when table is completely inside area', () => {
            const table = createMockTable({ x: 100, y: 100, width: 200 });
            const area = createMockArea({
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            expect(isTableInsideArea(table, area)).toBe(true);
        });

        it('should return false when table is partially outside area (right)', () => {
            const table = createMockTable({ x: 500, y: 100, width: 200 });
            const area = createMockArea({
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            expect(isTableInsideArea(table, area)).toBe(false);
        });

        it('should return false when table is partially outside area (bottom)', () => {
            const table = createMockTable({ x: 100, y: 420, width: 200 });
            const area = createMockArea({
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            expect(isTableInsideArea(table, area)).toBe(false);
        });

        it('should return false when table is partially outside area (left)', () => {
            const table = createMockTable({ x: 30, y: 100, width: 200 });
            const area = createMockArea({
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            expect(isTableInsideArea(table, area)).toBe(false);
        });

        it('should return false when table is partially outside area (top)', () => {
            const table = createMockTable({ x: 100, y: 30, width: 200 });
            const area = createMockArea({
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            expect(isTableInsideArea(table, area)).toBe(false);
        });

        it('should return false when table is completely outside area', () => {
            const table = createMockTable({ x: 600, y: 500, width: 200 });
            const area = createMockArea({
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            expect(isTableInsideArea(table, area)).toBe(false);
        });

        it('should handle table at area boundary (just inside)', () => {
            const table = createMockTable({ x: 50, y: 50, width: 224 });
            const area = createMockArea({
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            // Table fits exactly at the top-left corner
            expect(isTableInsideArea(table, area)).toBe(true);
        });

        it('should consider table height when checking containment', () => {
            // Table with many fields will be taller
            const table = createMockTable({
                x: 100,
                y: 100,
                width: 200,
                fields: Array(20).fill({
                    id: 'field',
                    name: 'field',
                    type: { id: 'int', name: 'INT' },
                    primaryKey: false,
                    unique: false,
                    nullable: true,
                    createdAt: 0,
                }),
            });
            const area = createMockArea({
                x: 50,
                y: 50,
                width: 500,
                height: 200,
            });

            // Table is too tall for the area
            expect(isTableInsideArea(table, area)).toBe(false);
        });
    });

    describe('findContainingArea', () => {
        it('should return the area containing the table', () => {
            const table = createMockTable({ x: 100, y: 100, width: 200 });
            const area1 = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });
            const area2 = createMockArea({
                id: 'area-2',
                x: 600,
                y: 50,
                width: 500,
                height: 400,
            });

            const result = findContainingArea(table, [area1, area2]);

            expect(result).toBe(area1);
        });

        it('should return null when table is not inside any area', () => {
            const table = createMockTable({ x: 1000, y: 1000, width: 200 });
            const area1 = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });
            const area2 = createMockArea({
                id: 'area-2',
                x: 600,
                y: 50,
                width: 500,
                height: 400,
            });

            const result = findContainingArea(table, [area1, area2]);

            expect(result).toBeNull();
        });

        it('should prioritize areas with higher order', () => {
            const table = createMockTable({ x: 100, y: 100, width: 200 });
            const area1 = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
                order: 1,
            });
            const area2 = createMockArea({
                id: 'area-2',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
                order: 2,
            });

            const result = findContainingArea(table, [area1, area2]);

            // Should return area2 because it has higher order
            expect(result).toBe(area2);
        });

        it('should handle areas without order property', () => {
            const table = createMockTable({ x: 100, y: 100, width: 200 });
            const area1 = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            const result = findContainingArea(table, [area1]);

            expect(result).toBe(area1);
        });

        it('should return null for empty areas array', () => {
            const table = createMockTable({ x: 100, y: 100, width: 200 });

            const result = findContainingArea(table, []);

            expect(result).toBeNull();
        });

        it('should handle overlapping areas', () => {
            const table = createMockTable({ x: 100, y: 100, width: 200 });
            const area1 = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 300,
                height: 300,
                order: 1,
            });
            const area2 = createMockArea({
                id: 'area-2',
                x: 80,
                y: 80,
                width: 300,
                height: 300,
                order: 2,
            });

            const result = findContainingArea(table, [area1, area2]);

            // Should return the area with highest order
            expect(result).toBe(area2);
        });
    });

    describe('updateTablesParentAreas', () => {
        it('should update table parent area when inside an area', () => {
            const table = createMockTable({
                x: 100,
                y: 100,
                width: 200,
                parentAreaId: null,
            });
            const area = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            const result = updateTablesParentAreas([table], [area]);

            expect(result[0].parentAreaId).toBe('area-1');
        });

        it('should set parent area to null when table is outside all areas', () => {
            const table = createMockTable({
                x: 1000,
                y: 1000,
                width: 200,
                parentAreaId: 'area-1',
            });
            const area = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            const result = updateTablesParentAreas([table], [area]);

            expect(result[0].parentAreaId).toBeNull();
        });

        it('should not create new object if parent area has not changed', () => {
            const table = createMockTable({
                x: 100,
                y: 100,
                width: 200,
                parentAreaId: 'area-1',
            });
            const area = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            const result = updateTablesParentAreas([table], [area]);

            expect(result[0]).toBe(table); // Same object reference
        });

        it('should handle multiple tables', () => {
            const table1 = createMockTable({
                id: 'table-1',
                x: 100,
                y: 100,
                width: 200,
                parentAreaId: null,
            });
            const table2 = createMockTable({
                id: 'table-2',
                x: 700,
                y: 100,
                width: 200,
                parentAreaId: null,
            });
            const area1 = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });
            const area2 = createMockArea({
                id: 'area-2',
                x: 600,
                y: 50,
                width: 500,
                height: 400,
            });

            const result = updateTablesParentAreas(
                [table1, table2],
                [area1, area2]
            );

            expect(result[0].parentAreaId).toBe('area-1');
            expect(result[1].parentAreaId).toBe('area-2');
        });

        it('should handle empty areas array', () => {
            const table = createMockTable({
                x: 100,
                y: 100,
                width: 200,
                parentAreaId: 'area-1',
            });

            const result = updateTablesParentAreas([table], []);

            expect(result[0].parentAreaId).toBeNull();
        });

        it('should handle empty tables array', () => {
            const area = createMockArea({
                id: 'area-1',
                x: 50,
                y: 50,
                width: 500,
                height: 400,
            });

            const result = updateTablesParentAreas([], [area]);

            expect(result).toEqual([]);
        });
    });

    describe('getTablesInArea', () => {
        it('should return tables in specified area', () => {
            const table1 = createMockTable({
                id: 'table-1',
                parentAreaId: 'area-1',
            });
            const table2 = createMockTable({
                id: 'table-2',
                parentAreaId: 'area-2',
            });
            const table3 = createMockTable({
                id: 'table-3',
                parentAreaId: 'area-1',
            });

            const result = getTablesInArea('area-1', [table1, table2, table3]);

            expect(result).toHaveLength(2);
            expect(result).toContain(table1);
            expect(result).toContain(table3);
        });

        it('should return empty array when no tables in area', () => {
            const table1 = createMockTable({
                id: 'table-1',
                parentAreaId: 'area-1',
            });
            const table2 = createMockTable({
                id: 'table-2',
                parentAreaId: 'area-2',
            });

            const result = getTablesInArea('area-3', [table1, table2]);

            expect(result).toEqual([]);
        });

        it('should return empty array for empty tables array', () => {
            const result = getTablesInArea('area-1', []);

            expect(result).toEqual([]);
        });

        it('should not include tables with null parentAreaId', () => {
            const table1 = createMockTable({
                id: 'table-1',
                parentAreaId: 'area-1',
            });
            const table2 = createMockTable({
                id: 'table-2',
                parentAreaId: null,
            });

            const result = getTablesInArea('area-1', [table1, table2]);

            expect(result).toHaveLength(1);
            expect(result).toContain(table1);
        });

        it('should handle tables with undefined parentAreaId', () => {
            const table1 = createMockTable({
                id: 'table-1',
                parentAreaId: 'area-1',
            });
            const table2 = createMockTable({
                id: 'table-2',
            });

            const result = getTablesInArea('area-1', [table1, table2]);

            expect(result).toHaveLength(1);
            expect(result).toContain(table1);
        });
    });
});

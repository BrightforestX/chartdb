import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    TableDiffChangedSchema,
    TableDiffRemovedSchema,
    createTableDiffAddedSchema,
    createTableDiffSchema,
    type TableDiffChanged,
    type TableDiffRemoved,
    type TableDiffAdded,
} from '../table-diff';
import { dbTableSchema, type DBTable } from '../../db-table';

describe('table-diff', () => {
    describe('TableDiffChanged', () => {
        it('should validate a valid changed diff', () => {
            const diff: TableDiffChanged = {
                object: 'table',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old_table',
                newValue: 'new_table',
            };

            expect(() => TableDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff with numeric values', () => {
            const diff: TableDiffChanged = {
                object: 'table',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'x',
                oldValue: 100,
                newValue: 200,
            };

            expect(() => TableDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff with null values', () => {
            const diff: TableDiffChanged = {
                object: 'table',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'color',
                oldValue: null,
                newValue: '#FF0000',
            };

            expect(() => TableDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate all valid attributes', () => {
            const attributes: Array<TableDiffChanged['attribute']> = [
                'name',
                'comments',
                'color',
                'x',
                'y',
                'width',
            ];

            attributes.forEach((attribute) => {
                const diff: TableDiffChanged = {
                    object: 'table',
                    type: 'changed',
                    tableId: 'table-1',
                    attribute,
                    oldValue: 'old',
                    newValue: 'new',
                };

                expect(() => TableDiffChangedSchema.parse(diff)).not.toThrow();
            });
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'field',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'name',
            };

            expect(() => TableDiffChangedSchema.parse(diff)).toThrow();
        });

        it('should reject invalid attribute', () => {
            const diff = {
                object: 'table',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'invalid',
            };

            expect(() => TableDiffChangedSchema.parse(diff)).toThrow();
        });
    });

    describe('TableDiffRemoved', () => {
        it('should validate a valid removed diff', () => {
            const diff: TableDiffRemoved = {
                object: 'table',
                type: 'removed',
                tableId: 'table-1',
            };

            expect(() => TableDiffRemovedSchema.parse(diff)).not.toThrow();
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'area',
                type: 'removed',
                tableId: 'table-1',
            };

            expect(() => TableDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject missing tableId', () => {
            const diff = {
                object: 'table',
                type: 'removed',
            };

            expect(() => TableDiffRemovedSchema.parse(diff)).toThrow();
        });
    });

    describe('createTableDiffAddedSchema', () => {
        it('should validate a valid added diff', () => {
            const schema = createTableDiffAddedSchema(dbTableSchema);
            const table: DBTable = {
                id: 'table-1',
                name: 'test_table',
                fields: [],
                indexes: [],
                x: 0,
                y: 0,
                color: '#000000',
                isView: false,
                isMaterializedView: false,
                createdAt: 0,
            };

            const diff: TableDiffAdded = {
                object: 'table',
                type: 'added',
                tableAdded: table,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid table data', () => {
            const schema = createTableDiffAddedSchema(dbTableSchema);
            const diff = {
                object: 'table',
                type: 'added',
                tableAdded: {
                    id: 'table-1',
                    // missing required fields
                },
            };

            expect(() => schema.parse(diff)).toThrow();
        });

        it('should work with custom table schema', () => {
            interface CustomTable {
                id: string;
                customField: number;
            }

            const customTableSchema: z.ZodType<CustomTable> = z.object({
                id: z.string(),
                customField: z.number(),
            });

            const schema = createTableDiffAddedSchema(customTableSchema);
            const diff: TableDiffAdded<CustomTable> = {
                object: 'table',
                type: 'added',
                tableAdded: {
                    id: 'table-1',
                    customField: 42,
                },
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });
    });

    describe('createTableDiffSchema', () => {
        it('should validate changed diff', () => {
            const schema = createTableDiffSchema(dbTableSchema);
            const diff: TableDiffChanged = {
                object: 'table',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate removed diff', () => {
            const schema = createTableDiffSchema(dbTableSchema);
            const diff: TableDiffRemoved = {
                object: 'table',
                type: 'removed',
                tableId: 'table-1',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate added diff', () => {
            const schema = createTableDiffSchema(dbTableSchema);
            const table: DBTable = {
                id: 'table-1',
                name: 'test_table',
                fields: [],
                indexes: [],
                x: 0,
                y: 0,
                color: '#000000',
                isView: false,
                isMaterializedView: false,
                createdAt: 0,
            };

            const diff: TableDiffAdded = {
                object: 'table',
                type: 'added',
                tableAdded: table,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid diff types', () => {
            const schema = createTableDiffSchema(dbTableSchema);
            const diff = {
                object: 'field',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'name',
            };

            expect(() => schema.parse(diff)).toThrow();
        });
    });
});

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    indexDiffRemovedSchema,
    createIndexDiffAddedSchema,
    createIndexDiffSchema,
    type IndexDiffRemoved,
    type IndexDiffAdded,
} from '../index-diff';
import { dbIndexSchema, type DBIndex } from '../../db-index';

describe('index-diff', () => {
    describe('IndexDiffRemoved', () => {
        it('should validate a valid removed diff', () => {
            const diff: IndexDiffRemoved = {
                object: 'index',
                type: 'removed',
                indexId: 'index-1',
                tableId: 'table-1',
            };

            expect(() => indexDiffRemovedSchema.parse(diff)).not.toThrow();
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'field',
                type: 'removed',
                indexId: 'index-1',
                tableId: 'table-1',
            };

            expect(() => indexDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject invalid type', () => {
            const diff = {
                object: 'index',
                type: 'added',
                indexId: 'index-1',
                tableId: 'table-1',
            };

            expect(() => indexDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject missing indexId', () => {
            const diff = {
                object: 'index',
                type: 'removed',
                tableId: 'table-1',
            };

            expect(() => indexDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject missing tableId', () => {
            const diff = {
                object: 'index',
                type: 'removed',
                indexId: 'index-1',
            };

            expect(() => indexDiffRemovedSchema.parse(diff)).toThrow();
        });
    });

    describe('createIndexDiffAddedSchema', () => {
        it('should validate a valid added diff', () => {
            const schema = createIndexDiffAddedSchema(dbIndexSchema);
            const index: DBIndex = {
                id: 'index-1',
                name: 'idx_test',
                fieldIds: ['field-1', 'field-2'],
                unique: false,
                createdAt: 0,
            };

            const diff: IndexDiffAdded = {
                object: 'index',
                type: 'added',
                tableId: 'table-1',
                newIndex: index,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate added diff with unique index', () => {
            const schema = createIndexDiffAddedSchema(dbIndexSchema);
            const index: DBIndex = {
                id: 'index-1',
                name: 'idx_unique',
                fieldIds: ['field-1'],
                unique: true,
                createdAt: 0,
            };

            const diff: IndexDiffAdded = {
                object: 'index',
                type: 'added',
                tableId: 'table-1',
                newIndex: index,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid index data', () => {
            const schema = createIndexDiffAddedSchema(dbIndexSchema);
            const diff = {
                object: 'index',
                type: 'added',
                tableId: 'table-1',
                newIndex: {
                    id: 'index-1',
                    // missing required fields
                },
            };

            expect(() => schema.parse(diff)).toThrow();
        });

        it('should work with custom index schema', () => {
            interface CustomIndex {
                id: string;
                customField: boolean;
            }

            const customIndexSchema: z.ZodType<CustomIndex> = z.object({
                id: z.string(),
                customField: z.boolean(),
            });

            const schema = createIndexDiffAddedSchema(customIndexSchema);
            const diff: IndexDiffAdded<CustomIndex> = {
                object: 'index',
                type: 'added',
                tableId: 'table-1',
                newIndex: {
                    id: 'index-1',
                    customField: true,
                },
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });
    });

    describe('createIndexDiffSchema', () => {
        it('should validate removed diff', () => {
            const schema = createIndexDiffSchema(dbIndexSchema);
            const diff: IndexDiffRemoved = {
                object: 'index',
                type: 'removed',
                indexId: 'index-1',
                tableId: 'table-1',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate added diff', () => {
            const schema = createIndexDiffSchema(dbIndexSchema);
            const index: DBIndex = {
                id: 'index-1',
                name: 'idx_test',
                fieldIds: ['field-1'],
                unique: false,
                createdAt: 0,
            };

            const diff: IndexDiffAdded = {
                object: 'index',
                type: 'added',
                tableId: 'table-1',
                newIndex: index,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid diff types', () => {
            const schema = createIndexDiffSchema(dbIndexSchema);
            const diff = {
                object: 'field',
                type: 'added',
                tableId: 'table-1',
                newIndex: {},
            };

            expect(() => schema.parse(diff)).toThrow();
        });
    });
});

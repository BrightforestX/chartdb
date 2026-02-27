import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    fieldDiffChangedSchema,
    fieldDiffRemovedSchema,
    createFieldDiffAddedSchema,
    createFieldDiffSchema,
    type FieldDiffChanged,
    type FieldDiffRemoved,
    type FieldDiffAdded,
} from '../field-diff';
import { dbFieldSchema, type DBField } from '../../db-field';

describe('field-diff', () => {
    describe('FieldDiffChanged', () => {
        it('should validate a valid changed diff with string values', () => {
            const diff: FieldDiffChanged = {
                object: 'field',
                type: 'changed',
                fieldId: 'field-1',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old_name',
                newValue: 'new_name',
            };

            expect(() => fieldDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff with boolean values', () => {
            const diff: FieldDiffChanged = {
                object: 'field',
                type: 'changed',
                fieldId: 'field-1',
                tableId: 'table-1',
                attribute: 'nullable',
                oldValue: true,
                newValue: false,
            };

            expect(() => fieldDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff with data type values', () => {
            const diff: FieldDiffChanged = {
                object: 'field',
                type: 'changed',
                fieldId: 'field-1',
                tableId: 'table-1',
                attribute: 'type',
                oldValue: { id: 'int', name: 'INT' },
                newValue: { id: 'varchar', name: 'VARCHAR' },
            };

            expect(() => fieldDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate all valid attributes', () => {
            const attributes: Array<FieldDiffChanged['attribute']> = [
                'name',
                'type',
                'primaryKey',
                'unique',
                'nullable',
                'comments',
            ];

            attributes.forEach((attribute) => {
                const diff: FieldDiffChanged = {
                    object: 'field',
                    type: 'changed',
                    fieldId: 'field-1',
                    tableId: 'table-1',
                    attribute,
                    oldValue: 'old',
                    newValue: 'new',
                };

                expect(() => fieldDiffChangedSchema.parse(diff)).not.toThrow();
            });
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'table',
                type: 'changed',
                fieldId: 'field-1',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            expect(() => fieldDiffChangedSchema.parse(diff)).toThrow();
        });

        it('should reject missing fieldId', () => {
            const diff = {
                object: 'field',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            expect(() => fieldDiffChangedSchema.parse(diff)).toThrow();
        });

        it('should reject missing tableId', () => {
            const diff = {
                object: 'field',
                type: 'changed',
                fieldId: 'field-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            expect(() => fieldDiffChangedSchema.parse(diff)).toThrow();
        });
    });

    describe('FieldDiffRemoved', () => {
        it('should validate a valid removed diff', () => {
            const diff: FieldDiffRemoved = {
                object: 'field',
                type: 'removed',
                fieldId: 'field-1',
                tableId: 'table-1',
            };

            expect(() => fieldDiffRemovedSchema.parse(diff)).not.toThrow();
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'index',
                type: 'removed',
                fieldId: 'field-1',
                tableId: 'table-1',
            };

            expect(() => fieldDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject missing fieldId', () => {
            const diff = {
                object: 'field',
                type: 'removed',
                tableId: 'table-1',
            };

            expect(() => fieldDiffRemovedSchema.parse(diff)).toThrow();
        });
    });

    describe('createFieldDiffAddedSchema', () => {
        it('should validate a valid added diff', () => {
            const schema = createFieldDiffAddedSchema(dbFieldSchema);
            const field: DBField = {
                id: 'field-1',
                name: 'test_field',
                type: { id: 'int', name: 'INT' },
                primaryKey: false,
                unique: false,
                nullable: true,
                createdAt: 0,
            };

            const diff: FieldDiffAdded = {
                object: 'field',
                type: 'added',
                tableId: 'table-1',
                newField: field,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid field data', () => {
            const schema = createFieldDiffAddedSchema(dbFieldSchema);
            const diff = {
                object: 'field',
                type: 'added',
                tableId: 'table-1',
                newField: {
                    id: 'field-1',
                    // missing required fields
                },
            };

            expect(() => schema.parse(diff)).toThrow();
        });

        it('should work with custom field schema', () => {
            interface CustomField {
                id: string;
                customProp: string;
            }

            const customFieldSchema: z.ZodType<CustomField> = z.object({
                id: z.string(),
                customProp: z.string(),
            });

            const schema = createFieldDiffAddedSchema(customFieldSchema);
            const diff: FieldDiffAdded<CustomField> = {
                object: 'field',
                type: 'added',
                tableId: 'table-1',
                newField: {
                    id: 'field-1',
                    customProp: 'custom',
                },
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });
    });

    describe('createFieldDiffSchema', () => {
        it('should validate changed diff', () => {
            const schema = createFieldDiffSchema(dbFieldSchema);
            const diff: FieldDiffChanged = {
                object: 'field',
                type: 'changed',
                fieldId: 'field-1',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate removed diff', () => {
            const schema = createFieldDiffSchema(dbFieldSchema);
            const diff: FieldDiffRemoved = {
                object: 'field',
                type: 'removed',
                fieldId: 'field-1',
                tableId: 'table-1',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate added diff', () => {
            const schema = createFieldDiffSchema(dbFieldSchema);
            const field: DBField = {
                id: 'field-1',
                name: 'test_field',
                type: { id: 'int', name: 'INT' },
                primaryKey: false,
                unique: false,
                nullable: true,
                createdAt: 0,
            };

            const diff: FieldDiffAdded = {
                object: 'field',
                type: 'added',
                tableId: 'table-1',
                newField: field,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid diff types', () => {
            const schema = createFieldDiffSchema(dbFieldSchema);
            const diff = {
                object: 'table',
                type: 'changed',
                fieldId: 'field-1',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            expect(() => schema.parse(diff)).toThrow();
        });
    });
});

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    AreaDiffChangedSchema,
    AreaDiffRemovedSchema,
    createAreaDiffAddedSchema,
    createAreaDiffSchema,
    type AreaDiffChanged,
    type AreaDiffRemoved,
    type AreaDiffAdded,
} from '../area-diff';
import { areaSchema, type Area } from '../../area';

describe('area-diff', () => {
    describe('AreaDiffChanged', () => {
        it('should validate a valid changed diff', () => {
            const diff: AreaDiffChanged = {
                object: 'area',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'name',
                oldValue: 'Old Name',
                newValue: 'New Name',
            };

            expect(() => AreaDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff with numeric values', () => {
            const diff: AreaDiffChanged = {
                object: 'area',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'x',
                oldValue: 100,
                newValue: 200,
            };

            expect(() => AreaDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff with null values', () => {
            const diff: AreaDiffChanged = {
                object: 'area',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'color',
                oldValue: null,
                newValue: '#FF0000',
            };

            expect(() => AreaDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff without optional values', () => {
            const diff: AreaDiffChanged = {
                object: 'area',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'width',
            };

            expect(() => AreaDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate all valid attributes', () => {
            const attributes: Array<AreaDiffChanged['attribute']> = [
                'name',
                'color',
                'x',
                'y',
                'width',
                'height',
            ];

            attributes.forEach((attribute) => {
                const diff: AreaDiffChanged = {
                    object: 'area',
                    type: 'changed',
                    areaId: 'area-1',
                    attribute,
                    oldValue: 'old',
                    newValue: 'new',
                };

                expect(() => AreaDiffChangedSchema.parse(diff)).not.toThrow();
            });
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'table',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'name',
            };

            expect(() => AreaDiffChangedSchema.parse(diff)).toThrow();
        });

        it('should reject invalid type', () => {
            const diff = {
                object: 'area',
                type: 'added',
                areaId: 'area-1',
                attribute: 'name',
            };

            expect(() => AreaDiffChangedSchema.parse(diff)).toThrow();
        });

        it('should reject invalid attribute', () => {
            const diff = {
                object: 'area',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'invalid',
            };

            expect(() => AreaDiffChangedSchema.parse(diff)).toThrow();
        });
    });

    describe('AreaDiffRemoved', () => {
        it('should validate a valid removed diff', () => {
            const diff: AreaDiffRemoved = {
                object: 'area',
                type: 'removed',
                areaId: 'area-1',
            };

            expect(() => AreaDiffRemovedSchema.parse(diff)).not.toThrow();
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'note',
                type: 'removed',
                areaId: 'area-1',
            };

            expect(() => AreaDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject invalid type', () => {
            const diff = {
                object: 'area',
                type: 'changed',
                areaId: 'area-1',
            };

            expect(() => AreaDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject missing areaId', () => {
            const diff = {
                object: 'area',
                type: 'removed',
            };

            expect(() => AreaDiffRemovedSchema.parse(diff)).toThrow();
        });
    });

    describe('createAreaDiffAddedSchema', () => {
        it('should validate a valid added diff', () => {
            const schema = createAreaDiffAddedSchema(areaSchema);
            const area: Area = {
                id: 'area-1',
                name: 'Test Area',
                color: '#FF0000',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                isCollapsed: false,
                showFieldTypes: true,
            };

            const diff: AreaDiffAdded = {
                object: 'area',
                type: 'added',
                areaAdded: area,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid area data', () => {
            const schema = createAreaDiffAddedSchema(areaSchema);
            const diff = {
                object: 'area',
                type: 'added',
                areaAdded: {
                    id: 'area-1',
                    // missing required fields
                },
            };

            expect(() => schema.parse(diff)).toThrow();
        });

        it('should work with custom area schema', () => {
            interface CustomArea {
                id: string;
                customField: string;
            }

            const customAreaSchema: z.ZodType<CustomArea> = z.object({
                id: z.string(),
                customField: z.string(),
            });

            const schema = createAreaDiffAddedSchema(customAreaSchema);
            const diff: AreaDiffAdded<CustomArea> = {
                object: 'area',
                type: 'added',
                areaAdded: {
                    id: 'area-1',
                    customField: 'custom',
                },
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });
    });

    describe('createAreaDiffSchema', () => {
        it('should validate changed diff', () => {
            const schema = createAreaDiffSchema(areaSchema);
            const diff: AreaDiffChanged = {
                object: 'area',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate removed diff', () => {
            const schema = createAreaDiffSchema(areaSchema);
            const diff: AreaDiffRemoved = {
                object: 'area',
                type: 'removed',
                areaId: 'area-1',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate added diff', () => {
            const schema = createAreaDiffSchema(areaSchema);
            const area: Area = {
                id: 'area-1',
                name: 'Test Area',
                color: '#FF0000',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                isCollapsed: false,
                showFieldTypes: true,
            };

            const diff: AreaDiffAdded = {
                object: 'area',
                type: 'added',
                areaAdded: area,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid diff types', () => {
            const schema = createAreaDiffSchema(areaSchema);
            const diff = {
                object: 'table',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'name',
            };

            expect(() => schema.parse(diff)).toThrow();
        });
    });
});

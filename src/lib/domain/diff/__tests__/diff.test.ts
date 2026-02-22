import { describe, it, expect } from 'vitest';
import { isDiffOfKind, type ChartDBDiff, type DiffKind } from '../diff';

describe('diff', () => {
    describe('isDiffOfKind', () => {
        it('should match table changed diff with attribute', () => {
            const diff: ChartDBDiff = {
                object: 'table',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            const kind: DiffKind = {
                object: 'table',
                type: 'changed',
                attribute: 'name',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should not match different attributes', () => {
            const diff: ChartDBDiff = {
                object: 'table',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            const kind: DiffKind = {
                object: 'table',
                type: 'changed',
                attribute: 'color',
            };

            expect(isDiffOfKind(diff, kind)).toBe(false);
        });

        it('should match table removed diff without attribute', () => {
            const diff: ChartDBDiff = {
                object: 'table',
                type: 'removed',
                tableId: 'table-1',
            };

            const kind: DiffKind = {
                object: 'table',
                type: 'removed',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should not match diff with attribute against kind without attribute', () => {
            const diff: ChartDBDiff = {
                object: 'table',
                type: 'changed',
                tableId: 'table-1',
                attribute: 'name',
                oldValue: 'old',
                newValue: 'new',
            };

            const kind: DiffKind = {
                object: 'table',
                type: 'changed',
            };

            expect(isDiffOfKind(diff, kind)).toBe(false);
        });

        it('should not match kind with attribute against diff without attribute', () => {
            const diff: ChartDBDiff = {
                object: 'table',
                type: 'removed',
                tableId: 'table-1',
            };

            const kind: DiffKind = {
                object: 'table',
                type: 'changed',
                attribute: 'name',
            };

            expect(isDiffOfKind(diff, kind)).toBe(false);
        });

        it('should match field changed diff', () => {
            const diff: ChartDBDiff = {
                object: 'field',
                type: 'changed',
                fieldId: 'field-1',
                tableId: 'table-1',
                attribute: 'nullable',
                oldValue: true,
                newValue: false,
            };

            const kind: DiffKind = {
                object: 'field',
                type: 'changed',
                attribute: 'nullable',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should match field removed diff', () => {
            const diff: ChartDBDiff = {
                object: 'field',
                type: 'removed',
                fieldId: 'field-1',
                tableId: 'table-1',
            };

            const kind: DiffKind = {
                object: 'field',
                type: 'removed',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should match field added diff', () => {
            const diff: ChartDBDiff = {
                object: 'field',
                type: 'added',
                tableId: 'table-1',
                newField: {
                    id: 'field-1',
                    name: 'test',
                    type: { id: 'int', name: 'INT' },
                    primaryKey: false,
                    unique: false,
                    nullable: true,
                    createdAt: 0,
                },
            };

            const kind: DiffKind = {
                object: 'field',
                type: 'added',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should match index added diff', () => {
            const diff: ChartDBDiff = {
                object: 'index',
                type: 'added',
                tableId: 'table-1',
                newIndex: {
                    id: 'index-1',
                    name: 'idx_test',
                    fieldIds: ['field-1'],
                    unique: false,
                    createdAt: 0,
                },
            };

            const kind: DiffKind = {
                object: 'index',
                type: 'added',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should match relationship added diff', () => {
            const diff: ChartDBDiff = {
                object: 'relationship',
                type: 'added',
                newRelationship: {
                    id: 'rel-1',
                    name: 'fk_test',
                    sourceTableId: 'table-1',
                    targetTableId: 'table-2',
                    sourceFieldId: 'field-1',
                    targetFieldId: 'field-2',
                    sourceCardinality: 'one',
                    targetCardinality: 'many',
                    createdAt: 0,
                },
            };

            const kind: DiffKind = {
                object: 'relationship',
                type: 'added',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should match area changed diff', () => {
            const diff: ChartDBDiff = {
                object: 'area',
                type: 'changed',
                areaId: 'area-1',
                attribute: 'color',
                oldValue: '#000000',
                newValue: '#FFFFFF',
            };

            const kind: DiffKind = {
                object: 'area',
                type: 'changed',
                attribute: 'color',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should match note changed diff', () => {
            const diff: ChartDBDiff = {
                object: 'note',
                type: 'changed',
                noteId: 'note-1',
                attribute: 'content',
                oldValue: 'old content',
                newValue: 'new content',
            };

            const kind: DiffKind = {
                object: 'note',
                type: 'changed',
                attribute: 'content',
            };

            expect(isDiffOfKind(diff, kind)).toBe(true);
        });

        it('should not match different object types', () => {
            const diff: ChartDBDiff = {
                object: 'table',
                type: 'removed',
                tableId: 'table-1',
            };

            const kind: DiffKind = {
                object: 'field',
                type: 'removed',
            };

            expect(isDiffOfKind(diff, kind)).toBe(false);
        });

        it('should not match different types', () => {
            const diff: ChartDBDiff = {
                object: 'table',
                type: 'removed',
                tableId: 'table-1',
            };

            const kind: DiffKind = {
                object: 'table',
                type: 'added',
            };

            expect(isDiffOfKind(diff, kind)).toBe(false);
        });

        it('should match all table attributes', () => {
            const attributes: Array<
                'name' | 'comments' | 'color' | 'x' | 'y' | 'width'
            > = ['name', 'comments', 'color', 'x', 'y', 'width'];

            attributes.forEach((attribute) => {
                const diff: ChartDBDiff = {
                    object: 'table',
                    type: 'changed',
                    tableId: 'table-1',
                    attribute,
                    oldValue: 'old',
                    newValue: 'new',
                };

                const kind: DiffKind = {
                    object: 'table',
                    type: 'changed',
                    attribute,
                };

                expect(isDiffOfKind(diff, kind)).toBe(true);
            });
        });

        it('should match all field attributes', () => {
            const attributes: Array<
                | 'name'
                | 'type'
                | 'primaryKey'
                | 'unique'
                | 'nullable'
                | 'comments'
            > = [
                'name',
                'type',
                'primaryKey',
                'unique',
                'nullable',
                'comments',
            ];

            attributes.forEach((attribute) => {
                const diff: ChartDBDiff = {
                    object: 'field',
                    type: 'changed',
                    fieldId: 'field-1',
                    tableId: 'table-1',
                    attribute,
                    oldValue: 'old',
                    newValue: 'new',
                };

                const kind: DiffKind = {
                    object: 'field',
                    type: 'changed',
                    attribute,
                };

                expect(isDiffOfKind(diff, kind)).toBe(true);
            });
        });
    });
});

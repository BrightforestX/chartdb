import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    NoteDiffChangedSchema,
    NoteDiffRemovedSchema,
    createNoteDiffAddedSchema,
    createNoteDiffSchema,
    type NoteDiffChanged,
    type NoteDiffRemoved,
    type NoteDiffAdded,
} from '../note-diff';
import { noteSchema, type Note } from '../../note';

describe('note-diff', () => {
    describe('NoteDiffChanged', () => {
        it('should validate a valid changed diff', () => {
            const diff: NoteDiffChanged = {
                object: 'note',
                type: 'changed',
                noteId: 'note-1',
                attribute: 'content',
                oldValue: 'Old content',
                newValue: 'New content',
            };

            expect(() => NoteDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff with numeric values', () => {
            const diff: NoteDiffChanged = {
                object: 'note',
                type: 'changed',
                noteId: 'note-1',
                attribute: 'x',
                oldValue: 100,
                newValue: 200,
            };

            expect(() => NoteDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate changed diff with null values', () => {
            const diff: NoteDiffChanged = {
                object: 'note',
                type: 'changed',
                noteId: 'note-1',
                attribute: 'color',
                oldValue: null,
                newValue: '#00FF00',
            };

            expect(() => NoteDiffChangedSchema.parse(diff)).not.toThrow();
        });

        it('should validate all valid attributes', () => {
            const attributes: Array<NoteDiffChanged['attribute']> = [
                'content',
                'color',
                'x',
                'y',
                'width',
                'height',
            ];

            attributes.forEach((attribute) => {
                const diff: NoteDiffChanged = {
                    object: 'note',
                    type: 'changed',
                    noteId: 'note-1',
                    attribute,
                    oldValue: 'old',
                    newValue: 'new',
                };

                expect(() => NoteDiffChangedSchema.parse(diff)).not.toThrow();
            });
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'table',
                type: 'changed',
                noteId: 'note-1',
                attribute: 'content',
            };

            expect(() => NoteDiffChangedSchema.parse(diff)).toThrow();
        });

        it('should reject invalid attribute', () => {
            const diff = {
                object: 'note',
                type: 'changed',
                noteId: 'note-1',
                attribute: 'invalid',
            };

            expect(() => NoteDiffChangedSchema.parse(diff)).toThrow();
        });
    });

    describe('NoteDiffRemoved', () => {
        it('should validate a valid removed diff', () => {
            const diff: NoteDiffRemoved = {
                object: 'note',
                type: 'removed',
                noteId: 'note-1',
            };

            expect(() => NoteDiffRemovedSchema.parse(diff)).not.toThrow();
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'area',
                type: 'removed',
                noteId: 'note-1',
            };

            expect(() => NoteDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject missing noteId', () => {
            const diff = {
                object: 'note',
                type: 'removed',
            };

            expect(() => NoteDiffRemovedSchema.parse(diff)).toThrow();
        });
    });

    describe('createNoteDiffAddedSchema', () => {
        it('should validate a valid added diff', () => {
            const schema = createNoteDiffAddedSchema(noteSchema);
            const note: Note = {
                id: 'note-1',
                content: 'Test note',
                color: '#0000FF',
                x: 0,
                y: 0,
                width: 200,
                height: 150,
                zIndex: 1,
            };

            const diff: NoteDiffAdded = {
                object: 'note',
                type: 'added',
                noteAdded: note,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid note data', () => {
            const schema = createNoteDiffAddedSchema(noteSchema);
            const diff = {
                object: 'note',
                type: 'added',
                noteAdded: {
                    id: 'note-1',
                    // missing required fields
                },
            };

            expect(() => schema.parse(diff)).toThrow();
        });

        it('should work with custom note schema', () => {
            interface CustomNote {
                id: string;
                customField: number;
            }

            const customNoteSchema: z.ZodType<CustomNote> = z.object({
                id: z.string(),
                customField: z.number(),
            });

            const schema = createNoteDiffAddedSchema(customNoteSchema);
            const diff: NoteDiffAdded<CustomNote> = {
                object: 'note',
                type: 'added',
                noteAdded: {
                    id: 'note-1',
                    customField: 42,
                },
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });
    });

    describe('createNoteDiffSchema', () => {
        it('should validate changed diff', () => {
            const schema = createNoteDiffSchema(noteSchema);
            const diff: NoteDiffChanged = {
                object: 'note',
                type: 'changed',
                noteId: 'note-1',
                attribute: 'content',
                oldValue: 'old',
                newValue: 'new',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate removed diff', () => {
            const schema = createNoteDiffSchema(noteSchema);
            const diff: NoteDiffRemoved = {
                object: 'note',
                type: 'removed',
                noteId: 'note-1',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate added diff', () => {
            const schema = createNoteDiffSchema(noteSchema);
            const note: Note = {
                id: 'note-1',
                content: 'Test note',
                color: '#0000FF',
                x: 0,
                y: 0,
                width: 200,
                height: 150,
                zIndex: 1,
            };

            const diff: NoteDiffAdded = {
                object: 'note',
                type: 'added',
                noteAdded: note,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid diff types', () => {
            const schema = createNoteDiffSchema(noteSchema);
            const diff = {
                object: 'table',
                type: 'changed',
                noteId: 'note-1',
                attribute: 'content',
            };

            expect(() => schema.parse(diff)).toThrow();
        });
    });
});

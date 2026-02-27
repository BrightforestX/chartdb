import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    relationshipDiffRemovedSchema,
    createRelationshipDiffAddedSchema,
    createRelationshipDiffSchema,
    type RelationshipDiffRemoved,
    type RelationshipDiffAdded,
} from '../relationship-diff';
import {
    dbRelationshipSchema,
    type DBRelationship,
} from '../../db-relationship';

describe('relationship-diff', () => {
    describe('RelationshipDiffRemoved', () => {
        it('should validate a valid removed diff', () => {
            const diff: RelationshipDiffRemoved = {
                object: 'relationship',
                type: 'removed',
                relationshipId: 'rel-1',
            };

            expect(() =>
                relationshipDiffRemovedSchema.parse(diff)
            ).not.toThrow();
        });

        it('should reject invalid object type', () => {
            const diff = {
                object: 'field',
                type: 'removed',
                relationshipId: 'rel-1',
            };

            expect(() => relationshipDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject invalid type', () => {
            const diff = {
                object: 'relationship',
                type: 'added',
                relationshipId: 'rel-1',
            };

            expect(() => relationshipDiffRemovedSchema.parse(diff)).toThrow();
        });

        it('should reject missing relationshipId', () => {
            const diff = {
                object: 'relationship',
                type: 'removed',
            };

            expect(() => relationshipDiffRemovedSchema.parse(diff)).toThrow();
        });
    });

    describe('createRelationshipDiffAddedSchema', () => {
        it('should validate a valid added diff', () => {
            const schema =
                createRelationshipDiffAddedSchema(dbRelationshipSchema);
            const relationship: DBRelationship = {
                id: 'rel-1',
                name: 'fk_test',
                sourceTableId: 'table-1',
                targetTableId: 'table-2',
                sourceFieldId: 'field-1',
                targetFieldId: 'field-2',
                sourceCardinality: 'one',
                targetCardinality: 'many',
                createdAt: 0,
            };

            const diff: RelationshipDiffAdded = {
                object: 'relationship',
                type: 'added',
                newRelationship: relationship,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate different cardinality combinations', () => {
            const schema =
                createRelationshipDiffAddedSchema(dbRelationshipSchema);
            const combinations: Array<{
                sourceCardinality: 'one' | 'many';
                targetCardinality: 'one' | 'many';
            }> = [
                { sourceCardinality: 'one', targetCardinality: 'one' },
                { sourceCardinality: 'one', targetCardinality: 'many' },
                { sourceCardinality: 'many', targetCardinality: 'one' },
                { sourceCardinality: 'many', targetCardinality: 'many' },
            ];

            combinations.forEach(({ sourceCardinality, targetCardinality }) => {
                const relationship: DBRelationship = {
                    id: 'rel-1',
                    name: 'fk_test',
                    sourceTableId: 'table-1',
                    targetTableId: 'table-2',
                    sourceFieldId: 'field-1',
                    targetFieldId: 'field-2',
                    sourceCardinality,
                    targetCardinality,
                    createdAt: 0,
                };

                const diff: RelationshipDiffAdded = {
                    object: 'relationship',
                    type: 'added',
                    newRelationship: relationship,
                };

                expect(() => schema.parse(diff)).not.toThrow();
            });
        });

        it('should reject invalid relationship data', () => {
            const schema =
                createRelationshipDiffAddedSchema(dbRelationshipSchema);
            const diff = {
                object: 'relationship',
                type: 'added',
                newRelationship: {
                    id: 'rel-1',
                    // missing required fields
                },
            };

            expect(() => schema.parse(diff)).toThrow();
        });

        it('should work with custom relationship schema', () => {
            interface CustomRelationship {
                id: string;
                customField: string;
            }

            const customRelationshipSchema: z.ZodType<CustomRelationship> =
                z.object({
                    id: z.string(),
                    customField: z.string(),
                });

            const schema = createRelationshipDiffAddedSchema(
                customRelationshipSchema
            );
            const diff: RelationshipDiffAdded<CustomRelationship> = {
                object: 'relationship',
                type: 'added',
                newRelationship: {
                    id: 'rel-1',
                    customField: 'custom',
                },
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });
    });

    describe('createRelationshipDiffSchema', () => {
        it('should validate removed diff', () => {
            const schema = createRelationshipDiffSchema(dbRelationshipSchema);
            const diff: RelationshipDiffRemoved = {
                object: 'relationship',
                type: 'removed',
                relationshipId: 'rel-1',
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should validate added diff', () => {
            const schema = createRelationshipDiffSchema(dbRelationshipSchema);
            const relationship: DBRelationship = {
                id: 'rel-1',
                name: 'fk_test',
                sourceTableId: 'table-1',
                targetTableId: 'table-2',
                sourceFieldId: 'field-1',
                targetFieldId: 'field-2',
                sourceCardinality: 'one',
                targetCardinality: 'many',
                createdAt: 0,
            };

            const diff: RelationshipDiffAdded = {
                object: 'relationship',
                type: 'added',
                newRelationship: relationship,
            };

            expect(() => schema.parse(diff)).not.toThrow();
        });

        it('should reject invalid diff types', () => {
            const schema = createRelationshipDiffSchema(dbRelationshipSchema);
            const diff = {
                object: 'table',
                type: 'added',
                newRelationship: {},
            };

            expect(() => schema.parse(diff)).toThrow();
        });
    });
});

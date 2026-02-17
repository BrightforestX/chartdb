/**
 * MCP Server Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDiagramStorage } from '../src/storage.js';
import { createDiagram, addTable, addRelationship, exportSQL, exportDBML } from '../src/tools/diagram-tools.js';
import { DatabaseType } from '../src/types.js';

describe('ChartDB MCP Server', () => {
    let storage: InMemoryDiagramStorage;

    beforeEach(() => {
        storage = new InMemoryDiagramStorage();
    });

    describe('Diagram Management', () => {
        it('should create a new diagram', () => {
            const diagram = createDiagram(storage, {
                name: 'Test Database',
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.id).toBeDefined();
            expect(diagram.name).toBe('Test Database');
            expect(diagram.databaseType).toBe(DatabaseType.POSTGRESQL);
            expect(diagram.tables).toEqual([]);
        });

        it('should retrieve a saved diagram', () => {
            const diagram = createDiagram(storage, {
                name: 'Test Database',
                databaseType: DatabaseType.MYSQL,
            });

            const retrieved = storage.getDiagram(diagram.id);
            expect(retrieved).toEqual(diagram);
        });

        it('should list all diagrams', () => {
            createDiagram(storage, {
                name: 'DB1',
                databaseType: DatabaseType.POSTGRESQL,
            });
            createDiagram(storage, {
                name: 'DB2',
                databaseType: DatabaseType.MYSQL,
            });

            const diagrams = storage.listDiagrams();
            expect(diagrams).toHaveLength(2);
            expect(diagrams[0].name).toBe('DB1');
            expect(diagrams[1].name).toBe('DB2');
        });
    });

    describe('Table Operations', () => {
        it('should add a table to a diagram', () => {
            const diagram = createDiagram(storage, {
                name: 'Test Database',
                databaseType: DatabaseType.POSTGRESQL,
            });

            const table = addTable(storage, {
                diagramId: diagram.id,
                name: 'users',
                fields: [
                    {
                        name: 'id',
                        type: 'INTEGER',
                        primaryKey: true,
                        nullable: false,
                    },
                    {
                        name: 'email',
                        type: 'VARCHAR(255)',
                        unique: true,
                        nullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'TIMESTAMP',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            });

            expect(table.id).toBeDefined();
            expect(table.name).toBe('users');
            expect(table.fields).toHaveLength(3);

            const updated = storage.getDiagram(diagram.id);
            expect(updated?.tables).toHaveLength(1);
            expect(updated?.tables[0].name).toBe('users');
        });

        it('should add multiple tables', () => {
            const diagram = createDiagram(storage, {
                name: 'Test Database',
                databaseType: DatabaseType.POSTGRESQL,
            });

            addTable(storage, {
                diagramId: diagram.id,
                name: 'users',
                fields: [{ name: 'id', type: 'INTEGER', primaryKey: true }],
            });

            addTable(storage, {
                diagramId: diagram.id,
                name: 'posts',
                fields: [{ name: 'id', type: 'INTEGER', primaryKey: true }],
            });

            const updated = storage.getDiagram(diagram.id);
            expect(updated?.tables).toHaveLength(2);
        });
    });

    describe('Relationship Operations', () => {
        it('should add a relationship between tables', () => {
            const diagram = createDiagram(storage, {
                name: 'Test Database',
                databaseType: DatabaseType.POSTGRESQL,
            });

            const usersTable = addTable(storage, {
                diagramId: diagram.id,
                name: 'users',
                fields: [{ name: 'id', type: 'INTEGER', primaryKey: true }],
            });

            const postsTable = addTable(storage, {
                diagramId: diagram.id,
                name: 'posts',
                fields: [
                    { name: 'id', type: 'INTEGER', primaryKey: true },
                    { name: 'user_id', type: 'INTEGER' },
                ],
            });

            const relationship = addRelationship(storage, {
                diagramId: diagram.id,
                sourceTableId: postsTable.id,
                targetTableId: usersTable.id,
                sourceFieldId: postsTable.fields[1].id, // user_id
                targetFieldId: usersTable.fields[0].id, // id
                type: 'many_to_one',
            });

            expect(relationship.id).toBeDefined();
            expect(relationship.type).toBe('many_to_one');

            const updated = storage.getDiagram(diagram.id);
            expect(updated?.relationships).toHaveLength(1);
        });
    });

    describe('Export Operations', () => {
        it('should export diagram as SQL', () => {
            const diagram = createDiagram(storage, {
                name: 'Test Database',
                databaseType: DatabaseType.POSTGRESQL,
            });

            addTable(storage, {
                diagramId: diagram.id,
                name: 'users',
                fields: [
                    { name: 'id', type: 'INTEGER', primaryKey: true },
                    { name: 'email', type: 'VARCHAR(255)', unique: true },
                ],
            });

            const sql = exportSQL(storage, { diagramId: diagram.id });

            expect(sql).toContain('CREATE TABLE users');
            expect(sql).toContain('id INTEGER PRIMARY KEY');
            expect(sql).toContain('email VARCHAR(255) UNIQUE');
        });

        it('should export diagram as DBML', () => {
            const diagram = createDiagram(storage, {
                name: 'Test Database',
                databaseType: DatabaseType.MYSQL,
            });

            addTable(storage, {
                diagramId: diagram.id,
                name: 'products',
                fields: [
                    { name: 'id', type: 'INT', primaryKey: true },
                    { name: 'name', type: 'VARCHAR(100)', nullable: false },
                    { name: 'price', type: 'DECIMAL(10,2)' },
                ],
            });

            const dbml = exportDBML(storage, { diagramId: diagram.id });

            expect(dbml).toContain('Table products');
            expect(dbml).toContain('id INT');
            expect(dbml).toContain('pk');
            expect(dbml).toContain('name VARCHAR(100)');
            expect(dbml).toContain('not null');
        });
    });

    describe('Error Handling', () => {
        it('should throw error for invalid diagram ID', () => {
            expect(() => {
                addTable(storage, {
                    diagramId: 'invalid-id',
                    name: 'users',
                    fields: [],
                });
            }).toThrow('Diagram not found');
        });

        it('should throw error for invalid table IDs in relationship', () => {
            const diagram = createDiagram(storage, {
                name: 'Test Database',
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(() => {
                addRelationship(storage, {
                    diagramId: diagram.id,
                    sourceTableId: 'invalid-id',
                    targetTableId: 'invalid-id',
                    sourceFieldId: 'field1',
                    targetFieldId: 'field2',
                    type: 'one_to_many',
                });
            }).toThrow('Source or target table not found');
        });
    });
});

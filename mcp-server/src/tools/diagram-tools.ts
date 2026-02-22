/**
 * MCP Tools for diagram manipulation
 */

import { nanoid } from 'nanoid';
import type {
    Diagram,
    DiagramStorage,
    DBTable,
    DBField,
    DBRelationship,
    DatabaseType,
    Area,
    Note,
} from '../types.js';

export interface CreateDiagramParams {
    name: string;
    databaseType: DatabaseType;
}

export function createDiagram(
    storage: DiagramStorage,
    params: CreateDiagramParams
): Diagram {
    const diagram: Diagram = {
        id: nanoid(),
        name: params.name,
        databaseType: params.databaseType,
        tables: [],
        relationships: [],
        areas: [],
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    storage.saveDiagram(diagram);
    return diagram;
}

export interface AddTableParams {
    diagramId: string;
    name: string;
    schema?: string;
    fields: Array<{
        name: string;
        type: string;
        primaryKey?: boolean;
        unique?: boolean;
        nullable?: boolean;
        default?: string;
        comment?: string;
    }>;
    x?: number;
    y?: number;
    color?: string;
}

export function addTable(
    storage: DiagramStorage,
    params: AddTableParams
): DBTable {
    const diagram = storage.getDiagram(params.diagramId);
    if (!diagram) {
        throw new Error(`Diagram not found: ${params.diagramId}`);
    }

    const table: DBTable = {
        id: nanoid(),
        name: params.name,
        schema: params.schema,
        fields: params.fields.map((field) => ({
            id: nanoid(),
            ...field,
        })),
        x: params.x ?? 0,
        y: params.y ?? 0,
        color: params.color,
    };

    diagram.tables.push(table);
    storage.saveDiagram(diagram);

    return table;
}

export interface AddRelationshipParams {
    diagramId: string;
    sourceTableId: string;
    targetTableId: string;
    sourceFieldId: string;
    targetFieldId: string;
    type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
    name?: string;
}

export function addRelationship(
    storage: DiagramStorage,
    params: AddRelationshipParams
): DBRelationship {
    const diagram = storage.getDiagram(params.diagramId);
    if (!diagram) {
        throw new Error(`Diagram not found: ${params.diagramId}`);
    }

    const sourceTable = diagram.tables.find((t) => t.id === params.sourceTableId);
    const targetTable = diagram.tables.find((t) => t.id === params.targetTableId);

    if (!sourceTable || !targetTable) {
        throw new Error('Source or target table not found');
    }

    const relationship: DBRelationship = {
        id: nanoid(),
        name: params.name || `${sourceTable.name}_${targetTable.name}`,
        sourceTableId: params.sourceTableId,
        targetTableId: params.targetTableId,
        sourceFieldId: params.sourceFieldId,
        targetFieldId: params.targetFieldId,
        type: params.type,
    };

    diagram.relationships.push(relationship);
    storage.saveDiagram(diagram);

    return relationship;
}

export interface AddAreaParams {
    diagramId: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
}

export function addArea(storage: DiagramStorage, params: AddAreaParams): Area {
    const diagram = storage.getDiagram(params.diagramId);
    if (!diagram) {
        throw new Error(`Diagram not found: ${params.diagramId}`);
    }

    const area: Area = {
        id: nanoid(),
        name: params.name,
        x: params.x,
        y: params.y,
        width: params.width,
        height: params.height,
        color: params.color,
    };

    if (!diagram.areas) {
        diagram.areas = [];
    }
    diagram.areas.push(area);
    storage.saveDiagram(diagram);

    return area;
}

export interface AddNoteParams {
    diagramId: string;
    content: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: string;
}

export function addNote(storage: DiagramStorage, params: AddNoteParams): Note {
    const diagram = storage.getDiagram(params.diagramId);
    if (!diagram) {
        throw new Error(`Diagram not found: ${params.diagramId}`);
    }

    const note: Note = {
        id: nanoid(),
        content: params.content,
        x: params.x,
        y: params.y,
        width: params.width,
        height: params.height,
        color: params.color,
    };

    if (!diagram.notes) {
        diagram.notes = [];
    }
    diagram.notes.push(note);
    storage.saveDiagram(diagram);

    return note;
}

export interface ExportSQLParams {
    diagramId: string;
}

export function exportSQL(
    storage: DiagramStorage,
    params: ExportSQLParams
): string {
    const diagram = storage.getDiagram(params.diagramId);
    if (!diagram) {
        throw new Error(`Diagram not found: ${params.diagramId}`);
    }

    let sql = `-- Database: ${diagram.name}\n`;
    sql += `-- Type: ${diagram.databaseType}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;

    // Create tables
    for (const table of diagram.tables) {
        sql += `CREATE TABLE ${table.schema ? `${table.schema}.` : ''}${table.name} (\n`;

        const fieldDefs = table.fields.map((field) => {
            let def = `  ${field.name} ${field.type}`;
            if (field.primaryKey) def += ' PRIMARY KEY';
            if (field.unique) def += ' UNIQUE';
            if (!field.nullable) def += ' NOT NULL';
            if (field.default) def += ` DEFAULT ${field.default}`;
            return def;
        });

        sql += fieldDefs.join(',\n');
        sql += '\n);\n\n';
    }

    // Create foreign keys
    for (const rel of diagram.relationships) {
        const sourceTable = diagram.tables.find(
            (t) => t.id === rel.sourceTableId
        );
        const targetTable = diagram.tables.find(
            (t) => t.id === rel.targetTableId
        );
        const sourceField = sourceTable?.fields.find(
            (f) => f.id === rel.sourceFieldId
        );
        const targetField = targetTable?.fields.find(
            (f) => f.id === rel.targetFieldId
        );

        if (sourceTable && targetTable && sourceField && targetField) {
            sql += `ALTER TABLE ${sourceTable.name}\n`;
            sql += `  ADD CONSTRAINT fk_${rel.name}\n`;
            sql += `  FOREIGN KEY (${sourceField.name})\n`;
            sql += `  REFERENCES ${targetTable.name}(${targetField.name});\n\n`;
        }
    }

    return sql;
}

export interface ExportDBMLParams {
    diagramId: string;
}

export function exportDBML(
    storage: DiagramStorage,
    params: ExportDBMLParams
): string {
    const diagram = storage.getDiagram(params.diagramId);
    if (!diagram) {
        throw new Error(`Diagram not found: ${params.diagramId}`);
    }

    let dbml = `// Database: ${diagram.name}\n`;
    dbml += `// Type: ${diagram.databaseType}\n\n`;

    // Tables
    for (const table of diagram.tables) {
        dbml += `Table ${table.schema ? `${table.schema}.` : ''}${table.name} {\n`;
        for (const field of table.fields) {
            dbml += `  ${field.name} ${field.type}`;
            const attrs = [];
            if (field.primaryKey) attrs.push('pk');
            if (field.unique) attrs.push('unique');
            if (!field.nullable) attrs.push('not null');
            if (field.default) attrs.push(`default: ${field.default}`);
            if (attrs.length > 0) {
                dbml += ` [${attrs.join(', ')}]`;
            }
            if (field.comment) {
                dbml += ` // ${field.comment}`;
            }
            dbml += '\n';
        }
        dbml += '}\n\n';
    }

    // Relationships
    for (const rel of diagram.relationships) {
        const sourceTable = diagram.tables.find(
            (t) => t.id === rel.sourceTableId
        );
        const targetTable = diagram.tables.find(
            (t) => t.id === rel.targetTableId
        );
        const sourceField = sourceTable?.fields.find(
            (f) => f.id === rel.sourceFieldId
        );
        const targetField = targetTable?.fields.find(
            (f) => f.id === rel.targetFieldId
        );

        if (sourceTable && targetTable && sourceField && targetField) {
            const refType =
                rel.type === 'one_to_one'
                    ? '-'
                    : rel.type === 'one_to_many'
                      ? '<'
                      : '>';
            dbml += `Ref: ${sourceTable.name}.${sourceField.name} ${refType} ${targetTable.name}.${targetField.name}\n`;
        }
    }

    return dbml;
}

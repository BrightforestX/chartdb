/**
 * ChartDB domain types for MCP server
 * Simplified versions of the main ChartDB types
 */

export enum DatabaseType {
    POSTGRESQL = 'postgresql',
    MYSQL = 'mysql',
    SQL_SERVER = 'sql_server',
    MARIADB = 'mariadb',
    SQLITE = 'sqlite',
    COCKROACHDB = 'cockroachdb',
    CLICKHOUSE = 'clickhouse',
}

export interface DBField {
    id: string;
    name: string;
    type: string;
    primaryKey?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: string;
    comment?: string;
}

export interface DBTable {
    id: string;
    name: string;
    schema?: string;
    fields: DBField[];
    indexes?: DBIndex[];
    color?: string;
    x?: number;
    y?: number;
}

export interface DBIndex {
    id: string;
    name: string;
    unique?: boolean;
    fieldIds: string[];
}

export interface DBRelationship {
    id: string;
    name: string;
    sourceTableId: string;
    targetTableId: string;
    sourceFieldId: string;
    targetFieldId: string;
    type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
}

export interface Area {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
}

export interface Note {
    id: string;
    content: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: string;
}

export interface Diagram {
    id: string;
    name: string;
    databaseType: DatabaseType;
    tables: DBTable[];
    relationships: DBRelationship[];
    areas?: Area[];
    notes?: Note[];
    createdAt: string;
    updatedAt: string;
}

export interface DiagramStorage {
    diagrams: Map<string, Diagram>;
    saveDiagram(diagram: Diagram): void;
    getDiagram(id: string): Diagram | undefined;
    listDiagrams(): Diagram[];
    deleteDiagram(id: string): boolean;
}

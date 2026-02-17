# Database Schema Guidelines

## Overview
ChartDB supports multiple database dialects (PostgreSQL, MySQL, SQLite, SQL Server, etc.). Follow these guidelines when working with database schemas, SQL parsing, and import/export functionality.

## Supported Databases

ChartDB supports:
- PostgreSQL (including Supabase, Timescale)
- MySQL
- MariaDB
- SQL Server (MSSQL)
- SQLite (including Cloudflare D1)
- CockroachDB
- ClickHouse

## Database Dialect Architecture

### Dialect Structure

```
src/lib/data/
├── sql-import/
│   └── dialect-importers/
│       ├── postgresql/
│       ├── mysql/
│       ├── sqlite/
│       └── mssql/
├── sql-export/
│   └── dialect-exporters/
│       ├── postgresql/
│       ├── mysql/
│       ├── sqlite/
│       └── mssql/
└── dbml/
    ├── import/
    └── export/
```

## Type System

### Database Type Mapping

```typescript
// ✅ Good - Define type mappings
export interface DatabaseType {
    name: string;
    displayName: string;
    length?: boolean;      // Supports length (VARCHAR(255))
    precision?: boolean;   // Supports precision (DECIMAL(10,2))
    scale?: boolean;       // Supports scale
    array?: boolean;       // Supports arrays (PostgreSQL)
}

export const POSTGRESQL_TYPES: DatabaseType[] = [
    { name: 'integer', displayName: 'INTEGER' },
    { name: 'bigint', displayName: 'BIGINT' },
    { name: 'varchar', displayName: 'VARCHAR', length: true },
    { name: 'text', displayName: 'TEXT' },
    { name: 'boolean', displayName: 'BOOLEAN' },
    { name: 'timestamp', displayName: 'TIMESTAMP' },
    { name: 'uuid', displayName: 'UUID' },
    { name: 'json', displayName: 'JSON' },
    { name: 'jsonb', displayName: 'JSONB' },
    { name: 'integer[]', displayName: 'INTEGER[]', array: true },
];

// ✅ Good - Type normalization
export function normalizeType(type: string, dialect: DatabaseDialect): string {
    const typeMap: Record<DatabaseDialect, Record<string, string>> = {
        postgresql: {
            'int': 'integer',
            'int4': 'integer',
            'int8': 'bigint',
            'varchar': 'character varying',
        },
        mysql: {
            'int': 'integer',
            'tinyint(1)': 'boolean',
        },
        // ...
    };

    return typeMap[dialect]?.[type.toLowerCase()] ?? type;
}
```

## SQL Import

### Import Query Pattern

Each database has a "magic query" to extract schema:

```typescript
// ✅ Good - PostgreSQL import query
export const POSTGRESQL_SCHEMA_QUERY = `
SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    tc.constraint_type,
    kcu.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.column_name = kcu.column_name 
    AND c.table_name = kcu.table_name
-- More joins...
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY t.table_name, c.ordinal_position;
`;
```

### Import Parser

```typescript
// ✅ Good - Importer interface
export interface DatabaseImporter {
    parseSchema(queryResult: unknown[]): Diagram;
    getSchemaQuery(): string;
    validateQueryResult(result: unknown): boolean;
}

// ✅ Good - PostgreSQL importer
export class PostgreSQLImporter implements DatabaseImporter {
    parseSchema(rows: PostgreSQLRow[]): Diagram {
        const tables = new Map<string, Table>();
        const relationships: Relationship[] = [];

        for (const row of rows) {
            // Parse tables
            if (!tables.has(row.table_name)) {
                tables.set(row.table_name, {
                    id: nanoid(),
                    name: row.table_name,
                    schema: row.table_schema,
                    fields: [],
                });
            }

            // Parse fields
            const table = tables.get(row.table_name)!;
            table.fields.push({
                id: nanoid(),
                name: row.column_name,
                type: this.mapType(row.data_type),
                nullable: row.is_nullable === 'YES',
                primaryKey: row.constraint_type === 'PRIMARY KEY',
                unique: row.constraint_type === 'UNIQUE',
                defaultValue: row.column_default,
            });

            // Parse relationships
            if (row.foreign_table_name) {
                relationships.push({
                    id: nanoid(),
                    sourceTableId: table.id,
                    sourceFieldId: field.id,
                    targetTableId: this.findTableId(row.foreign_table_name),
                    targetFieldId: this.findFieldId(row.foreign_column_name),
                    type: 'many-to-one',
                });
            }
        }

        return {
            id: nanoid(),
            name: 'Imported Diagram',
            tables: Array.from(tables.values()),
            relationships,
            databaseType: 'postgresql',
        };
    }

    private mapType(pgType: string): string {
        const typeMap: Record<string, string> = {
            'character varying': 'varchar',
            'timestamp without time zone': 'timestamp',
            'integer': 'integer',
            // ...
        };
        return typeMap[pgType] ?? pgType;
    }

    getSchemaQuery(): string {
        return POSTGRESQL_SCHEMA_QUERY;
    }

    validateQueryResult(result: unknown): boolean {
        return Array.isArray(result) && result.length > 0;
    }
}
```

## SQL Export

### Export Generator

```typescript
// ✅ Good - Exporter interface
export interface DatabaseExporter {
    generateDDL(diagram: Diagram): string;
    generateCreateTable(table: Table): string;
    generateAlterTable(table: Table, relationships: Relationship[]): string;
}

// ✅ Good - PostgreSQL exporter
export class PostgreSQLExporter implements DatabaseExporter {
    generateDDL(diagram: Diagram): string {
        const parts: string[] = [];

        // Generate tables
        for (const table of diagram.tables) {
            parts.push(this.generateCreateTable(table));
        }

        // Generate foreign keys
        for (const table of diagram.tables) {
            const rels = diagram.relationships.filter(
                r => r.sourceTableId === table.id
            );
            if (rels.length > 0) {
                parts.push(this.generateAlterTable(table, rels));
            }
        }

        return parts.join('\n\n');
    }

    generateCreateTable(table: Table): string {
        const fields = table.fields.map(f => this.generateField(f));
        const primaryKeys = table.fields
            .filter(f => f.primaryKey)
            .map(f => f.name);

        let sql = `CREATE TABLE ${this.escapeIdentifier(table.name)} (\n`;
        sql += fields.join(',\n');

        if (primaryKeys.length > 0) {
            sql += `,\n  PRIMARY KEY (${primaryKeys.map(k => this.escapeIdentifier(k)).join(', ')})`;
        }

        sql += '\n);';
        return sql;
    }

    private generateField(field: Field): string {
        let sql = `  ${this.escapeIdentifier(field.name)} ${field.type}`;

        if (field.length) {
            sql += `(${field.length})`;
        }

        if (!field.nullable) {
            sql += ' NOT NULL';
        }

        if (field.defaultValue) {
            sql += ` DEFAULT ${field.defaultValue}`;
        }

        if (field.unique) {
            sql += ' UNIQUE';
        }

        return sql;
    }

    generateAlterTable(table: Table, relationships: Relationship[]): string {
        const statements = relationships.map(rel => {
            const sourceField = table.fields.find(f => f.id === rel.sourceFieldId);
            const targetTable = this.findTable(rel.targetTableId);
            const targetField = targetTable?.fields.find(f => f.id === rel.targetFieldId);

            return `ALTER TABLE ${this.escapeIdentifier(table.name)}
  ADD CONSTRAINT ${this.escapeIdentifier(`fk_${table.name}_${sourceField?.name}`)}
  FOREIGN KEY (${this.escapeIdentifier(sourceField!.name)})
  REFERENCES ${this.escapeIdentifier(targetTable!.name)} (${this.escapeIdentifier(targetField!.name)});`;
        });

        return statements.join('\n\n');
    }

    private escapeIdentifier(identifier: string): string {
        return `"${identifier.replace(/"/g, '""')}"`;
    }
}
```

## DBML Support

### DBML Import/Export

```typescript
// ✅ Good - DBML parser using @dbml/core
import { Parser } from '@dbml/core';

export function importFromDBML(dbmlString: string): Diagram {
    const database = Parser.parse(dbmlString, 'dbml');

    const tables = database.schemas[0].tables.map(table => ({
        id: nanoid(),
        name: table.name,
        fields: table.fields.map(field => ({
            id: nanoid(),
            name: field.name,
            type: field.type.type_name,
            nullable: !field.not_null,
            primaryKey: field.pk,
            unique: field.unique,
        })),
    }));

    const relationships = database.schemas[0].refs.map(ref => ({
        id: nanoid(),
        sourceTableId: findTableId(ref.endpoints[0].tableName),
        sourceFieldId: findFieldId(ref.endpoints[0].fieldNames[0]),
        targetTableId: findTableId(ref.endpoints[1].tableName),
        targetFieldId: findFieldId(ref.endpoints[1].fieldNames[0]),
        type: ref.endpoints[0].relation as RelationType,
    }));

    return {
        id: nanoid(),
        name: 'DBML Import',
        tables,
        relationships,
        databaseType: 'postgresql',
    };
}

export function exportToDBML(diagram: Diagram): string {
    let dbml = '';

    // Export tables
    for (const table of diagram.tables) {
        dbml += `Table ${table.name} {\n`;
        for (const field of table.fields) {
            dbml += `  ${field.name} ${field.type}`;
            if (field.primaryKey) dbml += ' [pk]';
            if (!field.nullable) dbml += ' [not null]';
            if (field.unique) dbml += ' [unique]';
            dbml += '\n';
        }
        dbml += '}\n\n';
    }

    // Export relationships
    for (const rel of diagram.relationships) {
        const sourceTable = diagram.tables.find(t => t.id === rel.sourceTableId);
        const targetTable = diagram.tables.find(t => t.id === rel.targetTableId);
        const sourceField = sourceTable?.fields.find(f => f.id === rel.sourceFieldId);
        const targetField = targetTable?.fields.find(f => f.id === rel.targetFieldId);

        dbml += `Ref: ${sourceTable?.name}.${sourceField?.name} ${rel.type === 'one-to-many' ? '>' : '-'} ${targetTable?.name}.${targetField?.name}\n`;
    }

    return dbml;
}
```

## SQL Parsing

### Using node-sql-parser

```typescript
import { Parser } from 'node-sql-parser';

// ✅ Good - Parse SQL statements
export function parseSQLStatements(sql: string, dialect: DatabaseDialect): Diagram {
    const parser = new Parser();
    const dialectMap = {
        postgresql: 'postgresql',
        mysql: 'mysql',
        sqlite: 'sqlite',
        mssql: 'transactsql',
    };

    try {
        const ast = parser.astify(sql, {
            database: dialectMap[dialect],
        });

        return convertASTToDiagram(ast, dialect);
    } catch (error) {
        throw new Error(`Failed to parse SQL: ${error.message}`);
    }
}

function convertASTToDiagram(ast: any, dialect: DatabaseDialect): Diagram {
    const tables: Table[] = [];
    const relationships: Relationship[] = [];

    const statements = Array.isArray(ast) ? ast : [ast];

    for (const stmt of statements) {
        if (stmt.type === 'create' && stmt.keyword === 'table') {
            const table = parseCreateTable(stmt);
            tables.push(table);

            // Extract foreign keys
            const fks = extractForeignKeys(stmt);
            relationships.push(...fks);
        }
    }

    return {
        id: nanoid(),
        name: 'SQL Import',
        tables,
        relationships,
        databaseType: dialect,
    };
}
```

## Field Types and Constraints

### Field Definition

```typescript
// ✅ Good - Comprehensive field model
export interface Field {
    id: string;
    name: string;
    type: string;
    length?: number;
    precision?: number;
    scale?: number;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    autoIncrement?: boolean;
    defaultValue?: string;
    comment?: string;
    collation?: string;
    check?: string;
}
```

### Constraint Handling

```typescript
// ✅ Good - Parse constraints
export function parseConstraints(field: any): Partial<Field> {
    return {
        nullable: !field.not_null,
        primaryKey: field.primary_key,
        unique: field.unique,
        autoIncrement: field.auto_increment,
        defaultValue: field.default_value,
        check: field.check_constraint,
    };
}
```

## Relationship Types

```typescript
// ✅ Good - Relationship types
export type RelationType = 
    | 'one-to-one'
    | 'one-to-many'
    | 'many-to-one'
    | 'many-to-many';

export type Cardinality =
    | '0..1'  // Zero or one
    | '1'     // Exactly one
    | '0..*'  // Zero or more
    | '1..*'; // One or more

export interface Relationship {
    id: string;
    name?: string;
    sourceTableId: string;
    sourceFieldId: string;
    targetTableId: string;
    targetFieldId: string;
    type: RelationType;
    sourceCardinality?: Cardinality;
    targetCardinality?: Cardinality;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}
```

## Adding New Database Support

### Steps to Add New Database

1. **Create dialect directory**
```
src/lib/data/
├── sql-import/dialect-importers/newdb/
└── sql-export/dialect-exporters/newdb/
```

2. **Implement importer**
```typescript
export class NewDBImporter implements DatabaseImporter {
    parseSchema(rows: any[]): Diagram { /* ... */ }
    getSchemaQuery(): string { /* ... */ }
    validateQueryResult(result: unknown): boolean { /* ... */ }
}
```

3. **Implement exporter**
```typescript
export class NewDBExporter implements DatabaseExporter {
    generateDDL(diagram: Diagram): string { /* ... */ }
    generateCreateTable(table: Table): string { /* ... */ }
    generateAlterTable(table: Table, rels: Relationship[]): string { /* ... */ }
}
```

4. **Register in databases.ts**
```typescript
export const DATABASES: DatabaseConfig[] = [
    // ...
    {
        id: 'newdb',
        name: 'NewDB',
        importer: NewDBImporter,
        exporter: NewDBExporter,
        icon: 'newdb-icon',
    },
];
```

5. **Add tests**
```typescript
describe('NewDBImporter', () => {
    it('parses schema correctly', () => {
        const importer = new NewDBImporter();
        const diagram = importer.parseSchema(mockData);
        expect(diagram.tables).toHaveLength(3);
    });
});
```

## Best Practices Summary

### Do's
- ✅ Use consistent type mapping across dialects
- ✅ Escape identifiers properly (quotes, backticks)
- ✅ Handle schema names correctly
- ✅ Support array types (PostgreSQL)
- ✅ Parse and preserve constraints
- ✅ Handle relationship cascades
- ✅ Validate import data
- ✅ Provide meaningful error messages
- ✅ Test with real database schemas
- ✅ Support DBML format
- ✅ Handle edge cases (reserved words, special characters)
- ✅ Document dialect-specific features

### Don'ts
- ❌ Don't assume all databases support the same types
- ❌ Don't forget to escape identifiers
- ❌ Don't ignore nullable constraints
- ❌ Don't lose precision/scale information
- ❌ Don't hardcode schema names
- ❌ Don't forget to handle errors in parsing
- ❌ Don't assume referential actions (CASCADE, etc.)
- ❌ Don't ignore composite keys
- ❌ Don't forget to test with real data
- ❌ Don't mix dialect-specific syntax

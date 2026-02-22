/**
 * MCP Prompts for schema generation and optimization
 */

export interface GenerateDiagramPromptArgs {
    description: string;
    databaseType: string;
}

export function generateDiagramPrompt(args: GenerateDiagramPromptArgs): string {
    return `You are a database schema expert. Generate a complete database schema based on the following description:

Description: ${args.description}
Database Type: ${args.databaseType}

Please provide a well-normalized database schema with:
1. Tables with appropriate fields
2. Primary keys and foreign keys
3. Proper data types for the target database
4. Indexes for frequently queried fields
5. Relationships between tables

Use the ChartDB MCP tools to:
1. Create a new diagram with create_diagram
2. Add tables with add_table
3. Add relationships with add_relationship
4. Optionally organize with areas using add_area

Ensure the schema follows best practices for ${args.databaseType}.`;
}

export interface OptimizeSchemaPromptArgs {
    diagramId: string;
}

export function optimizeSchemaPrompt(args: OptimizeSchemaPromptArgs): string {
    return `You are a database performance expert. Analyze the diagram and provide optimization suggestions.

Diagram ID: ${args.diagramId}

First, use the diagram://${args.diagramId} resource to examine the current schema.

Then provide recommendations for:
1. Missing indexes on foreign keys or frequently queried fields
2. Normalization issues (over-normalization or under-normalization)
3. Data type optimizations
4. Potential performance bottlenecks
5. Missing relationships or constraints
6. Table and field naming conventions

For each suggestion, explain:
- The issue identified
- Why it matters for performance/maintainability
- How to fix it (including specific field names and tables)`;
}

export interface ExplainDiagramPromptArgs {
    diagramId: string;
}

export function explainDiagramPrompt(args: ExplainDiagramPromptArgs): string {
    return `You are a database documentation expert. Explain the database schema in clear, non-technical terms.

Diagram ID: ${args.diagramId}

First, retrieve the diagram using the diagram://${args.diagramId} resource.

Then provide:
1. Overview of what this database models (the domain)
2. Explanation of each table's purpose
3. Description of key relationships
4. Data flow and typical queries
5. Any notable design patterns used

Use clear language that both technical and non-technical stakeholders can understand.`;
}

export interface MigrateDatabasePromptArgs {
    diagramId: string;
    targetDatabaseType: string;
}

export function migrateDatabasePrompt(args: MigrateDatabasePromptArgs): string {
    return `You are a database migration expert. Help migrate this schema to ${args.targetDatabaseType}.

Source Diagram ID: ${args.diagramId}

First, examine the current schema using diagram://${args.diagramId}.

Then:
1. Identify data type differences between the source and target databases
2. Note any features not available in ${args.targetDatabaseType}
3. Suggest equivalent implementations for missing features
4. Create a new diagram for ${args.targetDatabaseType} with appropriate adjustments
5. Provide migration notes and warnings

Use create_diagram and related tools to create the migrated schema.`;
}

export interface ValidateSchemaPromptArgs {
    diagramId: string;
}

export function validateSchemaPrompt(args: ValidateSchemaPromptArgs): string {
    return `You are a database design validator. Check this schema for common issues and anti-patterns.

Diagram ID: ${args.diagramId}

Retrieve and analyze the diagram, then check for:
1. Missing primary keys
2. Orphaned tables (no relationships)
3. Circular dependencies
4. Tables with too many fields (potential normalization issues)
5. Inconsistent naming conventions
6. Missing NOT NULL constraints on important fields
7. Potentially missing indexes
8. Data type mismatches in relationships

Provide a validation report with severity levels (error, warning, info) and recommendations.`;
}

export const PROMPT_TEMPLATES = {
    generate_diagram: {
        name: 'generate_diagram',
        description: 'Generate a database schema from a description',
        arguments: [
            {
                name: 'description',
                description: 'Natural language description of the database schema',
                required: true,
            },
            {
                name: 'databaseType',
                description: 'Target database type (postgresql, mysql, etc.)',
                required: true,
            },
        ],
    },
    optimize_schema: {
        name: 'optimize_schema',
        description: 'Get optimization suggestions for a database schema',
        arguments: [
            {
                name: 'diagramId',
                description: 'ID of the diagram to optimize',
                required: true,
            },
        ],
    },
    explain_diagram: {
        name: 'explain_diagram',
        description: 'Get a clear explanation of a database schema',
        arguments: [
            {
                name: 'diagramId',
                description: 'ID of the diagram to explain',
                required: true,
            },
        ],
    },
    migrate_database: {
        name: 'migrate_database',
        description: 'Migrate a schema to a different database type',
        arguments: [
            {
                name: 'diagramId',
                description: 'ID of the source diagram',
                required: true,
            },
            {
                name: 'targetDatabaseType',
                description: 'Target database type',
                required: true,
            },
        ],
    },
    validate_schema: {
        name: 'validate_schema',
        description: 'Validate a schema for common issues',
        arguments: [
            {
                name: 'diagramId',
                description: 'ID of the diagram to validate',
                required: true,
            },
        ],
    },
};

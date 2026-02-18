/**
 * Optimized Prompts for Diagram Generator Agent
 */

/**
 * System prompt for diagram generation
 */
export const GENERATOR_SYSTEM_PROMPT = `You are a database schema designer. Create optimal schemas from descriptions.

Rules:
- Use lowercase_with_underscores for names
- Always include: id (PK), created_at, updated_at
- Add proper FKs and indexes
- Follow normalization best practices (3NF)
- Consider performance and maintainability

Output: JSON with tables[] and relationships[].`;

/**
 * Generation prompt template
 */
export function createGenerationPrompt(description: string, databaseType: string): string {
    return `Generate ${databaseType} schema for: "${description}"

Include:
- Appropriate tables with fields
- Data types suitable for ${databaseType}
- Primary keys, foreign keys
- Essential indexes
- Proper relationships

Return complete JSON diagram structure.`;
}

/**
 * Incremental generation prompt (for adding to existing schema)
 */
export function createIncrementalPrompt(existingSchema: any, addition: string): string {
    const existing = existingSchema.tables.map((t: any) => t.name).join(', ');
    
    return `Existing tables: ${existing}

Add: "${addition}"

Ensure new tables integrate well with existing schema. Reuse FKs where appropriate.`;
}

/**
 * Layout optimization prompt
 */
export function createLayoutPrompt(diagram: any): string {
    return `Optimize layout for ${diagram.tables.length} tables.

Goals:
- Related tables near each other
- Minimize edge crossings
- Hierarchical arrangement (parents above children)
- Balanced distribution

Return: {nodes: [{id, x, y}], groups: [{name, tables[]}]}`;
}

/**
 * Few-shot examples
 */
export const GENERATION_EXAMPLES = [
    {
        input: 'Blog with posts and comments',
        output: {
            tables: [
                {
                    name: 'users',
                    fields: [
                        { name: 'id', type: 'INTEGER', primaryKey: true },
                        { name: 'email', type: 'VARCHAR(255)', unique: true },
                        { name: 'created_at', type: 'TIMESTAMP' },
                    ],
                },
                {
                    name: 'posts',
                    fields: [
                        { name: 'id', type: 'INTEGER', primaryKey: true },
                        { name: 'user_id', type: 'INTEGER' },
                        { name: 'title', type: 'VARCHAR(255)' },
                        { name: 'content', type: 'TEXT' },
                        { name: 'created_at', type: 'TIMESTAMP' },
                    ],
                },
                {
                    name: 'comments',
                    fields: [
                        { name: 'id', type: 'INTEGER', primaryKey: true },
                        { name: 'post_id', type: 'INTEGER' },
                        { name: 'user_id', type: 'INTEGER' },
                        { name: 'content', type: 'TEXT' },
                        { name: 'created_at', type: 'TIMESTAMP' },
                    ],
                },
            ],
            relationships: [
                { sourceTableId: 'posts', targetTableId: 'users', type: 'many_to_one' },
                { sourceTableId: 'comments', targetTableId: 'posts', type: 'many_to_one' },
                { sourceTableId: 'comments', targetTableId: 'users', type: 'many_to_one' },
            ],
        },
    },
];

/**
 * Database-specific type mapping hints
 */
export const TYPE_HINTS = {
    postgresql: 'Use SERIAL for auto-increment, JSONB for JSON, TEXT for long strings',
    mysql: 'Use INT AUTO_INCREMENT for auto-increment, JSON for JSON, TEXT for long strings',
    sqlite: 'Use INTEGER PRIMARY KEY for auto-increment, TEXT for strings',
    sqlserver: 'Use INT IDENTITY for auto-increment, NVARCHAR for strings',
};

/**
 * Domain-specific templates
 */
export const DomainTemplates = {
    ecommerce: `Core entities: users, products, orders, order_items, categories, reviews
Common patterns: cart (session-based), inventory tracking, payment records`,
    
    saas: `Core entities: users, organizations, subscriptions, features, usage_logs
Patterns: multi-tenancy, role-based access, billing cycles`,
    
    social: `Core entities: users, posts, comments, likes, follows, messages
Patterns: activity feeds, notifications, privacy settings`,
    
    cms: `Core entities: users, pages, posts, media, categories, tags
Patterns: versioning, publishing workflow, SEO metadata`,
};

/**
 * Complexity-based prompt selection
 */
export function selectPromptByComplexity(description: string): string {
    const wordCount = description.split(/\s+/).length;
    const hasMultipleEntities = description.match(/\b(and|with|including)\b/gi)?.length || 0;
    
    if (wordCount < 10 && hasMultipleEntities < 2) {
        return 'simple';
    } else if (wordCount < 30 || hasMultipleEntities < 4) {
        return 'moderate';
    } else {
        return 'complex';
    }
}

/**
 * Token-optimized prompts
 */
export const OptimizedPrompts = {
    minimal: (desc: string, db: string) => 
        `${db} schema: ${desc}. JSON w/ tables & rels.`,
    
    standard: (desc: string, db: string) =>
        `Create ${db} schema for: ${desc}\nInclude: PKs, FKs, indexes, timestamps.\nReturn: JSON diagram.`,
    
    detailed: (desc: string, db: string) =>
        `Design comprehensive ${db} database schema for: ${desc}\n\nRequirements:\n- Normalized (3NF)\n- Indexed foreign keys\n- Audit fields (created_at, updated_at)\n- Appropriate data types\n- Logical grouping\n\nProvide complete JSON with tables[] and relationships[].`,
};

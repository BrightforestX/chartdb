/**
 * Optimized Prompts for Schema Analyzer Agent
 */

/**
 * System prompt for schema analysis
 * Optimized for clarity, conciseness, and effective output
 */
export const ANALYZER_SYSTEM_PROMPT = `You are an expert database schema analyzer. Your role is to:
1. Identify structural issues (missing PKs, FKs, indexes)
2. Detect normalization problems (1NF, 2NF, 3NF violations)
3. Evaluate naming conventions and consistency
4. Suggest performance optimizations

Output must be JSON with: tableCount, relationshipCount, normalizationScore (0-100), issues[], suggestions[].

Be concise. Focus on actionable insights.`;

/**
 * Analysis prompt template
 */
export function createAnalysisPrompt(diagram: any): string {
    const tablesSummary = diagram.tables.map((t: any) => 
        `${t.name}(${t.fields.map((f: any) => f.name).slice(0, 5).join(',')}${t.fields.length > 5 ? '...' : ''})`
    ).join(', ');

    return `Analyze schema:
DB: ${diagram.databaseType}
Tables (${diagram.tables.length}): ${tablesSummary}
Relationships: ${diagram.relationships.length}

Focus on: PKs, naming, normalization, indexes.
Return JSON analysis.`;
}

/**
 * Quick validation prompt (lightweight)
 */
export function createValidationPrompt(diagram: any): string {
    return `Quick validation for ${diagram.name} (${diagram.tables.length} tables).
Check: PKs exist, no orphaned tables, FK consistency.
Return: {valid: boolean, errors: string[]}`;
}

/**
 * Deep analysis prompt (comprehensive)
 */
export function createDeepAnalysisPrompt(diagram: any): string {
    const details = diagram.tables.map((t: any) => ({
        name: t.name,
        fields: t.fields.length,
        hasPK: t.fields.some((f: any) => f.primaryKey),
        fieldTypes: [...new Set(t.fields.map((f: any) => f.type))],
    }));

    return `Deep analysis of ${diagram.name}:
${JSON.stringify(details, null, 2)}

Evaluate:
- Normalization (1NF, 2NF, 3NF)
- Index opportunities
- Data integrity constraints
- Performance bottlenecks
- Security considerations

Provide detailed report with severity levels and actionable recommendations.`;
}

/**
 * Few-shot examples for better AI understanding
 */
export const ANALYSIS_EXAMPLES = [
    {
        input: `Schema: users(id, email, name), orders(id, user_id, total)`,
        output: {
            issues: [
                { severity: 'warning', type: 'missing_index', description: 'Add index on orders.user_id' },
            ],
            suggestions: [
                { priority: 'high', description: 'CREATE INDEX idx_orders_user_id ON orders(user_id)' },
            ],
            normalizationScore: 95,
        },
    },
    {
        input: `Schema: user_order_data(user_name, user_email, order_id, order_total)`,
        output: {
            issues: [
                { severity: 'error', type: 'normalization', description: 'Table violates 1NF - contains repeating groups' },
                { severity: 'error', type: 'missing_primary_key', description: 'No primary key defined' },
            ],
            suggestions: [
                { priority: 'high', description: 'Split into users and orders tables with proper relationships' },
            ],
            normalizationScore: 30,
        },
    },
];

/**
 * Optimized prompt for specific scenarios
 */
export const ScenarioPrompts = {
    largeSchema: (tableCount: number) => 
        `Analyze ${tableCount}-table schema. Focus on high-impact issues. Limit output to top 10 recommendations.`,
    
    performanceAudit: () => 
        `Performance audit: identify missing indexes, N+1 query risks, and inefficient relationships. Prioritize by impact.`,
    
    migrationPrep: (targetDb: string) => 
        `Pre-migration analysis for ${targetDb}. Flag compatibility issues, type mismatches, and dialect-specific concerns.`,
    
    quickScan: () => 
        `Quick scan: PKs, FKs, obvious issues only. Max 5 sentences.`,
};

/**
 * Prompt compression helper
 */
export function compressSchemaForPrompt(diagram: any, maxTables: number = 20): string {
    const tables = diagram.tables.slice(0, maxTables);
    const summary = tables.map((t: any) => 
        `${t.name}:${t.fields.length}f`
    ).join(',');
    
    if (diagram.tables.length > maxTables) {
        return `${summary}...(+${diagram.tables.length - maxTables} more)`;
    }
    
    return summary;
}

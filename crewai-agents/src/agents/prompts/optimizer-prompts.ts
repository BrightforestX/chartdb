/**
 * Optimized Prompts for Optimization Agent
 */

/**
 * System prompt for optimization
 */
export const OPTIMIZER_SYSTEM_PROMPT = `You are a database performance expert. Analyze schemas for optimization opportunities.

Focus areas:
- Indexes (missing, redundant, composite)
- Query performance (N+1, inefficient joins)
- Data types (oversized, wrong types)
- Normalization vs denormalization trade-offs
- Partitioning strategies

Output: {score: 0-100, recommendations: [{priority, category, description, implementation}]}`;

/**
 * Optimization prompt template
 */
export function createOptimizationPrompt(diagram: any): string {
    const metrics = {
        tables: diagram.tables.length,
        avgFields: (diagram.tables.reduce((sum: number, t: any) => sum + t.fields.length, 0) / diagram.tables.length).toFixed(1),
        relationships: diagram.relationships.length,
        tablesWithoutPK: diagram.tables.filter((t: any) => !t.fields.some((f: any) => f.primaryKey)).length,
    };

    return `Optimize schema (${metrics.tables} tables, ${metrics.relationships} rels, avg ${metrics.avgFields} fields/table):

Analyze:
1. Missing indexes (${metrics.tablesWithoutPK} tables lack PKs)
2. Performance bottlenecks
3. Normalization issues
4. Type optimizations

Prioritize by impact. Top 5 recommendations.`;
}

/**
 * Performance-focused prompt
 */
export function createPerformancePrompt(diagram: any, queryPatterns?: string[]): string {
    let prompt = `Performance optimization for ${diagram.name}:

Tables: ${diagram.tables.map((t: any) => `${t.name}(${t.fields.length})`).join(', ')}`;

    if (queryPatterns && queryPatterns.length > 0) {
        prompt += `\n\nCommon queries:\n${queryPatterns.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
        prompt += `\n\nOptimize for these query patterns.`;
    }

    prompt += `\n\nFocus: indexes, joins, data types, caching opportunities.`;
    
    return prompt;
}

/**
 * Cost optimization prompt
 */
export function createCostOptimizationPrompt(diagram: any): string {
    return `Cost optimization analysis:

Schema: ${diagram.tables.length} tables, ${diagram.tables.reduce((sum: number, t: any) => sum + t.fields.length, 0)} total fields

Identify:
- Oversized data types (waste storage)
- Unnecessary indexes (waste writes)
- Denormalization opportunities (reduce joins)
- Archival candidates (move cold data)

Estimate potential savings.`;
}

/**
 * Few-shot examples
 */
export const OPTIMIZATION_EXAMPLES = [
    {
        input: { tables: ['users', 'orders', 'order_items'], issues: ['no index on orders.user_id'] },
        output: {
            score: 65,
            recommendations: [
                {
                    priority: 'high',
                    category: 'indexing',
                    description: 'Add index on orders.user_id for faster user order lookups',
                    implementation: 'CREATE INDEX idx_orders_user_id ON orders(user_id);',
                    estimatedImpact: 'high',
                },
            ],
        },
    },
];

/**
 * Scenario-specific prompts
 */
export const OptimizationScenarios = {
    readHeavy: () =>
        `Read-heavy workload optimization:
- Denormalization opportunities
- Computed columns
- Materialized views
- Aggressive indexing
Prioritize read performance over write cost.`,

    writeHeavy: () =>
        `Write-heavy workload optimization:
- Minimize indexes (only critical ones)
- Batch write opportunities
- Partitioning strategies
- Async processing candidates
Prioritize write throughput.`,

    balanced: () =>
        `Balanced workload optimization:
- Essential indexes only
- Normalized design
- Strategic denormalization
- Query-specific indexes
Balance read/write performance.`,

    scale: () =>
        `Scale preparation:
- Sharding keys
- Partitioning strategy
- Index distribution
- Replication considerations
Prepare for horizontal scaling.`,
};

/**
 * Database-specific optimization hints
 */
export const DB_SPECIFIC_HINTS = {
    postgresql: 'Consider: partial indexes, BRIN indexes, table inheritance, JSONB indexes',
    mysql: 'Consider: covering indexes, InnoDB settings, query cache, table partitioning',
    sqlserver: 'Consider: columnstore indexes, memory-optimized tables, table partitioning, filtered indexes',
    mongodb: 'Consider: compound indexes, index intersection, covered queries, sharding keys',
};

/**
 * Priority-based prompt
 */
export function createPriorityPrompt(diagram: any, priority: 'critical' | 'important' | 'nice-to-have'): string {
    const focus = {
        critical: 'Critical issues only: missing PKs, broken FKs, data integrity risks',
        important: 'Important optimizations: performance indexes, normalization, type improvements',
        'nice-to-have': 'Nice-to-have improvements: naming, documentation, best practices',
    };

    return `${focus[priority]}

Schema: ${diagram.tables.length} tables
Priority level: ${priority}

Provide focused recommendations for this priority level only.`;
}

/**
 * ROI-focused prompt
 */
export function createROIPrompt(diagram: any): string {
    return `ROI-focused optimization analysis:

For each recommendation, estimate:
- Implementation effort (low/medium/high)
- Performance improvement (% or factor)
- Risk level (low/medium/high)
- Time to implement

Rank by ROI = (improvement * impact) / (effort * risk)

Top 3 high-ROI optimizations.`;
}

/**
 * Token-efficient prompt variants
 */
export const CompactPrompts = {
    quick: (tableCount: number) =>
        `Quick optimize ${tableCount} tables. Top 3 wins. <200 tokens.`,
    
    standard: (diagram: any) =>
        `Optimize ${diagram.name}: ${diagram.tables.length}T, ${diagram.relationships.length}R. Focus: indexes, types, norm. Top 5.`,
    
    comprehensive: (diagram: any) =>
        `Comprehensive optimization:\n${JSON.stringify(diagram, null, 2)}\n\nFull analysis with implementation details.`,
};

/**
 * Schema Analyzer Agent
 * Analyzes database schemas for issues and patterns
 */

import type { SchemaAnalysis, SchemaIssue, SchemaSuggestion } from '../types.js';

export interface Diagram {
    id: string;
    name: string;
    databaseType: string;
    tables: Array<{
        id: string;
        name: string;
        fields: Array<{
            id: string;
            name: string;
            type: string;
            primaryKey?: boolean;
            unique?: boolean;
            nullable?: boolean;
        }>;
    }>;
    relationships: Array<{
        id: string;
        sourceTableId: string;
        targetTableId: string;
        type: string;
    }>;
}

export class SchemaAnalyzerAgent {
    name = 'Schema Analyzer';
    role = 'Database Schema Expert';
    goal = 'Analyze database schemas and identify issues, patterns, and optimization opportunities';

    async analyze(diagram: Diagram): Promise<SchemaAnalysis> {
        const issues: SchemaIssue[] = [];
        const suggestions: SchemaSuggestion[] = [];

        // Analyze tables
        for (const table of diagram.tables) {
            // Check for primary key
            const hasPrimaryKey = table.fields.some(f => f.primaryKey);
            if (!hasPrimaryKey) {
                issues.push({
                    severity: 'error',
                    type: 'missing_primary_key',
                    description: `Table "${table.name}" does not have a primary key`,
                    affectedTables: [table.name],
                    recommendation: 'Add an ID field with PRIMARY KEY constraint',
                });
            }

            // Check for timestamp fields
            const hasTimestamps = table.fields.some(
                f => f.name === 'created_at' || f.name === 'updated_at'
            );
            if (!hasTimestamps) {
                issues.push({
                    severity: 'info',
                    type: 'missing_timestamps',
                    description: `Table "${table.name}" lacks timestamp fields`,
                    affectedTables: [table.name],
                    recommendation: 'Add created_at and updated_at fields for audit trail',
                });
            }

            // Check naming convention
            if (table.name !== table.name.toLowerCase()) {
                issues.push({
                    severity: 'warning',
                    type: 'naming_convention',
                    description: `Table "${table.name}" does not follow lowercase naming convention`,
                    affectedTables: [table.name],
                    recommendation: 'Use lowercase with underscores for table names',
                });
            }

            // Check for too many fields (potential normalization issue)
            if (table.fields.length > 20) {
                issues.push({
                    severity: 'warning',
                    type: 'too_many_fields',
                    description: `Table "${table.name}" has ${table.fields.length} fields, which may indicate a normalization issue`,
                    affectedTables: [table.name],
                    recommendation: 'Consider splitting into multiple related tables',
                });

                suggestions.push({
                    type: 'normalization',
                    priority: 'high',
                    description: `Table "${table.name}" could benefit from normalization`,
                    implementation: 'Identify groups of related fields and extract them into separate tables',
                });
            }

            // Suggest indexes for foreign keys
            const foreignKeyFields = table.fields.filter(
                f => f.name.endsWith('_id') && !f.primaryKey
            );
            
            for (const field of foreignKeyFields) {
                suggestions.push({
                    type: 'index',
                    priority: 'high',
                    description: `Add index on foreign key "${table.name}.${field.name}"`,
                    implementation: `CREATE INDEX idx_${table.name}_${field.name} ON ${table.name}(${field.name});`,
                });
            }
        }

        // Check for orphaned tables
        const tablesWithRelationships = new Set<string>();
        for (const rel of diagram.relationships) {
            tablesWithRelationships.add(rel.sourceTableId);
            tablesWithRelationships.add(rel.targetTableId);
        }

        for (const table of diagram.tables) {
            if (!tablesWithRelationships.has(table.id) && diagram.tables.length > 1) {
                issues.push({
                    severity: 'warning',
                    type: 'orphaned_table',
                    description: `Table "${table.name}" has no relationships with other tables`,
                    affectedTables: [table.name],
                    recommendation: 'Verify if this table should be related to other tables',
                });
            }
        }

        // Calculate normalization score (simplified)
        const avgFieldsPerTable = diagram.tables.reduce(
            (sum, t) => sum + t.fields.length, 0
        ) / diagram.tables.length;
        
        const normalizedScore = Math.max(0, Math.min(100, 
            100 - (Math.abs(avgFieldsPerTable - 10) * 5)
        ));

        return {
            tableCount: diagram.tables.length,
            relationshipCount: diagram.relationships.length,
            normalizedScore,
            issues,
            suggestions,
        };
    }

    async generateReport(analysis: SchemaAnalysis): Promise<string> {
        let report = '# Schema Analysis Report\n\n';
        
        report += `## Summary\n\n`;
        report += `- Tables: ${analysis.tableCount}\n`;
        report += `- Relationships: ${analysis.relationshipCount}\n`;
        report += `- Normalization Score: ${analysis.normalizedScore.toFixed(1)}/100\n\n`;

        if (analysis.issues.length > 0) {
            report += `## Issues (${analysis.issues.length})\n\n`;
            
            const errors = analysis.issues.filter(i => i.severity === 'error');
            const warnings = analysis.issues.filter(i => i.severity === 'warning');
            const info = analysis.issues.filter(i => i.severity === 'info');

            if (errors.length > 0) {
                report += `### Errors (${errors.length})\n\n`;
                for (const issue of errors) {
                    report += `- **${issue.description}**\n`;
                    report += `  - Recommendation: ${issue.recommendation}\n\n`;
                }
            }

            if (warnings.length > 0) {
                report += `### Warnings (${warnings.length})\n\n`;
                for (const issue of warnings) {
                    report += `- ${issue.description}\n`;
                    report += `  - Recommendation: ${issue.recommendation}\n\n`;
                }
            }

            if (info.length > 0) {
                report += `### Information (${info.length})\n\n`;
                for (const issue of info) {
                    report += `- ${issue.description}\n`;
                    report += `  - Recommendation: ${issue.recommendation}\n\n`;
                }
            }
        }

        if (analysis.suggestions.length > 0) {
            report += `## Optimization Suggestions (${analysis.suggestions.length})\n\n`;
            
            const byPriority = {
                high: analysis.suggestions.filter(s => s.priority === 'high'),
                medium: analysis.suggestions.filter(s => s.priority === 'medium'),
                low: analysis.suggestions.filter(s => s.priority === 'low'),
            };

            for (const [priority, suggestions] of Object.entries(byPriority)) {
                if (suggestions.length > 0) {
                    report += `### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n\n`;
                    for (const suggestion of suggestions) {
                        report += `- ${suggestion.description}\n`;
                        report += `  \`\`\`sql\n  ${suggestion.implementation}\n  \`\`\`\n\n`;
                    }
                }
            }
        }

        return report;
    }
}

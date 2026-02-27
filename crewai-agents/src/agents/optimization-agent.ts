/**
 * Optimization Agent
 * Provides optimization recommendations for database schemas
 */

import type { Diagram } from './schema-analyzer.js';
import type { OptimizationReport, SchemaSuggestion } from '../types.js';

export class OptimizationAgent {
    name = 'Schema Optimizer';
    role = 'Database Performance Expert';
    goal = 'Optimize database schemas for performance, maintainability, and scalability';

    async optimize(diagram: Diagram): Promise<OptimizationReport> {
        const recommendations: SchemaSuggestion[] = [];

        // Analyze normalization
        const normalizationScore = this.analyzeNormalization(diagram, recommendations);

        // Analyze indexing
        const indexingScore = this.analyzeIndexing(diagram, recommendations);

        // Analyze naming conventions
        const namingScore = this.analyzeNaming(diagram, recommendations);

        // Analyze relationships
        const relationshipScore = this.analyzeRelationships(diagram, recommendations);

        // Calculate overall score
        const score = Math.round(
            (normalizationScore + indexingScore + namingScore + relationshipScore) / 4
        );

        // Determine overall status
        let overall: 'excellent' | 'good' | 'needs_improvement' | 'critical';
        if (score >= 90) overall = 'excellent';
        else if (score >= 70) overall = 'good';
        else if (score >= 50) overall = 'needs_improvement';
        else overall = 'critical';

        return {
            overall,
            score,
            metrics: {
                normalization: normalizationScore,
                indexing: indexingScore,
                naming: namingScore,
                relationships: relationshipScore,
            },
            recommendations: recommendations.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }),
        };
    }

    private analyzeNormalization(
        diagram: Diagram,
        recommendations: SchemaSuggestion[]
    ): number {
        let score = 100;

        for (const table of diagram.tables) {
            // Check for too many fields (potential 1NF violation)
            if (table.fields.length > 15) {
                score -= 10;
                recommendations.push({
                    type: 'normalization',
                    priority: 'high',
                    description: `Table "${table.name}" has ${table.fields.length} fields, consider splitting`,
                    implementation: `Identify groups of related fields in "${table.name}" and extract them into separate tables with relationships`,
                });
            }

            // Check for repeated field patterns (potential normalization issue)
            const fieldNames = table.fields.map(f => f.name);
            const repeatedPatterns = this.findRepeatedPatterns(fieldNames);
            
            if (repeatedPatterns.length > 0) {
                score -= 5 * repeatedPatterns.length;
                for (const pattern of repeatedPatterns) {
                    recommendations.push({
                        type: 'normalization',
                        priority: 'medium',
                        description: `Repeated field pattern "${pattern}" in "${table.name}" suggests need for normalization`,
                        implementation: `Create a separate table for "${pattern}" related data and link with a foreign key`,
                    });
                }
            }
        }

        return Math.max(0, score);
    }

    private analyzeIndexing(
        diagram: Diagram,
        recommendations: SchemaSuggestion[]
    ): number {
        let score = 100;
        let missingIndexes = 0;

        for (const table of diagram.tables) {
            // Check for indexes on foreign keys
            const foreignKeys = table.fields.filter(
                f => f.name.endsWith('_id') && !f.primaryKey
            );

            for (const fk of foreignKeys) {
                // In a real implementation, check if index exists
                // For now, assume it's missing
                missingIndexes++;
                score -= 5;
                
                recommendations.push({
                    type: 'index',
                    priority: 'high',
                    description: `Add index on foreign key "${table.name}.${fk.name}" for better join performance`,
                    implementation: `CREATE INDEX idx_${table.name}_${fk.name} ON ${table.name}(${fk.name});`,
                });
            }

            // Check for indexes on frequently queried fields
            const commonQueryFields = table.fields.filter(f =>
                f.name === 'email' ||
                f.name === 'username' ||
                f.name === 'status' ||
                f.name.endsWith('_code')
            );

            for (const field of commonQueryFields) {
                if (!field.unique) {
                    recommendations.push({
                        type: 'index',
                        priority: 'medium',
                        description: `Consider adding index on "${table.name}.${field.name}" if frequently queried`,
                        implementation: `CREATE INDEX idx_${table.name}_${field.name} ON ${table.name}(${field.name});`,
                    });
                }
            }
        }

        return Math.max(0, score);
    }

    private analyzeNaming(
        diagram: Diagram,
        recommendations: SchemaSuggestion[]
    ): number {
        let score = 100;

        for (const table of diagram.tables) {
            // Check table naming convention
            if (table.name !== table.name.toLowerCase()) {
                score -= 5;
                recommendations.push({
                    type: 'naming',
                    priority: 'low',
                    description: `Table "${table.name}" should use lowercase_with_underscores`,
                    implementation: `RENAME TABLE ${table.name} TO ${table.name.toLowerCase()};`,
                });
            }

            // Check if table name is plural
            if (!table.name.endsWith('s') && !table.name.includes('_')) {
                recommendations.push({
                    type: 'naming',
                    priority: 'low',
                    description: `Table "${table.name}" should be plural (e.g., "${table.name}s")`,
                    implementation: `RENAME TABLE ${table.name} TO ${table.name}s;`,
                });
            }

            // Check field naming conventions
            for (const field of table.fields) {
                if (field.name !== field.name.toLowerCase()) {
                    score -= 2;
                    recommendations.push({
                        type: 'naming',
                        priority: 'low',
                        description: `Field "${table.name}.${field.name}" should use lowercase_with_underscores`,
                        implementation: `ALTER TABLE ${table.name} RENAME COLUMN ${field.name} TO ${field.name.toLowerCase()};`,
                    });
                }
            }
        }

        return Math.max(0, score);
    }

    private analyzeRelationships(
        diagram: Diagram,
        recommendations: SchemaSuggestion[]
    ): number {
        let score = 100;

        // Check for missing relationships
        const tablesWithoutRelationships = new Set(
            diagram.tables.map(t => t.id)
        );

        for (const rel of diagram.relationships) {
            tablesWithoutRelationships.delete(rel.sourceTableId);
            tablesWithoutRelationships.delete(rel.targetTableId);
        }

        if (tablesWithoutRelationships.size > 0 && diagram.tables.length > 1) {
            score -= 10 * tablesWithoutRelationships.size;
            
            for (const tableId of tablesWithoutRelationships) {
                const table = diagram.tables.find(t => t.id === tableId);
                if (table) {
                    recommendations.push({
                        type: 'relationship',
                        priority: 'medium',
                        description: `Table "${table.name}" has no relationships with other tables`,
                        implementation: 'Consider if this table should be related to other tables in the schema',
                    });
                }
            }
        }

        // Check for potential many-to-many without junction table
        const tableNames = diagram.tables.map(t => t.name);
        for (let i = 0; i < tableNames.length; i++) {
            for (let j = i + 1; j < tableNames.length; j++) {
                const name1 = tableNames[i];
                const name2 = tableNames[j];
                const junctionName = `${name1}_${name2}`;
                
                // Check if both tables reference each other
                const hasJunction = tableNames.some(name => 
                    name === junctionName || name === `${name2}_${name1}`
                );

                if (!hasJunction) {
                    // Check if many-to-many is needed based on field names
                    const table1 = diagram.tables[i];
                    const table2 = diagram.tables[j];
                    
                    const table1HasRef = table1.fields.some(f => 
                        f.name === `${name2.replace(/s$/, '')}_id`
                    );
                    const table2HasRef = table2.fields.some(f => 
                        f.name === `${name1.replace(/s$/, '')}_id`
                    );

                    if (table1HasRef && table2HasRef) {
                        recommendations.push({
                            type: 'relationship',
                            priority: 'high',
                            description: `Consider a junction table for many-to-many relationship between "${name1}" and "${name2}"`,
                            implementation: `CREATE TABLE ${junctionName} (
  id INTEGER PRIMARY KEY,
  ${name1.replace(/s$/, '')}_id INTEGER NOT NULL,
  ${name2.replace(/s$/, '')}_id INTEGER NOT NULL,
  FOREIGN KEY (${name1.replace(/s$/, '')}_id) REFERENCES ${name1}(id),
  FOREIGN KEY (${name2.replace(/s$/, '')}_id) REFERENCES ${name2}(id)
);`,
                        });
                    }
                }
            }
        }

        return Math.max(0, score);
    }

    private findRepeatedPatterns(fieldNames: string[]): string[] {
        const patterns = [];
        const counts = new Map<string, number>();

        for (const name of fieldNames) {
            const parts = name.split('_');
            if (parts.length > 1) {
                const prefix = parts[0];
                counts.set(prefix, (counts.get(prefix) || 0) + 1);
            }
        }

        for (const [prefix, count] of counts) {
            if (count >= 3) {
                patterns.push(prefix);
            }
        }

        return patterns;
    }

    async generateOptimizationPlan(report: OptimizationReport): Promise<string> {
        let plan = '# Database Optimization Plan\n\n';
        
        plan += `## Overall Assessment: ${report.overall.toUpperCase()}\n`;
        plan += `Score: ${report.score}/100\n\n`;

        plan += `## Metrics Breakdown\n\n`;
        plan += `- Normalization: ${report.metrics.normalization}/100\n`;
        plan += `- Indexing: ${report.metrics.indexing}/100\n`;
        plan += `- Naming: ${report.metrics.naming}/100\n`;
        plan += `- Relationships: ${report.metrics.relationships}/100\n\n`;

        if (report.recommendations.length > 0) {
            plan += `## Recommendations (${report.recommendations.length})\n\n`;

            const byPriority = {
                high: report.recommendations.filter(r => r.priority === 'high'),
                medium: report.recommendations.filter(r => r.priority === 'medium'),
                low: report.recommendations.filter(r => r.priority === 'low'),
            };

            for (const [priority, recs] of Object.entries(byPriority)) {
                if (recs.length > 0) {
                    plan += `### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority (${recs.length})\n\n`;
                    
                    for (let i = 0; i < recs.length; i++) {
                        const rec = recs[i];
                        plan += `${i + 1}. **${rec.description}**\n\n`;
                        plan += `   Implementation:\n   \`\`\`sql\n   ${rec.implementation}\n   \`\`\`\n\n`;
                    }
                }
            }
        }

        plan += `## Next Steps\n\n`;
        plan += `1. Review and prioritize recommendations\n`;
        plan += `2. Test changes in development environment\n`;
        plan += `3. Create migration scripts\n`;
        plan += `4. Deploy changes during maintenance window\n`;
        plan += `5. Monitor performance metrics\n`;

        return plan;
    }
}

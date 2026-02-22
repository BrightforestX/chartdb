/**
 * ChartDB CrewAI Agents - Main Entry Point
 */

export { SchemaAnalyzerAgent } from './agents/schema-analyzer.js';
export { DiagramGeneratorAgent } from './agents/diagram-generator.js';
export { OptimizationAgent } from './agents/optimization-agent.js';
export { SchemaCrew } from './crews/schema-crew.js';

export type {
    SchemaAnalysis,
    SchemaIssue,
    SchemaSuggestion,
    DiagramLayout,
    OptimizationReport,
    AgentResult,
} from './types.js';

import { SchemaCrew } from './crews/schema-crew.js';

/**
 * Command-line interface for testing
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const crew = new SchemaCrew();

    switch (command) {
        case 'generate': {
            const description = args[1];
            const databaseType = args[2] || 'postgresql';

            if (!description) {
                console.error('Usage: npm start generate "<description>" [databaseType]');
                process.exit(1);
            }

            console.log('Generating diagram...\n');
            const result = await crew.generateAndOptimize(description, databaseType);

            if (result.success) {
                console.log('\n📊 Generated Diagram:');
                console.log(JSON.stringify(result.data.diagram, null, 2));
                console.log('\n📋 Analysis:');
                console.log(`  Tables: ${result.data.analysis.tableCount}`);
                console.log(`  Relationships: ${result.data.analysis.relationshipCount}`);
                console.log(`  Issues: ${result.data.analysis.issues.length}`);
                console.log(`  Suggestions: ${result.data.analysis.suggestions.length}`);
                console.log('\n💡 Optimization Score:', result.data.optimization.score);
            } else {
                console.error('Error:', result.error);
                process.exit(1);
            }
            break;
        }

        case 'analyze': {
            // Example diagram for testing
            const exampleDiagram = {
                id: 'test-1',
                name: 'Test Database',
                databaseType: 'postgresql',
                tables: [
                    {
                        id: 'table-1',
                        name: 'User',
                        fields: [
                            { id: 'f1', name: 'id', type: 'INTEGER', primaryKey: true },
                            { id: 'f2', name: 'Email', type: 'VARCHAR(255)' },
                            { id: 'f3', name: 'name', type: 'VARCHAR(100)' },
                        ],
                    },
                    {
                        id: 'table-2',
                        name: 'orders',
                        fields: [
                            { id: 'f4', name: 'id', type: 'INTEGER', primaryKey: true },
                            { id: 'f5', name: 'user_id', type: 'INTEGER' },
                            { id: 'f6', name: 'total', type: 'DECIMAL(10,2)' },
                        ],
                    },
                ],
                relationships: [
                    {
                        id: 'rel-1',
                        sourceTableId: 'table-2',
                        targetTableId: 'table-1',
                        sourceFieldId: 'f5',
                        targetFieldId: 'f1',
                        type: 'many_to_one',
                    },
                ],
            };

            console.log('Analyzing diagram...\n');
            const result = await crew.analyzeDiagram(exampleDiagram);

            if (result.success) {
                console.log('\n' + result.data.analysisReport);
                console.log('\n' + result.data.optimizationPlan);
            } else {
                console.error('Error:', result.error);
                process.exit(1);
            }
            break;
        }

        case 'validate': {
            // Example diagram
            const exampleDiagram = {
                id: 'test-1',
                name: 'Test Database',
                databaseType: 'postgresql',
                tables: [
                    {
                        id: 'table-1',
                        name: 'users',
                        fields: [
                            { id: 'f1', name: 'email', type: 'VARCHAR(255)' },
                        ],
                    },
                ],
                relationships: [],
            };

            console.log('Validating diagram...\n');
            const result = await crew.validateDiagram(exampleDiagram);

            if (result.success) {
                console.log('Validation Result:', result.data.isValid ? '✅ PASSED' : '❌ FAILED');
                console.log('\nSummary:');
                console.log(`  Errors: ${result.data.summary.errorCount}`);
                console.log(`  Warnings: ${result.data.summary.warningCount}`);
                console.log(`  Info: ${result.data.summary.infoCount}`);

                if (result.data.errors.length > 0) {
                    console.log('\nErrors:');
                    result.data.errors.forEach((error: any) => {
                        console.log(`  - ${error.description}`);
                    });
                }
            } else {
                console.error('Error:', result.error);
                process.exit(1);
            }
            break;
        }

        default:
            console.log('ChartDB CrewAI Agents\n');
            console.log('Commands:');
            console.log('  generate "<description>" [databaseType] - Generate and optimize a diagram');
            console.log('  analyze                                  - Analyze example diagram');
            console.log('  validate                                 - Validate example diagram');
            console.log('\nExamples:');
            console.log('  npm start generate "e-commerce database with users, products, and orders" postgresql');
            console.log('  npm start analyze');
            console.log('  npm start validate');
    }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

/**
 * Schema Crew - Orchestrates multiple agents for comprehensive schema management
 */

import { SchemaAnalyzerAgent } from '../agents/schema-analyzer.js';
import { DiagramGeneratorAgent } from '../agents/diagram-generator.js';
import { OptimizationAgent } from '../agents/optimization-agent.js';
import type { Diagram } from '../agents/schema-analyzer.js';
import type { AgentResult } from '../types.js';

export class SchemaCrew {
    private analyzer: SchemaAnalyzerAgent;
    private generator: DiagramGeneratorAgent;
    private optimizer: OptimizationAgent;

    constructor() {
        this.analyzer = new SchemaAnalyzerAgent();
        this.generator = new DiagramGeneratorAgent();
        this.optimizer = new OptimizationAgent();
    }

    /**
     * Generate a new diagram from a description and optimize it
     */
    async generateAndOptimize(description: string, databaseType: string): Promise<AgentResult> {
        try {
            console.log('🤖 Schema Crew: Starting diagram generation...');

            // Step 1: Generate diagram
            console.log('  ↳ Agent 1: Generating diagram structure...');
            const diagram = await this.generator.generate({
                description,
                databaseType,
                name: this.extractName(description) || 'Generated Schema',
            });

            // Step 2: Analyze the generated diagram
            console.log('  ↳ Agent 2: Analyzing schema...');
            const analysis = await this.analyzer.analyze(diagram);

            // Step 3: Optimize the diagram
            console.log('  ↳ Agent 3: Generating optimization recommendations...');
            const optimization = await this.optimizer.optimize(diagram);

            // Step 4: Generate layout
            console.log('  ↳ Agent 4: Optimizing layout...');
            const layout = await this.generator.optimizeLayout(diagram);

            console.log('✅ Schema Crew: Complete!');

            return {
                success: true,
                data: {
                    diagram,
                    analysis,
                    optimization,
                    layout,
                },
                metadata: {
                    agentsUsed: [
                        this.generator.name,
                        this.analyzer.name,
                        this.optimizer.name,
                    ],
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Analyze an existing diagram
     */
    async analyzeDiagram(diagram: Diagram): Promise<AgentResult> {
        try {
            console.log('🤖 Schema Crew: Starting diagram analysis...');

            // Step 1: Analyze schema
            console.log('  ↳ Agent 1: Analyzing schema structure...');
            const analysis = await this.analyzer.analyze(diagram);

            // Step 2: Generate analysis report
            console.log('  ↳ Agent 2: Generating analysis report...');
            const analysisReport = await this.analyzer.generateReport(analysis);

            // Step 3: Get optimization recommendations
            console.log('  ↳ Agent 3: Creating optimization plan...');
            const optimization = await this.optimizer.optimize(diagram);

            // Step 4: Generate optimization plan
            console.log('  ↳ Agent 4: Generating detailed plan...');
            const optimizationPlan = await this.optimizer.generateOptimizationPlan(optimization);

            console.log('✅ Schema Crew: Complete!');

            return {
                success: true,
                data: {
                    analysis,
                    analysisReport,
                    optimization,
                    optimizationPlan,
                },
                metadata: {
                    agentsUsed: [this.analyzer.name, this.optimizer.name],
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Optimize an existing diagram
     */
    async optimizeDiagram(diagram: Diagram): Promise<AgentResult> {
        try {
            console.log('🤖 Schema Crew: Starting optimization...');

            // Step 1: Analyze current state
            console.log('  ↳ Agent 1: Analyzing current schema...');
            const analysis = await this.analyzer.analyze(diagram);

            // Step 2: Generate optimization recommendations
            console.log('  ↳ Agent 2: Generating recommendations...');
            const optimization = await this.optimizer.optimize(diagram);

            // Step 3: Create optimization plan
            console.log('  ↳ Agent 3: Creating implementation plan...');
            const plan = await this.optimizer.generateOptimizationPlan(optimization);

            // Step 4: Optimize layout
            console.log('  ↳ Agent 4: Optimizing visual layout...');
            const layout = await this.generator.optimizeLayout(diagram);

            console.log('✅ Schema Crew: Complete!');

            return {
                success: true,
                data: {
                    currentAnalysis: analysis,
                    optimization,
                    plan,
                    layout,
                },
                metadata: {
                    agentsUsed: [
                        this.analyzer.name,
                        this.optimizer.name,
                        this.generator.name,
                    ],
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Validate a diagram for issues
     */
    async validateDiagram(diagram: Diagram): Promise<AgentResult> {
        try {
            console.log('🤖 Schema Crew: Starting validation...');

            console.log('  ↳ Agent: Analyzing for issues...');
            const analysis = await this.analyzer.analyze(diagram);

            const errors = analysis.issues.filter(i => i.severity === 'error');
            const warnings = analysis.issues.filter(i => i.severity === 'warning');

            const isValid = errors.length === 0;

            console.log(`✅ Schema Crew: Validation complete - ${isValid ? 'PASSED' : 'FAILED'}`);

            return {
                success: true,
                data: {
                    isValid,
                    errors,
                    warnings,
                    summary: {
                        errorCount: errors.length,
                        warningCount: warnings.length,
                        infoCount: analysis.issues.filter(i => i.severity === 'info').length,
                    },
                },
                metadata: {
                    agentsUsed: [this.analyzer.name],
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private extractName(description: string): string | null {
        // Try to extract a name from the description
        const patterns = [
            /(?:create|build|design) (?:a |an )?(.+?) (?:database|schema)/i,
            /(?:database|schema) for (.+)/i,
        ];

        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return null;
    }
}

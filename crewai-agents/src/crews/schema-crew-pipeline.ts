/**
 * Schema Crew with Pipeline Architecture
 * Enhanced version using agent pipeline for better orchestration
 */

import { SchemaAnalyzerAgent } from '../agents/schema-analyzer.js';
import { DiagramGeneratorAgent } from '../agents/diagram-generator.js';
import { OptimizationAgent } from '../agents/optimization-agent.js';
import { createPipeline, loggingMiddleware, createTimingMiddleware } from '../pipeline/agent-pipeline.js';
import { AgentCache } from '../cache/agent-cache.js';
import { createCircuitBreaker } from '../utils/circuit-breaker.js';
import type { Diagram } from '../agents/schema-analyzer.js';
import type { AgentResult } from '../types.js';

export class SchemaCrewPipeline {
    private analyzer: SchemaAnalyzerAgent;
    private generator: DiagramGeneratorAgent;
    private optimizer: OptimizationAgent;
    private analysisCache: AgentCache;
    private optimizationCache: AgentCache;
    private circuitBreaker = createCircuitBreaker();

    constructor() {
        this.analyzer = new SchemaAnalyzerAgent();
        this.generator = new DiagramGeneratorAgent();
        this.optimizer = new OptimizationAgent();
        this.analysisCache = new AgentCache();
        this.optimizationCache = new AgentCache();
    }

    /**
     * Generate and optimize diagram using pipeline
     */
    async generateAndOptimize(description: string, databaseType: string): Promise<AgentResult> {
        const timingMw = createTimingMiddleware();
        
        const pipeline = createPipeline<
            { description: string; databaseType: string },
            AgentResult
        >()
            .use(loggingMiddleware)
            .use(timingMw.middleware)
            .addStage({
                name: 'generate-diagram',
                execute: async (input) => {
                    return await this.circuitBreaker.execute(() =>
                        this.generator.generate({
                            description: input.description,
                            databaseType: input.databaseType,
                            name: this.extractName(input.description) || 'Generated Schema',
                        })
                    );
                },
            })
            .addStage({
                name: 'analyze-and-optimize',
                execute: async (input) => {
                    const diagram = input.diagram || input;
                    const key = this.analysisCache.generateKey('diagram', diagram);

                    const [analysis, optimization] = await Promise.all([
                        (async () => {
                            const cached = this.analysisCache.get(key);
                            if (cached) return cached;
                            const result = await this.circuitBreaker.execute(() =>
                                this.analyzer.analyze(diagram)
                            );
                            this.analysisCache.set(key, result);
                            return result;
                        })(),
                        (async () => {
                            const cached = this.optimizationCache.get(key);
                            if (cached) return cached;
                            const result = await this.circuitBreaker.execute(() =>
                                this.optimizer.optimize(diagram)
                            );
                            this.optimizationCache.set(key, result);
                            return result;
                        })(),
                    ]);

                    return { ...input, diagram, analysis, optimization };
                },
            })
            .addStage({
                name: 'optimize-layout',
                execute: async (input) => {
                    const layout = await this.circuitBreaker.execute(() =>
                        this.generator.optimizeLayout(input.diagram)
                    );
                    return { ...input, layout };
                },
            })
            .addStage({
                name: 'format-result',
                execute: async (input) => {
                    return {
                        success: true,
                        data: {
                            diagram: input.diagram,
                            analysis: input.analysis,
                            optimization: input.optimization,
                            layout: input.layout,
                        },
                        metadata: {
                            agentsUsed: [
                                this.generator.name,
                                this.analyzer.name,
                                this.optimizer.name,
                            ],
                            timestamp: new Date().toISOString(),
                            executionTimeMs: 0,
                        },
                    };
                },
            });

        const result = await pipeline.execute({ description, databaseType });

        if (!result.success) {
            return {
                success: false,
                error: result.error?.message || 'Pipeline execution failed',
            };
        }

        return result.data;
    }

    /**
     * Analyze diagram using pipeline
     */
    async analyzeDiagram(diagram: Diagram): Promise<AgentResult> {
        const pipeline = createPipeline<{ diagram: Diagram }, AgentResult>()
            .use(loggingMiddleware)
            .addStage({
                name: 'parallel-analysis',
                execute: async (input) => {
                    const key = this.analysisCache.generateKey('diagram', input.diagram);

                    const [analysis, optimization] = await Promise.all([
                        (async () => {
                            const cached = this.analysisCache.get(key);
                            if (cached) return cached;
                            const result = await this.analyzer.analyze(input.diagram);
                            this.analysisCache.set(key, result);
                            return result;
                        })(),
                        (async () => {
                            const cached = this.optimizationCache.get(key);
                            if (cached) return cached;
                            const result = await this.optimizer.optimize(input.diagram);
                            this.optimizationCache.set(key, result);
                            return result;
                        })(),
                    ]);

                    return { ...input, analysis, optimization };
                },
            })
            .addStage({
                name: 'generate-reports',
                execute: async (input) => {
                    const [analysisReport, optimizationPlan] = await Promise.all([
                        this.analyzer.generateReport(input.analysis),
                        this.optimizer.generateOptimizationPlan(input.optimization),
                    ]);

                    return { ...input, analysisReport, optimizationPlan };
                },
            })
            .addStage({
                name: 'format-result',
                execute: async (input) => ({
                    success: true,
                    data: {
                        analysis: input.analysis,
                        analysisReport: input.analysisReport,
                        optimization: input.optimization,
                        optimizationPlan: input.optimizationPlan,
                    },
                    metadata: {
                        agentsUsed: [this.analyzer.name, this.optimizer.name],
                        timestamp: new Date().toISOString(),
                    },
                }),
            });

        const result = await pipeline.execute({ diagram });

        if (!result.success) {
            return {
                success: false,
                error: result.error?.message || 'Pipeline execution failed',
            };
        }

        return result.data;
    }

    private extractName(description: string): string | null {
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

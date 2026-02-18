/**
 * Schema Crew - Orchestrates multiple agents for comprehensive schema management
 */

import { SchemaAnalyzerAgent } from '../agents/schema-analyzer.js';
import { DiagramGeneratorAgent } from '../agents/diagram-generator.js';
import { OptimizationAgent } from '../agents/optimization-agent.js';
import { AgentCache } from '../cache/agent-cache.js';
import { createCircuitBreaker, type CircuitBreaker } from '../utils/circuit-breaker.js';
import type { Diagram } from '../agents/schema-analyzer.js';
import type { AgentResult } from '../types.js';

export class SchemaCrew {
    private analyzer: SchemaAnalyzerAgent;
    private generator: DiagramGeneratorAgent;
    private optimizer: OptimizationAgent;
    private analysisCache: AgentCache;
    private optimizationCache: AgentCache;
    private layoutCache: AgentCache;
    private circuitBreaker: CircuitBreaker;

    constructor() {
        this.analyzer = new SchemaAnalyzerAgent();
        this.generator = new DiagramGeneratorAgent();
        this.optimizer = new OptimizationAgent();
        
        this.analysisCache = new AgentCache(50, 10 * 60 * 1000);
        this.optimizationCache = new AgentCache(50, 10 * 60 * 1000);
        this.layoutCache = new AgentCache(30, 15 * 60 * 1000);
        
        this.circuitBreaker = createCircuitBreaker({
            failureThreshold: 3,
            resetTimeout: 30000,
            halfOpenMaxAttempts: 2,
        });
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            analysis: this.analysisCache.getStats(),
            optimization: this.optimizationCache.getStats(),
            layout: this.layoutCache.getStats(),
        };
    }

    /**
     * Get circuit breaker statistics
     */
    getCircuitBreakerStats() {
        return this.circuitBreaker.getStats();
    }

    /**
     * Clear all caches
     */
    clearCaches(): void {
        this.analysisCache.clear();
        this.optimizationCache.clear();
        this.layoutCache.clear();
    }

    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker(): void {
        this.circuitBreaker.reset();
    }

    /**
     * Generate a new diagram from a description and optimize it
     */
    async generateAndOptimize(description: string, databaseType: string): Promise<AgentResult> {
        try {
            const startTime = Date.now();
            console.log('🤖 Schema Crew: Starting diagram generation...');

            // Step 1: Generate diagram
            console.log('  ↳ Agent 1: Generating diagram structure...');
            const diagram = await this.generator.generate({
                description,
                databaseType,
                name: this.extractName(description) || 'Generated Schema',
            });

            // Steps 2 & 3: Run analysis and optimization in parallel (with caching)
            console.log('  ↳ Agents 2 & 3: Analyzing schema and generating optimization recommendations in parallel...');
            
            const diagramKey = this.analysisCache.generateKey('diagram', diagram);
            
            const analysisPromise = (async () => {
                const cached = this.analysisCache.get(diagramKey);
                if (cached) {
                    console.log('    ⚡ Using cached analysis');
                    return cached;
                }
                const result = await this.analyzer.analyze(diagram);
                this.analysisCache.set(diagramKey, result);
                return result;
            })();

            const optimizationPromise = (async () => {
                const cached = this.optimizationCache.get(diagramKey);
                if (cached) {
                    console.log('    ⚡ Using cached optimization');
                    return cached;
                }
                const result = await this.optimizer.optimize(diagram);
                this.optimizationCache.set(diagramKey, result);
                return result;
            })();

            const [analysis, optimization] = await Promise.all([
                analysisPromise,
                optimizationPromise,
            ]);

            // Step 4: Generate layout (with caching)
            console.log('  ↳ Agent 4: Optimizing layout...');
            const layoutKey = this.layoutCache.generateKey('layout', diagram);
            let layout = this.layoutCache.get(layoutKey);
            if (!layout) {
                layout = await this.generator.optimizeLayout(diagram);
                this.layoutCache.set(layoutKey, layout);
            } else {
                console.log('    ⚡ Using cached layout');
            }

            const executionTime = Date.now() - startTime;
            console.log(`✅ Schema Crew: Complete in ${executionTime}ms!`);

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
                    executionTimeMs: executionTime,
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
            const startTime = Date.now();
            console.log('🤖 Schema Crew: Starting diagram analysis...');

            // Step 1: Analyze schema and get optimization recommendations in parallel (with caching)
            console.log('  ↳ Agents 1 & 2: Analyzing schema and creating optimization plan in parallel...');
            
            const diagramKey = this.analysisCache.generateKey('diagram', diagram);
            
            const analysisPromise = (async () => {
                const cached = this.analysisCache.get(diagramKey);
                if (cached) {
                    console.log('    ⚡ Using cached analysis');
                    return cached;
                }
                const result = await this.analyzer.analyze(diagram);
                this.analysisCache.set(diagramKey, result);
                return result;
            })();

            const optimizationPromise = (async () => {
                const cached = this.optimizationCache.get(diagramKey);
                if (cached) {
                    console.log('    ⚡ Using cached optimization');
                    return cached;
                }
                const result = await this.optimizer.optimize(diagram);
                this.optimizationCache.set(diagramKey, result);
                return result;
            })();

            const [analysis, optimization] = await Promise.all([
                analysisPromise,
                optimizationPromise,
            ]);

            // Step 2 & 3: Generate reports in parallel
            console.log('  ↳ Agents 3 & 4: Generating reports in parallel...');
            const [analysisReport, optimizationPlan] = await Promise.all([
                this.analyzer.generateReport(analysis),
                this.optimizer.generateOptimizationPlan(optimization),
            ]);

            const executionTime = Date.now() - startTime;
            console.log(`✅ Schema Crew: Complete in ${executionTime}ms!`);

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
                    executionTimeMs: executionTime,
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
            const startTime = Date.now();
            console.log('🤖 Schema Crew: Starting optimization...');

            // Step 1 & 2: Run analysis, optimization, and layout in parallel (with caching)
            console.log('  ↳ Agents 1, 2, & 3: Analyzing, optimizing, and generating layout in parallel...');
            
            const diagramKey = this.analysisCache.generateKey('diagram', diagram);
            const layoutKey = this.layoutCache.generateKey('layout', diagram);
            
            const analysisPromise = (async () => {
                const cached = this.analysisCache.get(diagramKey);
                if (cached) {
                    console.log('    ⚡ Using cached analysis');
                    return cached;
                }
                const result = await this.analyzer.analyze(diagram);
                this.analysisCache.set(diagramKey, result);
                return result;
            })();

            const optimizationPromise = (async () => {
                const cached = this.optimizationCache.get(diagramKey);
                if (cached) {
                    console.log('    ⚡ Using cached optimization');
                    return cached;
                }
                const result = await this.optimizer.optimize(diagram);
                this.optimizationCache.set(diagramKey, result);
                return result;
            })();

            const layoutPromise = (async () => {
                const cached = this.layoutCache.get(layoutKey);
                if (cached) {
                    console.log('    ⚡ Using cached layout');
                    return cached;
                }
                const result = await this.generator.optimizeLayout(diagram);
                this.layoutCache.set(layoutKey, result);
                return result;
            })();

            const [analysis, optimization, layout] = await Promise.all([
                analysisPromise,
                optimizationPromise,
                layoutPromise,
            ]);

            // Step 3: Create optimization plan
            console.log('  ↳ Agent 4: Creating implementation plan...');
            const plan = await this.optimizer.generateOptimizationPlan(optimization);

            const executionTime = Date.now() - startTime;
            console.log(`✅ Schema Crew: Complete in ${executionTime}ms!`);

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
                    executionTimeMs: executionTime,
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
            const startTime = Date.now();
            console.log('🤖 Schema Crew: Starting validation...');

            console.log('  ↳ Agent: Analyzing for issues...');
            
            const diagramKey = this.analysisCache.generateKey('diagram', diagram);
            let analysis = this.analysisCache.get(diagramKey);
            if (!analysis) {
                analysis = await this.analyzer.analyze(diagram);
                this.analysisCache.set(diagramKey, analysis);
            } else {
                console.log('    ⚡ Using cached analysis');
            }

            const errors = analysis.issues.filter(i => i.severity === 'error');
            const warnings = analysis.issues.filter(i => i.severity === 'warning');

            const isValid = errors.length === 0;

            const executionTime = Date.now() - startTime;
            console.log(`✅ Schema Crew: Validation complete in ${executionTime}ms - ${isValid ? 'PASSED' : 'FAILED'}`);

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
                    executionTimeMs: executionTime,
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

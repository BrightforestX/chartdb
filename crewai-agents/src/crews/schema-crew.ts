/**
 * Schema Crew - Orchestrates multiple agents for comprehensive schema management
 */

import { SchemaAnalyzerAgent } from '../agents/schema-analyzer.js';
import { DiagramGeneratorAgent } from '../agents/diagram-generator.js';
import { OptimizationAgent } from '../agents/optimization-agent.js';
import type { Diagram } from '../agents/schema-analyzer.js';
import type {
    AgentResult,
    SchemaAnalysis,
    OptimizationReport,
    GenerateAndOptimizeResult,
    AnalyzeDiagramResult,
    OptimizeDiagramResult,
    ValidateDiagramResult,
} from '../types.js';
import {
    CircuitBreaker,
    retryWithBackoff,
    AgentError,
    CircuitBreakerError,
    type RetryOptions,
    type CircuitBreakerOptions,
} from '../utils/error-handler.js';
import { AgentCache, generateCacheKey, type CacheStats } from '../utils/cache.js';
import { PerformanceMonitor } from '../utils/performance-monitor.js';
import { AgentCommunicationBus, createEvent, type MessageHandler } from '../utils/agent-protocol.js';

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
};

const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000,
};

export class SchemaCrew {
    private analyzer: SchemaAnalyzerAgent;
    private generator: DiagramGeneratorAgent;
    private optimizer: OptimizationAgent;
    private circuitBreakers: Map<string, CircuitBreaker>;
    private analysisCache: AgentCache<SchemaAnalysis>;
    private optimizationCache: AgentCache<OptimizationReport>;
    private layoutCache: AgentCache<any>;
    private performanceMonitor: PerformanceMonitor;
    private communicationBus: AgentCommunicationBus;

    constructor(
        private retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS,
        private circuitBreakerOptions: CircuitBreakerOptions = DEFAULT_CIRCUIT_BREAKER_OPTIONS,
        cacheTTL: number = 300000
    ) {
        this.analyzer = new SchemaAnalyzerAgent();
        this.generator = new DiagramGeneratorAgent();
        this.optimizer = new OptimizationAgent();
        
        this.circuitBreakers = new Map([
            ['analyzer', new CircuitBreaker('Schema Analyzer', circuitBreakerOptions)],
            ['generator', new CircuitBreaker('Diagram Generator', circuitBreakerOptions)],
            ['optimizer', new CircuitBreaker('Schema Optimizer', circuitBreakerOptions)],
        ]);

        this.analysisCache = new AgentCache<SchemaAnalysis>(cacheTTL);
        this.optimizationCache = new AgentCache<OptimizationReport>(cacheTTL);
        this.layoutCache = new AgentCache(cacheTTL);
        this.performanceMonitor = new PerformanceMonitor();
        this.communicationBus = new AgentCommunicationBus();

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.communicationBus.subscribe('orchestrator', (message) => {
            console.log(`📨 [Orchestrator] Received: ${message.type} from ${message.sender}`);
        });
    }

    private async executeWithResilience<T>(
        agentName: string,
        operation: string,
        fn: () => Promise<T>
    ): Promise<T> {
        const breaker = this.circuitBreakers.get(agentName);
        
        if (!breaker) {
            throw new Error(`No circuit breaker found for ${agentName}`);
        }

        return breaker.execute(() =>
            retryWithBackoff(fn, this.retryOptions, { agentName, operation })
        );
    }

    /**
     * Generate a new diagram from a description and optimize it
     */
    async generateAndOptimize(description: string, databaseType: string): Promise<AgentResult<GenerateAndOptimizeResult>> {
        const startTime = performance.now();
        
        try {
            console.log('🤖 Schema Crew: Starting diagram generation...');
            
            this.communicationBus.send({
                type: 'event',
                sender: 'orchestrator',
                payload: createEvent('generation_started', { description, databaseType }),
            });

            // Step 1: Generate diagram with resilience
            console.log('  ↳ Agent 1: Generating diagram structure...');
            const genStart = performance.now();
            const diagram = await this.executeWithResilience(
                'generator',
                'generate',
                () => this.generator.generate({
                    description,
                    databaseType,
                    name: this.extractName(description) || 'Generated Schema',
                })
            );
            const genTime = performance.now() - genStart;

            // Step 2 & 3: Analyze and optimize in parallel (independent operations)
            console.log('  ↳ Agents 2 & 3: Analyzing and optimizing in parallel...');
            const parallelStart = performance.now();
            const [analysis, optimization, layout] = await Promise.all([
                this.executeWithResilience('analyzer', 'analyze', () =>
                    this.analyzer.analyze(diagram)
                ),
                this.executeWithResilience('optimizer', 'optimize', () =>
                    this.optimizer.optimize(diagram)
                ),
                this.executeWithResilience('generator', 'optimizeLayout', () =>
                    this.generator.optimizeLayout(diagram)
                ),
            ]);
            const parallelTime = performance.now() - parallelStart;

            const totalTime = performance.now() - startTime;
            console.log(`✅ Schema Crew: Complete! (${totalTime.toFixed(0)}ms)`);
            console.log(`   Generation: ${genTime.toFixed(0)}ms, Parallel processing: ${parallelTime.toFixed(0)}ms`);

            this.communicationBus.send({
                type: 'event',
                sender: 'orchestrator',
                payload: createEvent('generation_completed', {
                    totalTime,
                    cacheStats: this.getCacheStats(),
                }),
            });

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
                    executionTime: totalTime,
                    timing: {
                        generation: genTime,
                        parallel: parallelTime,
                    },
                },
            };
        } catch (error) {
            const totalTime = performance.now() - startTime;
            console.error(`❌ Schema Crew: Failed (${totalTime.toFixed(0)}ms)`, error);
            
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                metadata: {
                    executionTime: totalTime,
                    errorType: error instanceof CircuitBreakerError ? 'circuit_breaker' :
                                error instanceof AgentError ? 'agent_error' : 'unknown',
                    errorDetails: error instanceof AgentError ? {
                        agentName: error.agentName,
                        operation: error.operation,
                        retryable: error.retryable,
                        cause: error.cause?.message,
                    } : undefined,
                },
            };
        }
    }

    /**
     * Analyze an existing diagram
     */
    async analyzeDiagram(diagram: Diagram): Promise<AgentResult<AnalyzeDiagramResult>> {
        const startTime = performance.now();
        
        try {
            console.log('🤖 Schema Crew: Starting diagram analysis...');

            // Step 1 & 2: Run analysis and optimization in parallel with resilience and caching
            console.log('  ↳ Agents 1 & 2: Analyzing schema and generating optimization in parallel...');
            const parallelStart = performance.now();
            const cacheKey = this.generateDiagramCacheKey(diagram);
            
            const [analysisResult, optimizationResult] = await Promise.all([
                this.getCachedOrExecute(
                    this.analysisCache,
                    `analysis:${cacheKey}`,
                    () => this.executeWithResilience('analyzer', 'analyze', () =>
                        this.analyzer.analyze(diagram)
                    ),
                    'Schema Analyzer',
                    'analyze'
                ),
                this.getCachedOrExecute(
                    this.optimizationCache,
                    `optimization:${cacheKey}`,
                    () => this.executeWithResilience('optimizer', 'optimize', () =>
                        this.optimizer.optimize(diagram)
                    ),
                    'Schema Optimizer',
                    'optimize'
                ),
            ]);
            
            const analysis = analysisResult.value;
            const optimization = optimizationResult.value;
            const parallelTime = performance.now() - parallelStart;

            // Step 3 & 4: Generate reports in parallel (depend on previous results)
            console.log('  ↳ Agents 3 & 4: Generating reports in parallel...');
            const reportStart = performance.now();
            const [analysisReport, optimizationPlan] = await Promise.all([
                this.executeWithResilience('analyzer', 'generateReport', () =>
                    this.analyzer.generateReport(analysis)
                ),
                this.executeWithResilience('optimizer', 'generateOptimizationPlan', () =>
                    this.optimizer.generateOptimizationPlan(optimization)
                ),
            ]);
            const reportTime = performance.now() - reportStart;

            const totalTime = performance.now() - startTime;
            const cacheHits = [analysisResult.cached, optimizationResult.cached].filter(Boolean).length;
            console.log(`✅ Schema Crew: Complete! (${totalTime.toFixed(0)}ms)`);
            console.log(`   Analysis: ${parallelTime.toFixed(0)}ms, Reports: ${reportTime.toFixed(0)}ms, Cache hits: ${cacheHits}/2`);

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
                    executionTime: totalTime,
                    timing: {
                        parallel: parallelTime,
                        reports: reportTime,
                    },
                    cache: {
                        hits: cacheHits,
                        total: 2,
                    },
                },
            };
        } catch (error) {
            const totalTime = performance.now() - startTime;
            console.error(`❌ Schema Crew: Analysis failed (${totalTime.toFixed(0)}ms)`, error);
            
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                metadata: {
                    executionTime: totalTime,
                    errorType: error instanceof CircuitBreakerError ? 'circuit_breaker' :
                                error instanceof AgentError ? 'agent_error' : 'unknown',
                    errorDetails: error instanceof AgentError ? {
                        agentName: error.agentName,
                        operation: error.operation,
                        retryable: error.retryable,
                        cause: error.cause?.message,
                    } : undefined,
                },
            };
        }
    }

    /**
     * Optimize an existing diagram
     */
    async optimizeDiagram(diagram: Diagram): Promise<AgentResult<OptimizeDiagramResult>> {
        const startTime = performance.now();
        
        try {
            console.log('🤖 Schema Crew: Starting optimization...');

            // Step 1 & 2: Run analysis, optimization, and layout in parallel with resilience and caching
            console.log('  ↳ Agents 1, 2 & 3: Analyzing, optimizing, and layouting in parallel...');
            const parallelStart = performance.now();
            const cacheKey = this.generateDiagramCacheKey(diagram);
            
            const [analysisResult, optimizationResult, layoutResult] = await Promise.all([
                this.getCachedOrExecute(
                    this.analysisCache,
                    `analysis:${cacheKey}`,
                    () => this.executeWithResilience('analyzer', 'analyze', () =>
                        this.analyzer.analyze(diagram)
                    ),
                    'Schema Analyzer',
                    'analyze'
                ),
                this.getCachedOrExecute(
                    this.optimizationCache,
                    `optimization:${cacheKey}`,
                    () => this.executeWithResilience('optimizer', 'optimize', () =>
                        this.optimizer.optimize(diagram)
                    ),
                    'Schema Optimizer',
                    'optimize'
                ),
                this.getCachedOrExecute(
                    this.layoutCache,
                    `layout:${cacheKey}`,
                    () => this.executeWithResilience('generator', 'optimizeLayout', () =>
                        this.generator.optimizeLayout(diagram)
                    ),
                    'Diagram Generator',
                    'optimizeLayout'
                ),
            ]);
            
            const analysis = analysisResult.value;
            const optimization = optimizationResult.value;
            const layout = layoutResult.value;
            const parallelTime = performance.now() - parallelStart;

            // Step 3: Create optimization plan (depends on optimization result)
            console.log('  ↳ Agent 4: Creating implementation plan...');
            const planStart = performance.now();
            const plan = await this.executeWithResilience('optimizer', 'generateOptimizationPlan', () =>
                this.optimizer.generateOptimizationPlan(optimization)
            );
            const planTime = performance.now() - planStart;

            const totalTime = performance.now() - startTime;
            const cacheHits = [
                analysisResult.cached,
                optimizationResult.cached,
                layoutResult.cached,
            ].filter(Boolean).length;
            console.log(`✅ Schema Crew: Complete! (${totalTime.toFixed(0)}ms)`);
            console.log(`   Parallel processing: ${parallelTime.toFixed(0)}ms, Plan generation: ${planTime.toFixed(0)}ms, Cache hits: ${cacheHits}/3`);

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
                    executionTime: totalTime,
                    timing: {
                        parallel: parallelTime,
                        plan: planTime,
                    },
                    cache: {
                        hits: cacheHits,
                        total: 3,
                    },
                },
            };
        } catch (error) {
            const totalTime = performance.now() - startTime;
            console.error(`❌ Schema Crew: Optimization failed (${totalTime.toFixed(0)}ms)`, error);
            
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                metadata: {
                    executionTime: totalTime,
                    errorType: error instanceof CircuitBreakerError ? 'circuit_breaker' :
                                error instanceof AgentError ? 'agent_error' : 'unknown',
                    errorDetails: error instanceof AgentError ? {
                        agentName: error.agentName,
                        operation: error.operation,
                        retryable: error.retryable,
                        cause: error.cause?.message,
                    } : undefined,
                },
            };
        }
    }

    /**
     * Validate a diagram for issues
     */
    async validateDiagram(diagram: Diagram): Promise<AgentResult<ValidateDiagramResult>> {
        const startTime = performance.now();
        
        try {
            console.log('🤖 Schema Crew: Starting validation...');

            console.log('  ↳ Agent: Analyzing for issues...');
            const analysis = await this.executeWithResilience('analyzer', 'analyze', () =>
                this.analyzer.analyze(diagram)
            );

            const errors = analysis.issues.filter(i => i.severity === 'error');
            const warnings = analysis.issues.filter(i => i.severity === 'warning');

            const isValid = errors.length === 0;

            const totalTime = performance.now() - startTime;
            console.log(`✅ Schema Crew: Validation complete - ${isValid ? 'PASSED' : 'FAILED'} (${totalTime.toFixed(0)}ms)`);

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
                    executionTime: totalTime,
                },
            };
        } catch (error) {
            const totalTime = performance.now() - startTime;
            console.error(`❌ Schema Crew: Validation failed (${totalTime.toFixed(0)}ms)`, error);
            
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                metadata: {
                    executionTime: totalTime,
                    errorType: error instanceof CircuitBreakerError ? 'circuit_breaker' :
                                error instanceof AgentError ? 'agent_error' : 'unknown',
                    errorDetails: error instanceof AgentError ? {
                        agentName: error.agentName,
                        operation: error.operation,
                        retryable: error.retryable,
                        cause: error.cause?.message,
                    } : undefined,
                },
            };
        }
    }

    getCircuitBreakerStatus(): Record<string, string> {
        return {
            analyzer: this.circuitBreakers.get('analyzer')!.getState(),
            generator: this.circuitBreakers.get('generator')!.getState(),
            optimizer: this.circuitBreakers.get('optimizer')!.getState(),
        };
    }

    getCacheStats(): Record<string, CacheStats> {
        return {
            analysis: this.analysisCache.getStats(),
            optimization: this.optimizationCache.getStats(),
            layout: this.layoutCache.getStats(),
        };
    }

    clearCache(): void {
        this.analysisCache.clear();
        this.optimizationCache.clear();
        this.layoutCache.clear();
        console.log('🗑️ All caches cleared');
    }

    getPerformanceStats(): Record<string, any> {
        return {
            overall: this.performanceMonitor.getStats(),
            byAgent: this.performanceMonitor.getMetricsByAgent(),
            byOperation: this.performanceMonitor.getMetricsByOperation(),
            recent: this.performanceMonitor.getRecentMetrics(10),
        };
    }

    generatePerformanceReport(): string {
        return this.performanceMonitor.generateReport();
    }

    clearPerformanceMetrics(): void {
        this.performanceMonitor.clearMetrics();
        console.log('🗑️ Performance metrics cleared');
    }

    getCommunicationLog(count?: number): any[] {
        return this.communicationBus.getMessageLog(count);
    }

    subscribeToEvents(handler: MessageHandler): void {
        this.communicationBus.subscribe('orchestrator', handler);
    }

    private generateDiagramCacheKey(diagram: Diagram): string {
        return generateCacheKey('diagram', diagram.id, diagram.databaseType, diagram.tables.length);
    }

    private async getCachedOrExecute<T>(
        cache: AgentCache<T>,
        key: string,
        operation: () => Promise<T>,
        agentName: string,
        operationName: string
    ): Promise<{ value: T; cached: boolean }> {
        const cached = cache.get(key);
        
        if (cached !== undefined) {
            console.log(`  📦 Cache hit for key: ${key}`);
            this.performanceMonitor.recordMetric({
                operationName,
                agentName,
                duration: 0,
                timestamp: Date.now(),
                success: true,
                cached: true,
            });
            return { value: cached, cached: true };
        }

        const value = await this.performanceMonitor.track(
            operationName,
            agentName,
            operation,
            false
        );
        cache.set(key, value);
        return { value, cached: false };
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

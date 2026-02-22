/**
 * Types for CrewAI agents
 */

export interface SchemaAnalysis {
    tableCount: number;
    relationshipCount: number;
    normalizedScore: number;
    issues: SchemaIssue[];
    suggestions: SchemaSuggestion[];
}

export interface SchemaIssue {
    severity: 'error' | 'warning' | 'info';
    type: string;
    description: string;
    affectedTables: string[];
    recommendation: string;
}

export interface SchemaSuggestion {
    type: 'index' | 'normalization' | 'naming' | 'datatype' | 'relationship';
    priority: 'high' | 'medium' | 'low';
    description: string;
    implementation: string;
}

export interface DiagramLayout {
    tables: TablePosition[];
    areas: AreaDefinition[];
}

export interface TablePosition {
    tableId: string;
    x: number;
    y: number;
}

export interface AreaDefinition {
    name: string;
    tables: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
}

export interface OptimizationReport {
    overall: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    score: number;
    metrics: {
        normalization: number;
        indexing: number;
        naming: number;
        relationships: number;
    };
    recommendations: SchemaSuggestion[];
}

export interface AgentResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: AgentMetadata;
}

export interface AgentMetadata {
    agentsUsed?: string[];
    timestamp?: string;
    executionTime?: number;
    timing?: Record<string, number>;
    cache?: CacheMetadata;
    errorType?: 'circuit_breaker' | 'agent_error' | 'unknown';
    errorDetails?: {
        agentName?: string;
        operation?: string;
        retryable?: boolean;
        cause?: string;
    };
}

export interface CacheMetadata {
    hits: number;
    total: number;
}

export interface GenerateAndOptimizeResult {
    diagram: any;
    analysis: SchemaAnalysis;
    optimization: OptimizationReport;
    layout: DiagramLayout;
}

export interface AnalyzeDiagramResult {
    analysis: SchemaAnalysis;
    analysisReport: string;
    optimization: OptimizationReport;
    optimizationPlan: string;
}

export interface OptimizeDiagramResult {
    currentAnalysis: SchemaAnalysis;
    optimization: OptimizationReport;
    plan: string;
    layout: DiagramLayout;
}

export interface ValidateDiagramResult {
    isValid: boolean;
    errors: SchemaIssue[];
    warnings: SchemaIssue[];
    summary: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
    };
}

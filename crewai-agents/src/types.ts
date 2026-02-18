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

export interface AgentResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: Record<string, any>;
}

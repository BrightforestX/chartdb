/**
 * Comprehensive Monitoring and Metrics
 */

export interface AgentMetrics {
    agentName: string;
    executionCount: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    errorCount: number;
    successCount: number;
    successRate: number;
    lastExecutionTime: number | null;
    lastError: string | null;
}

export interface OperationMetrics {
    operationName: string;
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    p99Duration: number;
}

export interface CacheMetrics {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    evictions: number;
}

export interface SystemMetrics {
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    avgResponseTime: number;
    uptime: number;
    memoryUsage?: NodeJS.MemoryUsage;
}

export class MetricsCollector {
    private startTime: number;
    private agentMetrics: Map<string, AgentMetrics>;
    private operationMetrics: Map<string, { durations: number[]; count: number }>;
    private errorLog: Array<{ timestamp: number; agent: string; error: string }>;
    private requestCount: number = 0;
    private errorCount: number = 0;

    constructor() {
        this.startTime = Date.now();
        this.agentMetrics = new Map();
        this.operationMetrics = new Map();
        this.errorLog = [];
    }

    /**
     * Record agent execution
     */
    recordAgentExecution(
        agentName: string,
        duration: number,
        success: boolean,
        error?: string
    ): void {
        this.requestCount++;
        
        const existing = this.agentMetrics.get(agentName) || {
            agentName,
            executionCount: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            errorCount: 0,
            successCount: 0,
            successRate: 0,
            lastExecutionTime: null,
            lastError: null,
        };

        existing.executionCount++;
        existing.totalExecutionTime += duration;
        existing.averageExecutionTime = existing.totalExecutionTime / existing.executionCount;
        existing.lastExecutionTime = duration;

        if (success) {
            existing.successCount++;
        } else {
            existing.errorCount++;
            existing.lastError = error || 'Unknown error';
            this.errorCount++;
            
            this.errorLog.push({
                timestamp: Date.now(),
                agent: agentName,
                error: error || 'Unknown error',
            });
        }

        existing.successRate = existing.successCount / existing.executionCount;
        this.agentMetrics.set(agentName, existing);
    }

    /**
     * Record operation duration
     */
    recordOperation(operationName: string, duration: number): void {
        const existing = this.operationMetrics.get(operationName) || {
            durations: [],
            count: 0,
        };

        existing.durations.push(duration);
        existing.count++;

        if (existing.durations.length > 1000) {
            existing.durations.shift();
        }

        this.operationMetrics.set(operationName, existing);
    }

    /**
     * Get agent metrics
     */
    getAgentMetrics(agentName?: string): AgentMetrics | Map<string, AgentMetrics> {
        if (agentName) {
            return this.agentMetrics.get(agentName) || this.createEmptyAgentMetrics(agentName);
        }
        return new Map(this.agentMetrics);
    }

    /**
     * Get operation metrics
     */
    getOperationMetrics(operationName?: string): OperationMetrics | Map<string, OperationMetrics> {
        if (operationName) {
            const data = this.operationMetrics.get(operationName);
            if (!data) {
                return this.createEmptyOperationMetrics(operationName);
            }
            return this.calculateOperationMetrics(operationName, data);
        }

        const result = new Map<string, OperationMetrics>();
        for (const [name, data] of this.operationMetrics.entries()) {
            result.set(name, this.calculateOperationMetrics(name, data));
        }
        return result;
    }

    /**
     * Get system metrics
     */
    getSystemMetrics(): SystemMetrics {
        const uptime = Date.now() - this.startTime;
        
        let totalDuration = 0;
        let totalCount = 0;
        
        for (const data of this.operationMetrics.values()) {
            totalDuration += data.durations.reduce((sum, d) => sum + d, 0);
            totalCount += data.count;
        }

        const avgResponseTime = totalCount > 0 ? totalDuration / totalCount : 0;
        const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;

        return {
            totalRequests: this.requestCount,
            totalErrors: this.errorCount,
            errorRate,
            avgResponseTime,
            uptime,
            memoryUsage: typeof process !== 'undefined' ? process.memoryUsage() : undefined,
        };
    }

    /**
     * Get error log
     */
    getErrorLog(limit: number = 50): Array<{ timestamp: number; agent: string; error: string; ago: string }> {
        const now = Date.now();
        return this.errorLog
            .slice(-limit)
            .reverse()
            .map(entry => ({
                ...entry,
                ago: this.formatTimeAgo(now - entry.timestamp),
            }));
    }

    /**
     * Get dashboard summary
     */
    getDashboard(): string {
        const system = this.getSystemMetrics();
        const agents = Array.from(this.agentMetrics.values());
        const operations = Array.from(this.operationMetrics.entries()).map(([name, data]) =>
            this.calculateOperationMetrics(name, data)
        );

        let dashboard = '═══════════════════════════════════════════\n';
        dashboard += '         CREWAI METRICS DASHBOARD          \n';
        dashboard += '═══════════════════════════════════════════\n\n';

        dashboard += '📊 SYSTEM METRICS\n';
        dashboard += '─────────────────────────────────────────\n';
        dashboard += `  Total Requests:    ${system.totalRequests}\n`;
        dashboard += `  Total Errors:      ${system.totalErrors}\n`;
        dashboard += `  Error Rate:        ${(system.errorRate * 100).toFixed(2)}%\n`;
        dashboard += `  Avg Response Time: ${system.avgResponseTime.toFixed(2)}ms\n`;
        dashboard += `  Uptime:            ${this.formatDuration(system.uptime)}\n`;
        
        if (system.memoryUsage) {
            dashboard += `  Memory (RSS):      ${(system.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB\n`;
        }
        dashboard += '\n';

        dashboard += '🤖 AGENT METRICS\n';
        dashboard += '─────────────────────────────────────────\n';
        for (const agent of agents) {
            dashboard += `  ${agent.agentName}:\n`;
            dashboard += `    Executions: ${agent.executionCount}\n`;
            dashboard += `    Success Rate: ${(agent.successRate * 100).toFixed(2)}%\n`;
            dashboard += `    Avg Time: ${agent.averageExecutionTime.toFixed(2)}ms\n`;
        }
        dashboard += '\n';

        dashboard += '⚡ OPERATION METRICS (Top 5)\n';
        dashboard += '─────────────────────────────────────────\n';
        const topOps = operations.slice(0, 5);
        for (const op of topOps) {
            dashboard += `  ${op.operationName}:\n`;
            dashboard += `    Count: ${op.count}\n`;
            dashboard += `    Avg: ${op.averageDuration.toFixed(2)}ms\n`;
            dashboard += `    P95: ${op.p95Duration.toFixed(2)}ms\n`;
        }
        dashboard += '\n';

        const recentErrors = this.getErrorLog(3);
        if (recentErrors.length > 0) {
            dashboard += '❌ RECENT ERRORS\n';
            dashboard += '─────────────────────────────────────────\n';
            for (const error of recentErrors) {
                dashboard += `  [${error.ago}] ${error.agent}: ${error.error}\n`;
            }
            dashboard += '\n';
        }

        dashboard += '═══════════════════════════════════════════\n';
        return dashboard;
    }

    /**
     * Reset all metrics
     */
    reset(): void {
        this.startTime = Date.now();
        this.agentMetrics.clear();
        this.operationMetrics.clear();
        this.errorLog = [];
        this.requestCount = 0;
        this.errorCount = 0;
    }

    /**
     * Export metrics as JSON
     */
    export(): string {
        return JSON.stringify({
            system: this.getSystemMetrics(),
            agents: Array.from(this.agentMetrics.values()),
            operations: Array.from(this.operationMetrics.entries()).map(([name, data]) =>
                this.calculateOperationMetrics(name, data)
            ),
            errors: this.errorLog,
        }, null, 2);
    }

    private createEmptyAgentMetrics(name: string): AgentMetrics {
        return {
            agentName: name,
            executionCount: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            errorCount: 0,
            successCount: 0,
            successRate: 0,
            lastExecutionTime: null,
            lastError: null,
        };
    }

    private createEmptyOperationMetrics(name: string): OperationMetrics {
        return {
            operationName: name,
            count: 0,
            totalDuration: 0,
            averageDuration: 0,
            minDuration: 0,
            maxDuration: 0,
            p95Duration: 0,
            p99Duration: 0,
        };
    }

    private calculateOperationMetrics(
        name: string,
        data: { durations: number[]; count: number }
    ): OperationMetrics {
        const durations = data.durations;
        const sorted = [...durations].sort((a, b) => a - b);
        
        const total = durations.reduce((sum, d) => sum + d, 0);
        const avg = total / durations.length;
        
        const p95Index = Math.floor(sorted.length * 0.95);
        const p99Index = Math.floor(sorted.length * 0.99);

        return {
            operationName: name,
            count: data.count,
            totalDuration: total,
            averageDuration: avg,
            minDuration: sorted[0] || 0,
            maxDuration: sorted[sorted.length - 1] || 0,
            p95Duration: sorted[p95Index] || 0,
            p99Duration: sorted[p99Index] || 0,
        };
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    private formatTimeAgo(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}

/**
 * Global metrics collector instance
 */
export const metrics = new MetricsCollector();

/**
 * Decorator for monitoring agent methods
 */
export function monitored(agentName: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const startTime = Date.now();
            let success = true;
            let error: string | undefined;

            try {
                const result = await originalMethod.apply(this, args);
                return result;
            } catch (err) {
                success = false;
                error = err instanceof Error ? err.message : String(err);
                throw err;
            } finally {
                const duration = Date.now() - startTime;
                metrics.recordAgentExecution(agentName, duration, success, error);
                metrics.recordOperation(`${agentName}.${propertyKey}`, duration);
            }
        };

        return descriptor;
    };
}

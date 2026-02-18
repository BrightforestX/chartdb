/**
 * Performance monitoring for agent operations
 */

export interface PerformanceMetric {
    operationName: string;
    agentName: string;
    duration: number;
    timestamp: number;
    success: boolean;
    cached: boolean;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
}

export interface PerformanceStats {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    cacheHitRate: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
}

export class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private maxMetrics: number;

    constructor(maxMetrics: number = 1000) {
        this.maxMetrics = maxMetrics;
    }

    recordMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric);

        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift();
        }
    }

    async track<T>(
        operationName: string,
        agentName: string,
        operation: () => Promise<T>,
        cached: boolean = false
    ): Promise<T> {
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();
        let success = true;

        try {
            const result = await operation();
            return result;
        } catch (error) {
            success = false;
            throw error;
        } finally {
            const duration = performance.now() - startTime;
            const endMemory = this.getMemoryUsage();

            this.recordMetric({
                operationName,
                agentName,
                duration,
                timestamp: Date.now(),
                success,
                cached,
                memoryUsage: {
                    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                    heapTotal: endMemory.heapTotal,
                    external: endMemory.external,
                },
            });
        }
    }

    getStats(filterAgent?: string, filterOperation?: string): PerformanceStats {
        let filtered = this.metrics;

        if (filterAgent) {
            filtered = filtered.filter(m => m.agentName === filterAgent);
        }

        if (filterOperation) {
            filtered = filtered.filter(m => m.operationName === filterOperation);
        }

        if (filtered.length === 0) {
            return {
                totalOperations: 0,
                successfulOperations: 0,
                failedOperations: 0,
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                cacheHitRate: 0,
                p50Duration: 0,
                p95Duration: 0,
                p99Duration: 0,
            };
        }

        const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
        const successCount = filtered.filter(m => m.success).length;
        const cacheHits = filtered.filter(m => m.cached).length;

        return {
            totalOperations: filtered.length,
            successfulOperations: successCount,
            failedOperations: filtered.length - successCount,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: durations[0],
            maxDuration: durations[durations.length - 1],
            cacheHitRate: cacheHits / filtered.length,
            p50Duration: this.percentile(durations, 0.5),
            p95Duration: this.percentile(durations, 0.95),
            p99Duration: this.percentile(durations, 0.99),
        };
    }

    getMetricsByAgent(): Record<string, PerformanceStats> {
        const agents = new Set(this.metrics.map(m => m.agentName));
        const result: Record<string, PerformanceStats> = {};

        for (const agent of agents) {
            result[agent] = this.getStats(agent);
        }

        return result;
    }

    getMetricsByOperation(): Record<string, PerformanceStats> {
        const operations = new Set(this.metrics.map(m => m.operationName));
        const result: Record<string, PerformanceStats> = {};

        for (const operation of operations) {
            result[operation] = this.getStats(undefined, operation);
        }

        return result;
    }

    getRecentMetrics(count: number = 10): PerformanceMetric[] {
        return this.metrics.slice(-count);
    }

    clearMetrics(): void {
        this.metrics = [];
    }

    generateReport(): string {
        const stats = this.getStats();
        const byAgent = this.getMetricsByAgent();

        let report = '# Performance Report\n\n';
        report += `## Overall Statistics\n\n`;
        report += `- Total Operations: ${stats.totalOperations}\n`;
        report += `- Success Rate: ${((stats.successfulOperations / stats.totalOperations) * 100).toFixed(1)}%\n`;
        report += `- Average Duration: ${stats.averageDuration.toFixed(2)}ms\n`;
        report += `- Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%\n`;
        report += `- P50 Duration: ${stats.p50Duration.toFixed(2)}ms\n`;
        report += `- P95 Duration: ${stats.p95Duration.toFixed(2)}ms\n`;
        report += `- P99 Duration: ${stats.p99Duration.toFixed(2)}ms\n\n`;

        report += `## By Agent\n\n`;
        for (const [agent, agentStats] of Object.entries(byAgent)) {
            report += `### ${agent}\n`;
            report += `- Operations: ${agentStats.totalOperations}\n`;
            report += `- Average Duration: ${agentStats.averageDuration.toFixed(2)}ms\n`;
            report += `- Cache Hit Rate: ${(agentStats.cacheHitRate * 100).toFixed(1)}%\n\n`;
        }

        return report;
    }

    private percentile(sorted: number[], p: number): number {
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[Math.max(0, index)];
    }

    private getMemoryUsage(): { heapUsed: number; heapTotal: number; external: number } {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const mem = process.memoryUsage();
            return {
                heapUsed: mem.heapUsed,
                heapTotal: mem.heapTotal,
                external: mem.external,
            };
        }
        return { heapUsed: 0, heapTotal: 0, external: 0 };
    }
}
